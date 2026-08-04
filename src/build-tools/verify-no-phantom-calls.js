//region verify-no-phantom-calls
/**
 * Verifies that every statically-dispatched call names a method that actually exists.
 *
 * JavaScript will happily let a file call `SomeManager.methodThatNeverExisted()` and say nothing
 * until the line runs. In a plugin tree this is worse than usual, because the paths least likely to
 * run in a test are the view paths- and those are the ones excluded from coverage by design. A call
 * can therefore be dead-wrong, fully committed, and invisible to every instrument the repo owns.
 *
 * That is not hypothetical. `Window_RefinementDetails` shipped a call to
 * `JaftingManager.combineBaseParameterTraits`, a method which has never existed anywhere in this
 * repository. Coverage never looked at it because windows are excluded; the test suite never looked
 * at it because nothing exercised the window; and the refinement details pane simply threw whenever
 * a player opened it. Only booting the game found it.
 *
 * The check is deliberately narrow, because narrow is what makes it trustworthy. It judges only
 * calls whose receiver is a bare capitalised identifier- `IconManager.longParam(…)`,
 * `TextManager.param(…)`- since that is the one shape where the receiver is decidable without type
 * inference. Anything reached through a variable, a property chain, or `this` is left alone.
 *
 * Membership is resolved against the union of:
 *
 * - every class declared in `src/plugins/**`, including statics, getters, setters and fields
 * - every prototype patch and static assignment the tree makes onto a class
 * - the vendored RMMZ engine, so `TextManager.param` and friends resolve as the real methods they are
 *
 * ...and it walks the inheritance chain, so a static defined on `AutoRuleManager` resolves through
 * `AutoApplyStateManager` exactly as it does at runtime.
 *
 * **On trusting a green result.** A detector that reports "all clear" is indistinguishable from a
 * detector that is quietly broken, and this one is only as good as its index- if the engine files
 * went missing, `members` would come up short and every engine call would read as a phantom, or a
 * mis-scoped index would silently resolve everything. So the engine files are mandatory rather than
 * best-effort, and `--selftest` runs both controls: two planted defects that must be caught, and two
 * real calls that must resolve. Run it whenever the result surprises you.
 *
 * Usage:
 *   node src/build-tools/verify-no-phantom-calls.js
 *   node src/build-tools/verify-no-phantom-calls.js --selftest
 */
import * as fs from 'fs/promises';
import { glob } from 'glob';
import * as acorn from 'acorn';
import Logger, { LogStyle } from './logger.js';

const SRC_PLUGINS_GLOB = './src/plugins/**/*.js';

/**
 * The vendored engine, which defines the managers and base classes the tree calls into constantly.
 * Without these the index is missing `TextManager`, `ColorManager`, `Input`, `SoundManager` and every
 * `Game_`/`Scene_`/`Window_` base, and the check degenerates into flagging correct engine usage.
 * @type {string[]}
 */
const ENGINE_FILES = [
  './project/js/rmmz_core.js',
  './project/js/rmmz_managers.js',
  './project/js/rmmz_objects.js',
  './project/js/rmmz_scenes.js',
  './project/js/rmmz_sprites.js',
  './project/js/rmmz_windows.js',
];

/**
 * Files exempt from this rule, by basename.
 * @type {string[]}
 */
const EXEMPT_BASENAMES = [ '_annotations.js' ];

/**
 * Receivers whose surface is host-provided rather than declared in any file we can read. Judging a
 * call against an index that never had a chance to contain the answer produces noise, not findings.
 * @type {Set<string>}
 */
const UNJUDGEABLE_RECEIVERS = new Set([
  'Math', 'JSON', 'Object', 'Array', 'String', 'Number', 'Date', 'Promise', 'RegExp', 'Map', 'Set',
  'WeakMap', 'WeakSet', 'Symbol', 'Error', 'Boolean', 'Function', 'Proxy', 'Reflect', 'BigInt',
  'Intl', 'PIXI', 'Graphics', 'Utils', 'FileReader', 'XMLHttpRequest', 'Image', 'Audio', 'Blob',
  'URL', 'TextDecoder', 'TextEncoder', 'ArrayBuffer', 'Uint8Array', 'Float32Array', 'Int16Array',
]);

/**
 * Members every function object carries, which are never declared and always resolve.
 * @type {Set<string>}
 */
const FUNCTION_MEMBERS = new Set([ 'call', 'apply', 'bind', 'toString', 'prototype' ]);

/**
 * Parses source into an AST with location data.
 * @param {string} source The raw source text.
 * @param {string} sourceType Either 'module' for plugin source or 'script' for the vendored engine.
 * @returns {object} The parsed program.
 */
