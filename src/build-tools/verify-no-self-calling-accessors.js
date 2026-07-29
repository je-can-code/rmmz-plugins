//region verify-no-self-calling-accessors
/**
 * Verifies that no accessor calls itself, which is always unbounded recursion.
 *
 * This is the failure mode of the rule its sibling check enforces. `verify-no-direct-property-getset`
 * requires every field to be reached through its accessor- with one necessary exemption, since the
 * accessor is the one place that *must* touch the field directly:
 *
 *   setActor(actor)
 *   {
 *     this._actor = actor;      // correct: the owning mutator
 *   }
 *
 * Rewrite that body to obey the rule literally and you get:
 *
 *   setActor(actor)
 *   {
 *     this.setActor(actor);     // now it calls itself, forever
 *   }
 *
 *   RangeError: Maximum call stack size exceeded
 *
 * which still passes the direct-property check, because there is no longer any direct access to see.
 * The two checks are therefore a matched pair: one demands accessors be used, the other confirms the
 * accessors themselves still do real work.
 *
 * Recursion itself is perfectly reasonable- `OverlayManager.getExtendedSkill` recurses to resolve a
 * chain of skill overlays, and guards against circularity while doing it- so this check does not simply
 * ban self-calls. It looks for the two shapes that are unconditionally wrong:
 *
 * 1. **A mutator that calls itself, anywhere.** A `setFoo` exists to assign; there is no version of
 *    that job which requires calling `setFoo` again.
 * 2. **Any method whose entire body is a call to itself.** `actor() { return this.actor(); }` cannot
 *    terminate no matter what it is named, which is what makes this rule safe to apply to the
 *    bare-noun getters the tree is full of- `actor()`, `entries()`, `aggregates()`- none of which carry
 *    a prefix to recognise them by.
 *
 * Usage:
 *   node src/build-tools/verify-no-self-calling-accessors.js
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
 * The prefix marking a method as a mutator, for which self-recursion is never intentional.
 * @type {string}
 */
const MUTATOR_PREFIX = 'set';

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
  if (!node || !node.type) return;

  visit(node);

  for (const key of Object.keys(node))
  {
    // skip the location bookkeeping acorn hangs off every node.
    if (key === 'loc' || key === 'start' || key === 'end') continue;

    const child = node[key];

    // a node's children arrive either singly or in a list.
    if (Array.isArray(child))
    {
      child.forEach(entry => walk(entry, visit));
    }
    else if (child && child.type)
    {
      walk(child, visit);
    }
  }
}

/**
 * Determines whether a method name is shaped like a mutator.
 * @param {string} name The method name.
 * @returns {boolean}
 */
function isMutatorName(name)
{
  // the prefix must be followed by a capital, or `settle` would read as a setter for `tle`.
  if (name.startsWith(MUTATOR_PREFIX) === false) return false;

  const next = name.charAt(MUTATOR_PREFIX.length);

  return next !== '' && next === next.toUpperCase();
}

/**
 * Determines whether a call is this method calling itself.
 * @param {object} node The node to evaluate.
 * @param {string} name The name of the method whose body is being inspected.
 * @returns {boolean}
 */
function isSelfCall(node, name)
{
  if (node.type !== 'CallExpression') return false;

  const { callee } = node;
  if (!callee || callee.type !== 'MemberExpression') return false;

  // only `this.thing()` can be a call back into the same method.
  if (callee.object.type !== 'ThisExpression') return false;

  // `this.#thing()` is a different method that merely shares a name, which is a real and deliberate
  // pattern here- the public accessor validates, then hands off to a private worker.
  if (callee.property.type !== 'Identifier') return false;

  return callee.property.name === name;
}

/**
 * Gets the sole statement of a function body, if it has exactly one.
 * @param {object} fn The function node.
 * @returns {?object} The statement, or null when the body holds anything other than one statement.
 */
