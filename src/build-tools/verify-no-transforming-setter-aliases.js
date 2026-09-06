//region verify-no-transforming-setter-aliases
/**
 * Verifies that no alias of a single-field setter rewrites the value it forwards.
 *
 * Aliasing a setter is fine, and several ships do it: watch the value go by, fire a side effect,
 * hand the original exactly what it was given. What is never fine is changing the value on the way
 * through, because a setter is not called once. It is called by everything that writes the field,
 * including the field's own bookkeeping:
 *
 *   decrementFrames()
 *   {
 *     this.setFrames(this.getFrames() - 1);
 *   }
 *
 * That is a read-modify-write, and it reaches the same setter every other caller does. So an alias
 * that scales its argument does not scale the value once at the start- it re-scales the remainder
 * on every step. With a factor of four, a counter seeded at 3 becomes 12, then the first decrement
 * writes 11 back and stores 44, then 43 stores 172. The count climbs away from zero instead of
 * walking down to it, and whatever was waiting for it to reach zero waits forever.
 *
 * Nothing about that failure is visible at either end. The alias reads as correct in isolation, the
 * countdown reads as correct in isolation, and a unit test pinning one call of either agrees with
 * both. Only their composition is wrong, which is why this needs to be a build gate rather than a
 * thing anybody is expected to notice while reading.
 *
 * **The fix is always the same shape**: transform where the value is *seeded*, not where it is
 * *stored*. Give the owning class a small seam- `determineFrameCount(source)`- return the plain
 * value from it, and let the extension alias that instead. It runs once, at the one moment the
 * transformation is meant to happen, and the setter goes back to being a setter.
 *
 * This gate judges only names shaped like single-field mutators (`set` followed by a capital).
 * Lifecycle methods that happen to start with "set"- `setup`, `setupPage`, `setupNewGame`- are
 * behavior rather than assignment, and extensions rewrite what they pass to those all the time.
 *
 * Usage:
 *   node src/build-tools/verify-no-transforming-setter-aliases.js
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
 * The prefix marking a method as a single-field mutator.
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
 * Determines whether a method name is shaped like a single-field mutator.
 * @param {string} name The method name.
 * @returns {boolean}
 */
function isMutatorName(name)
{
  // the prefix must be followed by a capital, or `setup` would read as a setter for `up`.
  if (name.startsWith(MUTATOR_PREFIX) === false) return false;

  const next = name.charAt(MUTATOR_PREFIX.length);

  return next !== '' && next === next.toUpperCase() && next !== next.toLowerCase();
}

/**
 * Determines whether a call node is this repository's alias-forward for the named method.
 *
 * The shape being matched is the alias pattern every ship uses, which is what lets the check find
 * the forwarding call without knowing anything about which namespace the alias map hangs off:
 *
 *   J.SOME.Aliased.SomeType.get('setFoo').call(this, value)
 * @param {object} node The node to evaluate.
 * @param {string} name The name of the method whose body is being inspected.
 * @returns {boolean}
 */
function isAliasForward(node, name)
{
  if (node.type !== 'CallExpression') return false;

  const { callee } = node;
  if (!callee || callee.type !== 'MemberExpression') return false;
  if (callee.property.type !== 'Identifier') return false;

  // the outer call has to be a `.call(this, ...)` invocation of something.
  if (callee.property.name !== 'call') return false;

  // and the something has to be the alias map answering for this exact method name.
  const inner = callee.object;
  if (!inner || inner.type !== 'CallExpression') return false;
  if (!inner.callee || inner.callee.type !== 'MemberExpression') return false;
  if (inner.callee.property.type !== 'Identifier') return false;
  if (inner.callee.property.name !== 'get') return false;

  const [ aliasKey ] = inner.arguments;

  // a computed key cannot be resolved here, and no ship writes one.
  if (!aliasKey || aliasKey.type !== 'Literal') return false;

  return aliasKey.value === name;
}

/**
 * Gets the declared parameter names of a function, or null when any of them is not a plain name.
 *
 * A destructured or defaulted parameter has no single identifier to compare a forwarded argument
 * against, so those signatures are reported as unjudgeable rather than guessed at.
 * @param {object} fn The function node.
 * @returns {?string[]} The parameter names, or null when the signature cannot be compared.
 */
