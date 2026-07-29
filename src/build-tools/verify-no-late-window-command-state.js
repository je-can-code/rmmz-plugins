//region verify-no-late-window-command-state
/**
 * Verifies that no {@link Window_Command} subclass seeds its state too late to be usable.
 *
 * Vanilla's `Window_Command.prototype.initialize` ends by refreshing, and refreshing is what calls the
 * subclass's `makeCommandList`. So by the time a subclass's own code runs, the command list has already
 * been built. Both of the natural places to put state are therefore too late:
 *
 *   class Window_Thing extends Window_Command
 *   {
 *     _rows = [];                                    // applied only after super() returns
 *
 *     constructor(rect)
 *     {
 *       super(rect);                                 // ...but this is what builds the list
 *       this.initMembers();                          // far too late to matter
 *     }
 *   }
 *
 * and a derived constructor cannot touch `this` before calling `super`, so there is no earlier spot.
 * The result is always the same shape of crash, from inside `makeCommandList`, on the very first frame
 * the window exists:
 *
 *   TypeError: Cannot read properties of undefined (reading 'length')
 *
 * Which is a miserable thing to diagnose. The class reads correctly, the field has an obvious initial
 * value sitting right there in the source, and every failure looks local to whichever scene happened to
 * open — so a whole family of these was found and fixed one at a time, each mistaken for its own bug.
 *
 * J-Base solves it centrally: `Window_Command.prototype.initMembers` is a no-op hook, called from an
 * aliased `initialize` before the original logic runs. Subclasses implement it and get seeded at the one
 * moment that works. This check exists so the tree cannot drift back.
 *
 * Note that `Window_Selectable` and `Window_Base` subclasses are deliberately unaffected: neither
 * refreshes during initialize, so class fields are perfectly safe there.
 *
 * Usage:
 *   node src/build-tools/verify-no-late-window-command-state.js
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
 * The root class whose descendants are subject to this rule.
 * @type {string}
 */
const ROOT_CLASS = 'Window_Command';

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
 * Collects every class declaration in a file, paired with the name of what it extends.
 * @param {string} filePath The repository-relative file path.
 * @param {object} ast The parsed source.
 * @returns {{name: string, superName: string, node: object, filePath: string}[]} The classes found.
 */
function collectClasses(filePath, ast)
{
  const classes = [];

  walk(ast, node =>
  {
    // both declarations and expressions can name a class and its parent.
    if (node.type !== 'ClassDeclaration' && node.type !== 'ClassExpression') return;
    if (!node.id) return;

    // only a superclass named directly can be resolved; anything computed is out of scope.
    const superName = node.superClass && node.superClass.type === 'Identifier'
      ? node.superClass.name
      : String();

    classes.push({
      name: node.id.name,
      superName,
      node,
      filePath,
    });
  });

  return classes;
}

/**
 * Works out which of the collected classes descend from the root class, however indirectly.
 *
 * Resolved across the whole tree rather than per file, because the chain routinely spans plugins- a
 * main menu column extends a plugin's command window, which extends the engine's.
 * @param {{name: string, superName: string}[]} classes Every class found in the tree.
 * @returns {Set<string>} The names of the root class and all of its descendants.
 */
function resolveDescendants(classes)
{
  const descendants = new Set([ ROOT_CLASS ]);

  // one pass cannot settle a chain whose links appear out of order, so keep going until nothing new
  // is learned. The tree is small and the chains are short, so this converges almost immediately.
  let grew = true;

  while (grew)
  {
    grew = false;

    for (const entry of classes)
    {
      // already known, or its parent is not (yet) known to descend from the root.
      if (descendants.has(entry.name)) continue;
      if (descendants.has(entry.superName) === false) continue;

      descendants.add(entry.name);
      grew = true;
    }
  }

  return descendants;
}

/**
 * Collects every too-late state seeding performed by one class.
 * @param {{name: string, node: object, filePath: string}} entry The class to inspect.
 * @returns {{filePath: string, line: number, className: string, detail: string}[]} The violations.
 */
function collectClassViolations(entry)
{
  const violations = [];

  for (const member of entry.node.body.body)
  {
    // a class field is applied only after super() returns, which is after the list was built.
    if (member.type === 'PropertyDefinition' && member.static !== true)
    {
      const fieldName = member.key.name ?? '(computed)';

      violations.push({
        filePath: entry.filePath,
        line: member.loc.start.line,
        className: entry.name,
        detail: `class field \`${fieldName}\` — move it into initMembers()`,
      });

      continue;
    }

    // the constructor calling initMembers() itself is the other way to be too late.
    if (member.type !== 'MethodDefinition' || member.kind !== 'constructor') continue;

    walk(member.value, node =>
    {
      if (node.type !== 'CallExpression') return;

      const { callee } = node;
      if (!callee || callee.type !== 'MemberExpression') return;
      if (callee.object.type !== 'ThisExpression') return;
      if (callee.property.name !== 'initMembers') return;

      violations.push({
        filePath: entry.filePath,
        line: node.loc.start.line,
        className: entry.name,
        detail: 'constructor calls this.initMembers() — J-Base already calls it, earlier',
      });
    });
  }

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

  const classes = [];

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

    classes.push(...collectClasses(filePath, ast));
  }

  // resolve the family first, since a class three links from the root is just as affected as one.
  const descendants = resolveDescendants(classes);

  const violations = classes.filter(entry => descendants.has(entry.name))
    .flatMap(entry => collectClassViolations(entry));

  if (violations.length === 0)
  {
    Logger.logAnyway('window-command-state verify: OK (every command window seeds in initMembers).',
      LogStyle.brightGreen);
    return 0;
  }

  Logger.logAnyway(`window-command-state verify FAILED: ${violations.length} violation(s) found.`, LogStyle.brightRed);
  Logger.logAnyway('  Window_Command.initialize builds the command list before a subclass can set itself', LogStyle.brightYellow);
  Logger.logAnyway('  up, so implement the initMembers() hook instead- J-Base calls it early enough.', LogStyle.brightYellow);

  for (const violation of violations)
  {
    Logger.logAnyway(`  • ${violation.filePath}:${violation.line}: ${violation.className} has a ${violation.detail}`,
      LogStyle.brightRed);
  }

  return 1;
}

const exitCode = await main();
process.exit(exitCode);
//endregion verify-no-late-window-command-state
