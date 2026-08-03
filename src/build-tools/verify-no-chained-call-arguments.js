//region verify-no-chained-call-arguments
/**
 * Verifies that no plugin source file passes a multi-step expression chain as a call argument.
 *
 * The problem is reading order. An argument that is itself a chain has to be understood in full
 * before the reader learns what the outer call is even receiving, so the sentence is read
 * inside-out:
 *
 *   this.addBuiltCommand(new WindowCommandBuilder('Yes').setSymbol(this.confirmSymbol()).build());
 *
 * Named first and passed second, the same code says what it is doing at every line:
 *
 *   const yes = new WindowCommandBuilder('Yes')
 *     .setSymbol(this.confirmSymbol())
 *     .build();
 *
 *   this.addBuiltCommand(yes);
 *
 * The fix is always one of two things - hoist the chain to a `const`, or extract it into a small
 * builder method that returns the finished thing.
 *
 * **A single step is not policed.** `drawTextEx(this.prompt(), 0, 0, width)` and
 * `setRoot(new WeakMap())` read perfectly well, and banning them would cost the codebase a great
 * deal of clarity to buy none. Two steps is where a reader starts holding state in their head.
 *
 * **Callbacks are exempt.** A chain inside `map(entry => new SaveFileEntry(entry).describe())` is
 * that callback's business - it is a separate body, read on its own terms, and the enclosing call
 * receives a function rather than the chain's result.
 *
 * Usage:
 *   node src/build-tools/verify-no-chained-call-arguments.js
 */
import * as fs from 'fs/promises';
import { glob } from 'glob';
import * as acorn from 'acorn';
import Logger, { LogStyle } from './logger.js';

const SRC_PLUGINS_GLOB = './src/plugins/**/*.js';

/**
 * Files exempt from this rule, by basename.
 * @type {string[]}
 */
const EXEMPT_BASENAMES = [ '_annotations.js' ];

/**
 * How many chained steps an argument may carry before it has to be named.
 *
 * Two, because one is where a reader is still tracking a single idea - `foo(this.bar())` asks nothing
 * of them. At two they are holding an intermediate result that has no name, and the outer call's
 * meaning is still unknown to them while they do it.
 * @type {number}
 */
const MAXIMUM_CHAIN_STEPS = 1;

/**
 * Node types that open a new body, whose contents are read on their own terms.
 * @type {string[]}
 */
const FUNCTION_TYPES = [ 'FunctionExpression', 'ArrowFunctionExpression', 'FunctionDeclaration' ];

/**
 * Parses a source file into an AST with location data.
 * @param {string} source The raw source text.
 * @returns {object} The parsed program.
 */
const parse = source => acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'module', locations: true });

/**
 * Walks every node of an AST, invoking a visitor with each node.
 * @param {object} node The node to walk.
 * @param {(node: object) => void} visit The visitor.
 */
function walk(node, visit)
{
  // anything without a type is not a node worth descending into.
  if (!node || typeof node.type !== 'string') return;

  visit(node);

  for (const key of Object.keys(node))
  {
    // location metadata carries no child nodes.
    if (key === 'type' || key === 'loc' || key === 'range') continue;

    const child = node[key];

    if (Array.isArray(child))
    {
      child.forEach(entry => walk(entry, visit));
    }
    else if (child && typeof child.type === 'string')
    {
      walk(child, visit);
    }
  }
}

/**
 * Counts how many calls and constructions an expression chains together.
 *
 * Walks down the left spine only - the thing being called, then the thing that produced it - so
 * arguments nested inside the chain are counted by their own visit rather than inflating this one.
 * @param {object} node The expression to measure.
 * @returns {number} The number of chained steps.
 */
function chainSteps(node)
{
  let steps = 0;
  let current = node;

  while (current)
  {
    if (current.type === 'CallExpression' || current.type === 'NewExpression')
    {
      steps++;
      current = current.callee;
    }
    else if (current.type === 'MemberExpression')
    {
      current = current.object;
    }
    else
    {
      break;
    }
  }

  return steps;
}

/**
 * Renders the offending argument as source, trimmed to something readable in a report.
 * @param {string} source The raw source text.
 * @param {object} node The argument node.
 * @returns {string} A short rendering of the argument.
 */
function describe(source, node)
{
  const text = source.slice(node.start, node.end)
    .replace(/\s+/g, ' ');

  if (text.length <= 72) return text;

  return `${text.slice(0, 69)}...`;
}

/**
 * Collects every over-chained call argument in a single parsed source file.
 * @param {string} filePath The repository-relative file path.
 * @param {string} source The raw source text.
 * @param {object} ast The parsed source.
 * @returns {{filePath: string, line: number, detail: string}[]} The violations found.
 */
function collectViolations(filePath, source, ast)
{
  const violations = [];

  walk(ast, node =>
  {
    if (node.type !== 'CallExpression' && node.type !== 'NewExpression') return;

    for (const argument of node.arguments)
    {
      // a function passed as an argument is a body of its own, not a chain being resolved here.
      if (FUNCTION_TYPES.includes(argument.type)) continue;

      const steps = chainSteps(argument);

      if (steps <= MAXIMUM_CHAIN_STEPS) continue;

      violations.push({
        filePath,
        line: argument.loc.start.line,
        detail: `${steps}-step chain as an argument: ${describe(source, argument)}`,
      });
    }
  });

  return violations;
}

/**
 * Entry point.
 * @returns {Promise<number>} Exit code — 0 for clean, 1 for violations found.
 */
async function main()
{
  const files = await glob(SRC_PLUGINS_GLOB, {
    ignore: EXEMPT_BASENAMES.map(basename => `**/${basename}`),
  });

  const violations = [];

  for (const filePath of files)
  {
    let source;
    let ast;

    try
    {
      source = await fs.readFile(filePath, 'utf-8');
      ast = parse(source);
    }
    catch (error)
    {
      Logger.logAnyway(`  • ${filePath}: could not parse — ${error.message}`, LogStyle.brightRed);
      return 1;
    }

    violations.push(...collectViolations(filePath, source, ast));
  }

  if (violations.length === 0)
  {
    Logger.logAnyway('chained-call-argument verify: OK (no chains passed as arguments).', LogStyle.brightGreen);
    return 0;
  }

  Logger.logAnyway(`chained-call-argument verify FAILED: ${violations.length} violation(s) found.`, LogStyle.brightRed);
  Logger.logAnyway('  Name it first, then pass the name. A reader should not parse a pipeline to', LogStyle.brightYellow);
  Logger.logAnyway('  find out what the outer call is receiving.', LogStyle.brightYellow);

  for (const violation of violations)
  {
    Logger.logAnyway(`  • ${violation.filePath}:${violation.line}: ${violation.detail}`, LogStyle.brightRed);
  }

  return 1;
}

const exitCode = await main();
process.exit(exitCode);
//endregion verify-no-chained-call-arguments