function plainParameterNames(fn)
{
  const names = [];

  for (const param of fn.params)
  {
    if (param.type !== 'Identifier') return null;

    names.push(param.name);
  }

  return names;
}

/**
 * Determines whether an alias forward hands every parameter straight through, unchanged.
 * @param {object} node The alias-forward call node.
 * @param {string[]} parameterNames The declared parameter names, in order.
 * @returns {boolean}
 */
function forwardsParametersUnchanged(node, parameterNames)
{
  // the leading `this` is the receiver rather than a value, so the values start after it.
  const [ , ...forwarded ] = node.arguments;

  // forwarding fewer or more values than were declared is a rewrite of the call by any measure.
  if (forwarded.length !== parameterNames.length) return false;

  return forwarded.every((argument, index) =>
  {
    // anything that is not a bare name is by definition a computed value rather than the original.
    if (argument.type !== 'Identifier') return false;

    return argument.name === parameterNames[index];
  });
}

/**
 * Collects every transforming alias forward made by one named function.
 * @param {string} filePath The repository-relative file path.
 * @param {string} name The name the function is reachable by.
 * @param {object} fn The function node whose body to inspect.
 * @returns {{filePath: string, line: number, name: string, detail: string}[]} The violations.
 */
function collectTransformingForwards(filePath, name, fn)
{
  // only single-field mutators are judged; lifecycle `setup` methods are behavior, not assignment.
  if (isMutatorName(name) === false) return [];

  const parameterNames = plainParameterNames(fn);
  const violations = [];

  walk(fn, node =>
  {
    if (isAliasForward(node, name) === false) return;

    // a signature this check cannot read is worth surfacing rather than passing silently.
    if (parameterNames === null)
    {
      violations.push({
        filePath,
        line: node.loc.start.line,
        name,
        detail: 'aliases a setter with a signature this check cannot compare (destructured or defaulted parameter)',
      });

      return;
    }

    if (forwardsParametersUnchanged(node, parameterNames)) return;

    violations.push({
      filePath,
      line: node.loc.start.line,
      name,
      detail: 'rewrites the value it forwards to the original setter',
    });
  });

  return violations;
}

/**
 * Collects every transforming setter alias in a file.
 * @param {string} filePath The repository-relative file path.
 * @param {object} ast The parsed source.
 * @returns {{filePath: string, line: number, name: string, detail: string}[]} The violations.
 */
function collectViolations(filePath, ast)
{
  const violations = [];

  walk(ast, node =>
  {
    // aliasing only ever happens by prototype patch; augmentation never uses class syntax here.
    if (node.type !== 'AssignmentExpression') return;
    if (node.left.type !== 'MemberExpression') return;

    const { name } = node.left.property;
    if (!name) return;

    // only a function body can contain a forwarding call in the first place.
    const isFunction = node.right.type === 'FunctionExpression' || node.right.type === 'ArrowFunctionExpression';
    if (isFunction === false) return;

    violations.push(...collectTransformingForwards(filePath, name, node.right));
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
    Logger.logAnyway('transforming-setter-alias verify: OK (every setter alias forwards its value unchanged).',
      LogStyle.brightGreen);
    return 0;
  }

  Logger.logAnyway(`transforming-setter-alias verify FAILED: ${violations.length} violation(s) found.`,
    LogStyle.brightRed);
  Logger.logAnyway('  A setter is reached by every write to its field, including the read-modify-write of', LogStyle.brightYellow);
  Logger.logAnyway('  a countdown. An alias that rewrites the value therefore rewrites it once per step,', LogStyle.brightYellow);
  Logger.logAnyway('  and a counter meant to reach zero climbs away from it instead. Transform where the', LogStyle.brightYellow);
  Logger.logAnyway('  value is seeded- add a seam the owner calls once- and forward the argument as given.', LogStyle.brightYellow);

  for (const violation of violations)
  {
    Logger.logAnyway(`  • ${violation.filePath}:${violation.line}: ${violation.name}() ${violation.detail}`,
      LogStyle.brightRed);
  }

  return 1;
}

const exitCode = await main();
process.exit(exitCode);
//endregion verify-no-transforming-setter-aliases