function soleStatement(fn)
{
  const { body } = fn;

  // an expression-bodied arrow has no statement list at all; treat its expression as the statement.
  if (body.type !== 'BlockStatement') return { type: 'ReturnStatement', argument: body };

  if (body.body.length !== 1) return null;

  return body.body[0];
}

/**
 * Determines whether a function does nothing except call itself.
 *
 * This is the shape that cannot terminate regardless of what the method is called, which is what makes
 * it safe to check against every method rather than only the ones with recognisable accessor names.
 * @param {object} fn The function node.
 * @param {string} name The name the function is reachable by.
 * @returns {boolean}
 */
function isNothingButSelfCall(fn, name)
{
  const statement = soleStatement(fn);
  if (!statement) return false;

  // the call may be returned, or simply performed for its (non-existent) effect.
  if (statement.type === 'ReturnStatement') return isSelfCall(statement.argument ?? {}, name);
  if (statement.type !== 'ExpressionStatement') return false;

  const { expression } = statement;

  return isSelfCall(expression, name);
}

/**
 * Collects every unconditionally-wrong self-call made by one named function.
 * @param {string} filePath The repository-relative file path.
 * @param {string} name The name the function is reachable by.
 * @param {object} fn The function node whose body to inspect.
 * @returns {{filePath: string, line: number, name: string, detail: string}[]} The violations.
 */
function collectSelfCalls(filePath, name, fn)
{
  // a method that consists solely of calling itself is wrong whatever it is named.
  if (isNothingButSelfCall(fn, name))
  {
    return [ {
      filePath,
      line: fn.loc.start.line,
      name,
      detail: 'does nothing but call itself',
    } ];
  }

  // beyond that, only mutators are judged, since read accessors recurse legitimately.
  if (isMutatorName(name) === false) return [];

  const violations = [];

  walk(fn, node =>
  {
    if (isSelfCall(node, name) === false) return;

    violations.push({
      filePath,
      line: node.loc.start.line,
      name,
      detail: 'calls itself',
    });
  });

  return violations;
}

/**
 * Collects every accessor in a file that calls itself.
 * @param {string} filePath The repository-relative file path.
 * @param {object} ast The parsed source.
 * @returns {{filePath: string, line: number, name: string}[]} The violations.
 */
function collectViolations(filePath, ast)
{
  const violations = [];

  walk(ast, node =>
  {
    // class methods, which is how most of the tree declares its accessors.
    if (node.type === 'MethodDefinition' && node.key && node.key.name)
    {
      // a getter or setter declared with the `get`/`set` keyword cannot call itself by name anyway.
      if (node.kind !== 'method') return;

      violations.push(...collectSelfCalls(filePath, node.key.name, node.value));

      return;
    }

    // prototype patches, which is how the plugin tree extends engine classes.
    if (node.type !== 'AssignmentExpression') return;
    if (node.left.type !== 'MemberExpression') return;

    const { name } = node.left.property;
    if (!name) return;

    // only a function body can contain a call in the first place.
    const isFunction = node.right.type === 'FunctionExpression' || node.right.type === 'ArrowFunctionExpression';
    if (isFunction === false) return;

    violations.push(...collectSelfCalls(filePath, name, node.right));
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
    Logger.logAnyway('self-calling-accessor verify: OK (no accessor calls itself).', LogStyle.brightGreen);
    return 0;
  }

  Logger.logAnyway(`self-calling-accessor verify FAILED: ${violations.length} violation(s) found.`, LogStyle.brightRed);
  Logger.logAnyway('  An accessor that calls itself recurses until the stack gives out. The accessor is', LogStyle.brightYellow);
  Logger.logAnyway('  the one place allowed to touch its own field directly- assign it there instead.', LogStyle.brightYellow);

  for (const violation of violations)
  {
    Logger.logAnyway(`  • ${violation.filePath}:${violation.line}: ${violation.name}() ${violation.detail}`,
      LogStyle.brightRed);
  }

  return 1;
}

const exitCode = await main();
process.exit(exitCode);
//endregion verify-no-self-calling-accessors
