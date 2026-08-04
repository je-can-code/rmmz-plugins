//region verify-no-private-before-construction
/**
 * Verifies that no class whose instances can exist before their constructor finished declares
 * private members.
 *
 * A `#private` field or method is not part of the prototype. It is installed onto an individual
 * object, and only at the moment the constructor that declares it reaches that point. Touch one on
 * an object that never got branded and you get:
 *
 *   TypeError: Receiver must be an instance of class Foo
 *
 * There are exactly two ways this repository produces an unbranded object, and both of them are
 * routine rather than exotic:
 *
 *  1. **Save decode.** `SerializableRegistry` restores an object with `Object.create(prototype)` and
 *     copies fields across — the constructor never runs at all. The class is correct in isolation,
 *     every test that builds one with `new` passes, and a fresh game never notices. It detonates the
 *     first time an existing save is loaded.
 *
 *  2. **A base constructor that calls an overridable hook.** `PluginMetadata`'s constructor calls
 *     `initializePlugin` -> `postInitialize`, and every `Window_*` constructor eventually calls
 *     `initialize` -> `createContents` / `refresh` -> `makeCommandList`. A derived class installs its
 *     own members only *after* `super()` returns, so the whole of that hook runs on an object that
 *     does not have them yet. This one detonates during boot.
 *
 * Public class fields are broken by the same mechanism in case 2 — they simply read `undefined`
 * instead of throwing, which is why `verify-no-late-window-command-state` exists alongside this. The
 * two gates are the loud half and the quiet half of one problem.
 *
 * The fix is always the same: make the member non-private. Private methods lose nothing but the
 * sigil. Private fields become underscore-prefixed fields behind accessors, which is this
 * repository's ordinary convention anyway.
 *
 * `static #private` is never at risk and is never reported — statics are installed on the
 * constructor function when the class is defined, long before any instance exists.
 *
 * Usage:
 *   node src/build-tools/verify-no-private-before-construction.js
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
 * Base classes whose own constructor invokes a method the subclass is expected to override.
 *
 * `Window_` is matched by prefix rather than listed, because every window in the engine and in this
 * repository funnels through `Window_Base.prototype.initialize`, and that method calls hooks. Adding
 * a base here is a claim that its constructor reaches forward into subclass territory; do not add
 * one without confirming that it does.
 * @type {string[]}
 */
const HOOK_CALLING_BASES = [ 'PluginMetadata' ];

/**
 * Prefixes of base class names treated as hook-calling without being listed individually.
 * @type {string[]}
 */
const HOOK_CALLING_BASE_PREFIXES = [ 'Window_' ];

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
 * Collects the names of every class registered with the serializable registry in this file.
 * @param {object} ast The parsed source.
 * @returns {Set<string>} The registered class names.
 */
function collectRegisteredClassNames(ast)
{
  const registered = new Set();

  walk(ast, node =>
  {
    // looking for calls shaped like `SerializableRegistry.register(Foo)`.
    if (node.type !== 'CallExpression') return;

    const { callee } = node;
    if (!callee || callee.type !== 'MemberExpression') return;
    if (callee.object.name !== 'SerializableRegistry') return;
    if (callee.property.name !== 'register') return;

    // the registered class is the first argument, named directly.
    const [ target ] = node.arguments;
    if (target && target.type === 'Identifier') registered.add(target.name);
  });

  return registered;
}

/**
 * The name of the class a class declaration extends, when it is a plain identifier.
 * @param {object} node The class node.
 * @returns {string} The superclass name, or an empty string when there is not a simple one.
 */
function superClassNameOf(node)
{
  const { superClass } = node;
  if (!superClass || superClass.type !== 'Identifier') return '';

  return superClass.name;
}

/**
 * Why a class is at risk, or an empty string when it is not.
 * @param {object} node The class node.
 * @param {Set<string>} registered Class names registered as serializable in this file.
 * @returns {string} The reason, phrased for the failure report.
 */
function riskReasonFor(node, registered)
{
  if (node.id && registered.has(node.id.name))
  {
    return 'is restored from a savefile without its constructor ever running';
  }

  const superName = superClassNameOf(node);
  if (superName === '') return '';

  const isHookCaller = HOOK_CALLING_BASES.includes(superName)
    || HOOK_CALLING_BASE_PREFIXES.some(prefix => superName.startsWith(prefix));

  if (isHookCaller === false) return '';

  return `extends ${superName}, whose constructor calls hooks before this class's members exist`;
}

/**
 * Describes a private class member for the report.
 * @param {object} node The class member node.
 * @returns {string} A short description of the member.
 */
function describe(node)
{
  // methods and fields fail for the same reason but read differently in a report.
  const kind = node.type === 'MethodDefinition'
    ? 'method'
    : 'field';

  return `private ${kind} \`#${node.key.name}\``;
}

/**
 * Collects every private instance member declared by an at-risk class in a single file.
 * @param {string} filePath The repository-relative file path.
 * @param {object} ast The parsed source.
 * @returns {{filePath: string, line: number, className: string, detail: string, reason: string}[]} The violations.
 */
function collectViolations(filePath, ast)
{
  const registered = collectRegisteredClassNames(ast);
  const violations = [];

  walk(ast, node =>
  {
    if (node.type !== 'ClassDeclaration' && node.type !== 'ClassExpression') return;

    const reason = riskReasonFor(node, registered);
    // a class nobody can hold in an unbranded state is free to be as private as it likes.
    if (reason === '') return;

    const className = node.id ? node.id.name : '<anonymous>';

    for (const member of node.body.body)
    {
      // acorn marks both private fields and private methods with a PrivateIdentifier key.
      if (!member.key || member.key.type !== 'PrivateIdentifier') continue;

      // statics live on the constructor function from the moment the class is defined.
      if (member.static === true) continue;

      violations.push({
        filePath,
        line: member.loc.start.line,
        className,
        detail: describe(member),
        reason,
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
    Logger.logAnyway('unconstructed-private verify: OK (no private members where a constructor may not have run).',
      LogStyle.brightGreen);
    return 0;
  }

  Logger.logAnyway(`unconstructed-private verify FAILED: ${violations.length} violation(s) found.`, LogStyle.brightRed);
  Logger.logAnyway('  A private member is installed on an instance by its own constructor. Where that', LogStyle.brightYellow);
  Logger.logAnyway('  constructor has not run, or has not finished, the member is absent and throws on', LogStyle.brightYellow);
  Logger.logAnyway('  first touch. Make it public — a field becomes _underscore behind accessors.', LogStyle.brightYellow);

  for (const violation of violations)
  {
    Logger.logAnyway(`  • ${violation.filePath}:${violation.line}: ${violation.className} ${violation.reason}, and has a ${violation.detail}`,
      LogStyle.brightRed);
  }

  return 1;
}

const exitCode = await main();
process.exit(exitCode);
//endregion verify-no-private-before-construction
