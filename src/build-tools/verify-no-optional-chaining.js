//region verify-no-optional-chaining
/**
 * Verifies that no plugin source file uses optional chaining (`?.`).
 *
 * Per `.junie/guidelines.md`, optional chaining is strictly forbidden, and code that appears to
 * need it should be rewritten so it doesn't. Every `?.` is one of three things, and none of them
 * survive contact with the guidelines:
 *
 *   - A guard against a method that might not exist. If it belongs to this codebase, read the
 *     source and know that it does; if it is genuinely missing, add it. Drop-in replacements land
 *     together, so there is no window where half the API exists.
 *   - A guard against a namespace that might not be initialized. `initMembers` seeds every field
 *     with `||=`, so on any current save they all exist. Old saves are explicitly out of scope.
 *   - A read of something contractually nullable. That is real, but it reads better as an explicit
 *     `if (x === null) return;` than as a silent short-circuit that hides which link was absent.
 *
 * Nullish coalescing (`??`) is a DIFFERENT operator and is not policed here — it is the documented
 * way to fall back from a `nullIfEmpty` note-parse to a plugin-parameter default.
 *
 * Usage:
 *   node src/build-tools/verify-no-optional-chaining.js
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
 * Describes what an optional link was reaching for, so the report names the culprit.
 * @param {object} node The optional member or call expression.
 * @returns {string} A short description of the access.
 */
function describe(node)
{
  // an optional call is reaching for a method that may not exist.
  if (node.type === 'CallExpression') return 'optional call `?.()`';

  // an optional member names the property it was hedging on.
  const property = node.property?.name ?? node.property?.value ?? '?';

  return `optional access \`?.${property}\``;
}

/**
 * Collects every optional-chaining link in a single parsed source file.
 * @param {string} filePath The repository-relative file path.
 * @param {object} ast The parsed source.
 * @returns {{filePath: string, line: number, detail: string}[]} The violations found.
 */
function collectViolations(filePath, ast)
{
  const violations = [];

  walk(ast, node =>
  {
    // acorn marks the individual link optional, not the wrapping ChainExpression.
    if (node.type !== 'MemberExpression' && node.type !== 'CallExpression') return;
    if (node.optional !== true) return;

    violations.push({ filePath, line: node.loc.start.line, detail: describe(node) });
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
    Logger.logAnyway('optional-chaining verify: OK (no `?.` in plugin source).', LogStyle.brightGreen);
    return 0;
  }

  Logger.logAnyway(`optional-chaining verify FAILED: ${violations.length} violation(s) found.`, LogStyle.brightRed);
  Logger.logAnyway('  Assume the thing exists. If it does not, add it — do not hedge.', LogStyle.brightYellow);

  for (const violation of violations)
  {
    Logger.logAnyway(`  • ${violation.filePath}:${violation.line}: ${violation.detail}`, LogStyle.brightRed);
  }

  return 1;
}

const exitCode = await main();
process.exit(exitCode);
//endregion verify-no-optional-chaining
