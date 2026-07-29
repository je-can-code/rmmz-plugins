//region verify-no-private-in-serializable
/**
 * Verifies that no class registered with {@link SerializableRegistry} declares private members.
 *
 * A registered class ends up inside save data, and RMMZ restores save data by rebuilding each
 * object from its prototype and copying properties across — the constructor never runs. Private
 * fields and methods are brand-checked against instances the constructor actually produced, so a
 * restored object carries the prototype without ever having been branded. The first `this.#anything`
 * it touches throws:
 *
 *   TypeError: Receiver must be an instance of class Foo
 *
 * This is a genuinely nasty failure to find by hand. The class is correct in isolation, every test
 * that builds one with `new` passes, and a fresh game never notices — it only detonates once an
 * existing save is loaded, which for a clock meant roughly one second after the title screen.
 *
 * The fix is always the same: make the member non-private. Encapsulation is worth having, but not
 * at the cost of the object surviving a save.
 *
 * Usage:
 *   node src/build-tools/verify-no-private-in-serializable.js
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
 * Collects every private member declared by a registered class in a single file.
 * @param {string} filePath The repository-relative file path.
 * @param {object} ast The parsed source.
 * @returns {{filePath: string, line: number, className: string, detail: string}[]} The violations.
 */
function collectViolations(filePath, ast)
{
  const registered = collectRegisteredClassNames(ast);

  // a file that registers nothing cannot violate this rule.
  if (registered.size === 0) return [];

  const violations = [];

  walk(ast, node =>
  {
    // only the body of a registered class matters; other classes in the file are free to be private.
    if (node.type !== 'ClassDeclaration' && node.type !== 'ClassExpression') return;
    if (!node.id || registered.has(node.id.name) === false) return;

    for (const member of node.body.body)
    {
      // acorn marks both private fields and private methods with a PrivateIdentifier key.
      if (!member.key || member.key.type !== 'PrivateIdentifier') continue;

      violations.push({
        filePath,
        line: member.loc.start.line,
        className: node.id.name,
        detail: describe(member),
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
    Logger.logAnyway('serializable-private verify: OK (no private members on saved classes).', LogStyle.brightGreen);
    return 0;
  }

  Logger.logAnyway(`serializable-private verify FAILED: ${violations.length} violation(s) found.`, LogStyle.brightRed);
  Logger.logAnyway('  Saved objects are rebuilt from their prototype, never their constructor, so', LogStyle.brightYellow);
  Logger.logAnyway('  private members are absent after a load and throw on first touch. Make them public.', LogStyle.brightYellow);

  for (const violation of violations)
  {
    Logger.logAnyway(`  • ${violation.filePath}:${violation.line}: ${violation.className} has a ${violation.detail}`,
      LogStyle.brightRed);
  }

  return 1;
}

const exitCode = await main();
process.exit(exitCode);
//endregion verify-no-private-in-serializable