const parse = (source, sourceType) => acorn.parse(source, { ecmaVersion: 'latest', sourceType, locations: true });

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
 * The accumulated knowledge of what exists: which classes there are, what each one carries, and
 * which class each one derives from.
 */
class ClassIndex
{
  /**
   * Every member name attached to a class, by any authoring style, keyed by class name.
   * @type {Map<string, Set<string>>}
   */
  members = new Map();

  /**
   * Child class name to parent class name, so inherited members resolve the way they do at runtime.
   * @type {Map<string, string>}
   */
  parents = new Map();

  /**
   * Records that a class carries a member.
   * @param {string} className The class the member hangs off.
   * @param {string} memberName The member's name.
   */
  addMember(className, memberName)
  {
    if (this.members.has(className) === false)
    {
      this.members.set(className, new Set());
    }

    this.members.get(className).add(memberName);
  }

  /**
   * Records that one class derives from another.
   * @param {string} childName The deriving class.
   * @param {string} parentName The class being derived from.
   */
  addParent(childName, parentName)
  {
    this.parents.set(childName, parentName);
  }

  /**
   * Determines whether this index has anything at all to say about a class. A receiver we have never
   * seen declared cannot be judged- it may be a host global, a vendor script, or a local binding.
   * @param {string} className The class to look for.
   * @returns {boolean}
   */
  knows(className)
  {
    return this.members.has(className);
  }

  /**
   * Determines whether a member resolves on a class or anywhere up its inheritance chain.
   * @param {string} className The receiver being called.
   * @param {string} memberName The member being reached for.
   * @returns {boolean}
   */
  resolves(className, memberName)
  {
    let current = className;

    // a cycle should be impossible, but a malformed index must not hang the build.
    const visited = new Set();

    while (current !== undefined && visited.has(current) === false)
    {
      visited.add(current);

      const set = this.members.get(current);
      if (set !== undefined && set.has(memberName)) return true;

      current = this.parents.get(current);
    }

    return false;
  }
}

/**
 * Determines whether a name is shaped like a class rather than a variable.
 * @param {string} name The identifier to judge.
 * @returns {boolean}
 */
function isClassLikeName(name)
{
  const first = name.charAt(0);

  return first !== '' && first === first.toUpperCase() && first !== first.toLowerCase();
}

/**
 * Reads the class name out of an assignment target, distinguishing a static from a prototype member.
 * @param {object} memberExpression The left-hand side of an assignment.
 * @returns {?{className: string, memberName: string}} The pair, or null when the shape does not apply.
 */
function readAssignedMember(memberExpression)
{
  const { object, property, computed } = memberExpression;

  // a computed key is a runtime string; there is no name to record.
  if (computed) return null;
  if (property.type !== 'Identifier') return null;

  // Foo.bar = … , a static.
  if (object.type === 'Identifier' && isClassLikeName(object.name))
  {
    return { className: object.name, memberName: property.name };
  }

  // Foo.prototype.bar = … , an instance method.
  if (object.type !== 'MemberExpression') return null;
  if (object.computed) return null;
  if (object.property.type !== 'Identifier' || object.property.name !== 'prototype') return null;
  if (object.object.type !== 'Identifier' || isClassLikeName(object.object.name) === false) return null;

  return { className: object.object.name, memberName: property.name };
}

/**
 * Reads the class name off a `Foo` or `Foo.prototype` expression, as `Object.defineProperty` takes.
 * @param {object} node The expression naming the target.
 * @returns {string} The class name, or an empty string when the expression is not one.
 */
function readDefinePropertyTarget(node)
{
  if (node.type === 'Identifier' && isClassLikeName(node.name)) return node.name;

  if (node.type !== 'MemberExpression') return String();
  if (node.object.type !== 'Identifier') return String();
  if (isClassLikeName(node.object.name) === false) return String();

  return node.object.name;
}

/**
 * Records the members and superclass link a modern class declaration provides.
 * @param {object} node The class declaration or expression.
 * @param {ClassIndex} index The index to populate.
 */
function indexClass(node, index)
{
  if (!node.id || !node.id.name) return;

  const className = node.id.name;

  // seed the entry even for an empty class, so the receiver reads as known rather than unjudgeable.
  if (index.knows(className) === false)
  {
    index.addMember(className, 'constructor');
  }

  if (node.superClass && node.superClass.type === 'Identifier')
  {
    index.addParent(className, node.superClass.name);
  }

  for (const element of node.body.body)
  {
    // a computed member name is a runtime string; there is nothing static to record.
    if (element.computed) continue;
    if (!element.key || element.key.type !== 'Identifier') continue;

    index.addMember(className, element.key.name);
  }
}

/**
 * Determines whether a call expression is `Object.create(Something.prototype)`.
 * @param {object} node The expression on the right of an assignment.
 * @returns {boolean}
 */
