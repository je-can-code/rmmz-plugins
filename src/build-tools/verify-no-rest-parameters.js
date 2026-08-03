//region verify-no-rest-parameters
/**
 * Verifies that no function or constructor declares a rest parameter.
 *
 * A signature is a contract. `constructor(...args)` declares no contract at all: it states nothing
 * about how many arguments are expected, what order they come in, what they mean, or whether any of
 * them are required. A reader who wants to construct the thing has to go find `initialize` and read
 * that instead, and a reader who wants to change `initialize` has no way to see who is affected.
 *
 * The pattern is not even variadic in truth. Nine of these existed in this repository and every one
 * of them forwarded to an `initialize` with a fixed, known arity - two of them forwarded "zero or
 * more arguments" into a function that accepts none. The spread was not buying flexibility, it was
 * discarding information the signature already had.
 *
 * The fix is always the same: declare the parameters the target declares, defaults included.
 *
 *   // BAD - the contract is unknowable from the signature.
 *   constructor(...args)
 *   {
 *     super();
 *     this.initialize(...args);
 *   }
 *
 *   // GOOD - arity, names, types and defaults all stated.
 *   constructor(bitmapWidth = 128, bitmapHeight = 24, gaugeHeight = 10)
 *   {
 *     super();
 *     this.initialize(bitmapWidth, bitmapHeight, gaugeHeight);
 *   }
 *
 * **Optional is fine; unknowable is not.** A default parameter - `bustCache = false` - turns "the
 * caller passed nothing" into a named, typed, documented value. That is still a contract. A rest
 * parameter does the inverse, taking information the caller had and throwing it away at the border.
 *
 * **This bans rest parameters in a declaration, not the spread operator at a call site.**
 * `push(...convertedDrops)` and `new Date(...fakeStartTimeArray)` unpack a known array into a known
 * signature, which is the opposite situation and entirely fine.
 *
 * Usage:
 *   node src/build-tools/verify-no-rest-parameters.js
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
 * Every node type that carries a parameter list.
 * @type {string[]}
 */
const FUNCTION_TYPES = [
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
];

/**
 * Parses source into an AST with location data.
 * @param {string} source The raw source text.
 * @returns {object} The parsed program.
 */
const parse = source => acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'module', locations: true });

/**
 * Walks every node of an AST, invoking a visitor with each node and its parent.
 * @param {object} node The node to walk.
 * @param {(node: object, parent: ?object) => void} visit The visitor.
 * @param {?object} parent The node's parent, or null at the root.
 */
function walk(node, visit, parent = null)
{
  // anything without a type is not a node worth descending into.
  if (!node || !node.type) return;

  visit(node, parent);

  for (const key of Object.keys(node))
  {
    // skip the location bookkeeping acorn hangs off every node.
    if (key === 'loc' || key === 'start' || key === 'end') continue;

    const child = node[key];

    // a node's children arrive either singly or in a list.
    if (Array.isArray(child))
    {
      child.forEach(entry => walk(entry, visit, node));
    }
    else if (child && child.type)
    {
      walk(child, visit, node);
    }
  }
}

/**
 * Names the function a violation sits in, as a reader would refer to it.
 * @param {object} node The function node.
 * @param {?object} parent The function's parent node.
 * @returns {string} A human-facing name.
 */
function describeFunction(node, parent)
{
  // a class method or object property carries its name on the parent.
  if (parent && parent.type === 'MethodDefinition' && parent.key && parent.key.name)
  {
    return parent.kind === 'constructor'
      ? 'constructor'
      : `${parent.key.name}()`;
  }

  // a prototype patch names the method on the assignment target.
  if (parent && parent.type === 'AssignmentExpression' && parent.left.type === 'MemberExpression')
  {
    const { property } = parent.left;
    if (property && property.name) return `${property.name}()`;
  }

  // a plain declaration carries its own name.
  if (node.id && node.id.name) return `${node.id.name}()`;

  return 'an anonymous function';
}

/**
 * Collects every rest parameter declared in a file.
 * @param {string} filePath The repository-relative file path.
 * @param {object} ast The parsed source.
 * @returns {{filePath: string, line: number, name: string, parameter: string}[]} The violations.
 */
function collectViolations(filePath, ast)
{
  const violations = [];

  walk(ast, (node, parent) =>
  {
    if (FUNCTION_TYPES.includes(node.type) === false) return;

    for (const parameter of node.params)
    {
      if (parameter.type !== 'RestElement') continue;

      // the rest element's argument is the binding the caller's arguments land in.
      const parameterName = parameter.argument.name ?? 'args';

      violations.push({
        filePath,
        line: node.loc.start.line,
        name: describeFunction(node, parent),
        parameter: parameterName,
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
    let ast;

    try
    {
      ast = parse(await fs.readFile(filePath, 'utf-8'));
    }
    catch (error)
    {
      Logger.logAnyway(`  • ${filePath}: could not parse — ${error.message}`, LogStyle.brightRed);

      return 1;
    }

    violations.push(...collectViolations(filePath, ast));
  }

  if (violations.length === 0)
  {
    Logger.logAnyway('rest-parameter verify: OK (every signature declares what it takes).', LogStyle.brightGreen);

    return 0;
  }

  Logger.logAnyway(`rest-parameter verify FAILED: ${violations.length} violation(s) found.`, LogStyle.brightRed);
  Logger.logAnyway('  A rest parameter declares no contract- not arity, not order, not meaning. Declare', LogStyle.brightYellow);
  Logger.logAnyway('  the parameters the function actually takes, with defaults where they are optional.', LogStyle.brightYellow);

  for (const violation of violations)
  {
    Logger.logAnyway(`  • ${violation.filePath}:${violation.line}: ${violation.name} declares ...${violation.parameter}`,
      LogStyle.brightRed);
  }

  return 1;
}

const exitCode = await main();
process.exit(exitCode);
//endregion verify-no-rest-parameters