function isObjectCreateCall(node)
{
  if (node.type !== 'CallExpression') return false;

  const { callee } = node;
  if (callee.type !== 'MemberExpression') return false;
  if (callee.object.type !== 'Identifier' || callee.object.name !== 'Object') return false;
  if (callee.property.type !== 'Identifier') return false;

  return callee.property.name === 'create';
}

/**
 * Records what one assignment declares: either an inheritance link or a single member.
 * @param {object} node The assignment expression.
 * @param {ClassIndex} index The index to populate.
 */
function indexAssignment(node, index)
{
  if (node.left.type !== 'MemberExpression') return;

  const { left, right } = node;
  const isPrototypeTarget = left.property.type === 'Identifier' && left.property.name === 'prototype';

  // the engine's inheritance style: Foo.prototype = Object.create(Bar.prototype).
  if (isPrototypeTarget && left.object.type === 'Identifier' && isObjectCreateCall(right))
  {
    const [ firstArgument ] = right.arguments;
    if (!firstArgument || firstArgument.type !== 'MemberExpression') return;

    const parentName = readDefinePropertyTarget(firstArgument);
    if (parentName === String()) return;

    index.addParent(left.object.name, parentName);

    return;
  }

  const assigned = readAssignedMember(left);
  if (assigned === null) return;

  index.addMember(assigned.className, assigned.memberName);
}

/**
 * Records the members declared by an `Object.defineProperty` or `defineProperties` call.
 * @param {object} node The call expression.
 * @param {ClassIndex} index The index to populate.
 */
function indexDefineProperty(node, index)
{
  const { callee, arguments: args } = node;
  if (callee.type !== 'MemberExpression') return;
  if (callee.object.type !== 'Identifier' || callee.object.name !== 'Object') return;
  if (callee.property.type !== 'Identifier') return;

  const isSingle = callee.property.name === 'defineProperty';
  const isPlural = callee.property.name === 'defineProperties';
  if (isSingle === false && isPlural === false) return;
  if (args.length < 2) return;

  const className = readDefinePropertyTarget(args[0]);
  if (className === String()) return;

  // defineProperty names one member as a literal; defineProperties names many as object keys.
  if (isSingle)
  {
    if (args[1].type === 'Literal') index.addMember(className, String(args[1].value));

    return;
  }

  if (args[1].type !== 'ObjectExpression') return;

  for (const property of args[1].properties)
  {
    if (property.type !== 'Property' || property.computed) continue;
    if (property.key.type === 'Identifier') index.addMember(className, property.key.name);
    else if (property.key.type === 'Literal') index.addMember(className, String(property.key.value));
  }
}

/**
 * Records every member and inheritance link one file declares.
 * @param {object} ast The parsed source.
 * @param {ClassIndex} index The index to populate.
 */
function indexFile(ast, index)
{
  walk(ast, node =>
  {
    // modern class syntax, which is how new managers, models and derived scenes are written.
    if (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') indexClass(node, index);
    // prototype patches and static assignments, which is how the tree extends engine classes.
    else if (node.type === 'AssignmentExpression') indexAssignment(node, index);
    // Object.defineProperty / defineProperties, the engine's accessor style.
    else if (node.type === 'CallExpression') indexDefineProperty(node, index);
  });
}

/**
 * Collects every call in a file that names a member its receiver does not have.
 * @param {string} filePath The repository-relative file path.
 * @param {object} ast The parsed source.
 * @param {ClassIndex} index The populated class index.
 * @returns {{filePath: string, line: number, receiver: string, member: string}[]} The violations.
 */
function collectViolations(filePath, ast, index)
{
  const violations = [];

  walk(ast, node =>
  {
    if (node.type !== 'CallExpression') return;

    const { callee } = node;
    if (!callee || callee.type !== 'MemberExpression') return;

    // only a bare capitalised identifier is a decidable receiver. `this.foo()`, `someVar.foo()` and
    // `A.B.foo()` all require type inference we deliberately do not attempt.
    if (callee.object.type !== 'Identifier') return;
    if (callee.computed) return;
    if (callee.property.type !== 'Identifier') return;

    const receiver = callee.object.name;
    const member = callee.property.name;

    if (isClassLikeName(receiver) === false) return;
    if (UNJUDGEABLE_RECEIVERS.has(receiver)) return;
    if (FUNCTION_MEMBERS.has(member)) return;

    // a receiver absent from the index is a host global or vendor binding, not a mistake we can prove.
    if (index.knows(receiver) === false) return;
    if (index.resolves(receiver, member)) return;

    violations.push({
      filePath,
      line: node.loc.start.line,
      receiver,
      member,
    });
  });

  return violations;
}

/**
 * Runs the controls that make a green result mean something.
 *
 * Two planted defects must be caught and two real calls must resolve. A broken index fails these
 * loudly instead of reporting a clean tree, which is the whole point of having them.
 * @param {ClassIndex} index The populated class index.
 * @returns {boolean} True when every control behaved as required.
 */
function runControls(index)
{
  const controls = [
    // the historical bug: a method that has never existed in this repository.
    { receiver: 'JaftingManager', member: 'combineBaseParameterTraits', expectPhantom: true },
    // a plausible typo on a real engine class.
    { receiver: 'TextManager', member: 'paramName', expectPhantom: true },
    // a real engine static must resolve.
    { receiver: 'TextManager', member: 'param', expectPhantom: false },
    // a real static inherited from a base class must resolve.
    { receiver: 'AutoApplyStateManager', member: 'scheduleHealTriggers', expectPhantom: false },
  ];

  let allPassed = true;

  Logger.logAnyway('phantom-call verify controls:', LogStyle.brightCyan);

  for (const { receiver, member, expectPhantom } of controls)
  {
    const flagged = index.knows(receiver) && index.resolves(receiver, member) === false;
    const passed = flagged === expectPhantom;

    if (passed === false) allPassed = false;

    const verdict = flagged ? 'PHANTOM' : 'resolves';
    const style = passed ? LogStyle.brightGreen : LogStyle.brightRed;
    Logger.logAnyway(`  [${passed ? 'PASS' : 'FAIL'}] ${receiver}.${member} -> ${verdict}`, style);
  }

  return allPassed;
}

/**
 * Entry point.
 * @returns {Promise<number>} Exit code — 0 for clean, 1 for violations found.
 */
async function main()
{
  const index = new ClassIndex();

  // the engine goes in first and is mandatory. a partial index does not under-report, it
  // over-reports- every correct engine call becomes a finding- so a missing file is fatal.
  for (const filePath of ENGINE_FILES)
  {
    let source;

    try
    {
      source = await fs.readFile(filePath, 'utf-8');
    }
    catch (error)
    {
      Logger.logAnyway(`phantom-call verify FAILED: engine file missing — ${filePath}`, LogStyle.brightRed);
      Logger.logAnyway('  Without the vendored engine the index cannot resolve TextManager, ColorManager,', LogStyle.brightYellow);
      Logger.logAnyway('  Input, or any Game_/Scene_/Window_ base, and every correct call to them reads as', LogStyle.brightYellow);
      Logger.logAnyway(`  a phantom. Refusing to report on a partial index. (${error.message})`, LogStyle.brightYellow);

      return 1;
    }

    indexFile(parse(source, 'script'), index);
  }

  const files = await glob(SRC_PLUGINS_GLOB, {
    ignore: EXEMPT_BASENAMES.map(basename => `**/${basename}`),
  });

  /** @type {{filePath: string, ast: object}[]} */
  const parsed = [];

  for (const filePath of files)
  {
    let ast;

    try
    {
      ast = parse(await fs.readFile(filePath, 'utf-8'), 'module');
    }
    catch (error)
    {
      Logger.logAnyway(`  • ${filePath}: could not parse — ${error.message}`, LogStyle.brightRed);

      return 1;
    }

    // indexing must finish across the whole tree before any call can be judged against it.
    indexFile(ast, index);
    parsed.push({ filePath, ast });
  }

  if (process.argv.includes('--selftest'))
  {
    const controlsPassed = runControls(index);

    if (controlsPassed === false)
    {
      Logger.logAnyway('phantom-call verify FAILED: controls did not behave as required.', LogStyle.brightRed);
      Logger.logAnyway('  The index is wrong, so any result it produces is meaningless. Fix the index first.',
        LogStyle.brightYellow);

      return 1;
    }
  }

  const violations = [];

  for (const { filePath, ast } of parsed)
  {
    violations.push(...collectViolations(filePath, ast, index));
  }

  if (violations.length === 0)
  {
    Logger.logAnyway('phantom-call verify: OK (every statically-dispatched call resolves).', LogStyle.brightGreen);

    return 0;
  }

  Logger.logAnyway(`phantom-call verify FAILED: ${violations.length} violation(s) found.`, LogStyle.brightRed);
  Logger.logAnyway('  These calls name a method that does not exist on the receiver or anywhere up its', LogStyle.brightYellow);
  Logger.logAnyway('  inheritance chain. Each one throws the moment its line runs. Implement the method,', LogStyle.brightYellow);
  Logger.logAnyway('  or correct the call to the name that does exist.', LogStyle.brightYellow);

  for (const violation of violations)
  {
    Logger.logAnyway(`  • ${violation.filePath}:${violation.line}: ${violation.receiver}.${violation.member}() does not exist`,
      LogStyle.brightRed);
  }

  return 1;
}

const exitCode = await main();
process.exit(exitCode);
//endregion verify-no-phantom-calls