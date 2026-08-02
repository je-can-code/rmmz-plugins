//region verify-no-direct-property-getset
/**
 * Verifies that no plugin source file reaches directly into a private field.
 *
 * A field is only ever touched by the code that owns it: its constructor, its initializer, its
 * getter, or its setter. Everything else goes through `someProperty()` / `setSomeProperty(value)`.
 * Reaching past an accessor couples callers to storage they do not own, and makes every future
 * change to that storage a codebase-wide search.
 *
 * NAMESPACES ARE NOT FIELDS. Nested underscore properties model namespaces in this codebase:
 *
 *   this._j._pixel._abs._foo
 *   \__/                       root namespace
 *   \___________/              plugin namespace
 *   \__________________/       extension namespace
 *                       \____/ THE FIELD
 *
 * A segment counts as a namespace when something, anywhere in the plugin tree, assigns *through*
 * it to a deeper property. The first segment nothing assigns through is the field, and that is what
 * this rule polices. Traversing namespaces is fine; landing on a field is not.
 *
 * A collection is a field, not a namespace. `this._j._spriteCache.get(key)` is a violation because
 * a Map's entries are not properties; `this.spriteCache().get(key)` is correct.
 *
 * RMMZ's own internals are NOT exempt. The engine ships accessors for only a handful of its private
 * fields, so J.BASE supplies the rest — see `_base/objects`, `_base/windows`, and friends. Carving
 * out an exception for engine-owned storage would just relocate the problem into GGG's namespace.
 *
 * Usage:
 *   node src/build-tools/verify-no-direct-property-getset.js
 */
import * as fs from 'fs/promises';
import { glob } from 'glob';
import path from 'node:path';
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
 * Walks every node of an AST, invoking a visitor with each node and its parent.
 * @param {object} node The node to walk.
 * @param {(node: object, parent: object|null) => void} visit The visitor.
 * @param {object|null} parent The parent node.
 */
function walk(node, visit, parent = null)
{
  // anything without a type is not a node worth descending into.
  if (!node || typeof node.type !== 'string') return;

  visit(node, parent);

  for (const key of Object.keys(node))
  {
    // location metadata carries no child nodes.
    if (key === 'type' || key === 'loc' || key === 'range') continue;

    const child = node[key];

    if (Array.isArray(child))
    {
      child.forEach(entry => walk(entry, visit, node));
    }
    else if (child && typeof child.type === 'string')
    {
      walk(child, visit, node);
    }
  }
}

/**
 * Resolves a member expression into its `this.`-rooted property chain.
 * @param {object} node The member expression to resolve.
 * @returns {string[]|null} The chain of property names, or null when not rooted at `this`.
 */
function chainOf(node)
{
  const parts = [];
  let current = node;

  // unwind the member expression from the leaf back toward its root.
  while (current?.type === 'MemberExpression')
  {
    // computed access cannot be resolved to a stable name.
    if (current.computed || current.property?.type !== 'Identifier') return null;

    parts.unshift(current.property.name);
    current = current.object;
  }

  return current?.type === 'ThisExpression' ? parts : null;
}

/**
 * Determines whether a member expression is the target of a write.
 * @param {object} node The member expression.
 * @param {object|null} parent Its parent node.
 * @returns {boolean}
 */
const isWriteTarget = (node, parent) =>
  (parent?.type === 'AssignmentExpression' && parent.left === node)
  || (parent?.type === 'UpdateExpression' && parent.argument === node);

/**
 * Derives the accessor name a private field would be exposed through.
 * @param {string} field The private field name.
 * @returns {string} The accessor name.
 */
const accessorNameFor = field => field.replace(/^_+/, '');

/**
 * Determines whether a method's name marks it as the accessor for a given field.
 *
 * This is the one place naming is allowed to matter. The shape test is the primary signal, but it
 * only sees the simplest bodies; a method called `setHcr` that assigns `_hcr` is that field's setter
 * no matter how many lines it takes to get there. Every accepted prefix is one the codebase already
 * uses for accessors, so this cannot quietly bless an arbitrary method.
 * @param {string} methodName The method being inspected.
 * @param {string} fieldAccessor The field's bare name, without its leading underscores.
 * @returns {boolean}
 */
function isNamedForField(methodName, fieldAccessor)
{
  if (!methodName || !fieldAccessor) return false;

  const bare = fieldAccessor.toLowerCase();
  const name = methodName.toLowerCase();

  // the accessor may read as the field itself, or as a question, or as an assignment.
  return [ '', 'get', 'set', 'is', 'has', 'can', 'should' ].some(prefix => name === `${prefix}${bare}`);
}

/**
 * The most statements an accessor's body may hold before it stops being an accessor.
 *
 * Three covers every honest shape in this tree: a bare `return this._foo;`, a setter that guards against
 * an unchanged value before assigning and then refreshes, and a getter that seeds its namespace on the
 * way out. Anything longer is orchestrating something, and orchestration reaches the field the same way
 * every other caller does.
 * @type {number}
 */
const MAX_ACCESSOR_STATEMENTS = 3;

/**
 * Determines whether a property chain names state this rule governs.
 *
 * Either the leaf is underscored, or the chain hangs off one of our own namespaces- `this._j.moreVisible`
 * is instance state whatever its leaf is called. Both the accessor test and the violation walk ask this,
 * because a method judged against fields the accessor test never saw looks like it owns nothing.
 * @param {string[]} chain The dotted property chain, rooted at `this`.
 * @returns {boolean}
 */
function isOurField(chain)
{
  if (chain[chain.length - 1].startsWith('_')) return true;

  return chain.length > 1 && chain[0].startsWith('_');
}

/**
 * Determines whether a field touch writes to the field.
 * @param {object} node The member expression touching the field.
 * @param {object|null} parent The parent of that expression.
 * @param {boolean} indexedInto Whether the touch is a computed index into the field.
 * @param {Map<object, object>} grandparentOf Parent lookup, for resolving computed writes.
 * @returns {boolean}
 */
function writesField(node, parent, indexedInto, grandparentOf)
{
  // a plain assignment to the field itself.
  if (parent?.type === 'AssignmentExpression' && parent.left === node) return true;

  // `this._metrics.misses++` writes the field just as surely as `= x + 1` would.
  if (parent?.type === 'UpdateExpression' && parent.argument === node) return true;

  // `setEventByIndex(index, event) { this._events[index] = event; }` is the owning mutator of
  // `_events` just as much as a whole-field assignment would be.
  return indexedInto && isWriteTarget(parent, grandparentOf.get(parent));
}

/**
 * Determines whether a function is short enough to be an accessor.
 * @param {object} fnNode The function node to measure.
 * @returns {boolean}
 */
function isAccessorSized(fnNode)
{
  // an expression-bodied arrow is as short as a body gets.
  if (fnNode.body?.type !== 'BlockStatement') return true;

  return fnNode.body.body.length <= MAX_ACCESSOR_STATEMENTS;
}

/**
 * Determines whether a parent node hands the field it wraps back out to a caller.
 *
 * A bare `return this._foo;` is the obvious case, but a getter that copies on the way out —
 * `return [ ...this._states ];` or `return Array.from(this._states);` — is still a getter.
 * @param {object|null} parent The parent of the member expression touching the field.
 * @returns {boolean}
 */
const handsFieldOut = parent => parent?.type === 'ReturnStatement'
  || parent?.type === 'SpreadElement'
  || parent?.type === 'CallExpression';
/**
 * Determines whether a node is a field being indexed into, as in `this._events[index]`.
 * @param {object} node The member expression resolving to the field.
 * @param {object|null} parent Its parent node.
 * @returns {boolean}
 */
const isIndexedInto = (node, parent) =>
  parent?.type === 'MemberExpression' && parent.object === node && parent.computed;

/**
 * Identifies the field a method is the accessor for, by its SHAPE rather than its name.
 *
 * A getter is a method whose entire body returns one private field. A setter is a method whose
 * entire body assigns one. What they are *called* is a naming concern and deliberately none of this
 * rule's business — `boardWindow()`, `getAllAggros()` and `isEngagementLocked()` are all perfectly
 * good accessors, and the build has no opinion on which style you prefer.
 * @param {object} fnNode The function node to inspect.
 * @returns {string|null} The dotted field path this method accesses, or null if it is not an accessor.
 */
function accessorFieldOf(fnNode)
{
  if (!fnNode.body) return null;

  // gather every private field this method touches, and note whether it is returned or assigned.
  const touched = new Set();
  let returnsField = false;
  let assignsField = false;

  // a computed write needs its grandparent to tell an assignment from a plain read.
  const grandparentOf = new Map();
  walk(fnNode.body, (node, parent) => grandparentOf.set(node, parent));

  walk(fnNode.body, (node, parent) =>
  {
    if (node.type !== 'MemberExpression') return;

    // a private method call is behaviour, not a field touch.
    if (parent?.type === 'CallExpression' && parent.callee === node) return;

    const chain = chainOf(node);
    if (!chain?.length) return;

    if (isOurField(chain) === false) return;

    // only the outermost expression of a chain counts, so `a._b._c` is recorded once. Computed
    // access is the exception: `this._events[index]` cannot extend the dotted chain, so the field
    // itself is what got touched.
    const indexedInto = isIndexedInto(node, parent);
    if (parent?.type === 'MemberExpression' && parent.object === node && !indexedInto) return;

    touched.add(chain.join('.'));

    if (handsFieldOut(parent)) returnsField = true;
    if (writesField(node, parent, indexedInto, grandparentOf)) assignsField = true;
  });

  // an accessor concerns itself with exactly one field. Touching a second makes it behaviour, even
  // if it happens to return the first — that is the difference between `flatGuardReduction()` and
  // something like `resetPhases()`.
  if (touched.size !== 1) return null;

  // and it must actually be reading it out or writing it in; merely mentioning it is not enough.
  if (!returnsField && !assignsField) return null;

  const [ field ] = touched;

  // a method that both hands its one field out *and* writes it is memoizing: read the cache, compute
  // on a miss, store, return. That is still an accessor however long the computation runs, so it is
  // reported alongside the field to spare it the length test.
  return {
    field,
    memoizing: returnsField && assignsField,
  };
}

/**
 * Collects every namespace segment across the whole plugin tree.
 *
 * Namespaces are seeded in one file's initializer and read from many others, so membership has to
 * be decided across all files at once rather than per file.
 * @param {Map<string, object>} astsByPath Parsed sources keyed by path.
 * @returns {Set<string>} The dotted namespace paths.
 */
function collectNamespaces(astsByPath)
{
  const namespaces = new Set();

  for (const ast of astsByPath.values())
  {
    walk(ast, (node, parent) =>
    {
      if (node.type !== 'MemberExpression') return;

      const chain = chainOf(node);

      // a single-segment chain has no namespace above it.
      if (!chain || chain.length < 2) return;
      if (!isWriteTarget(node, parent)) return;

      // everything above the assigned leaf is acting as a namespace.
      for (let index = 1; index < chain.length; index++)
      {
        namespaces.add(chain.slice(0, index).join('.'));
      }
    });
  }

  return namespaces;
}

/**
 * Collects every field access that bypasses an accessor in a single file.
 * @param {string} filePath The repository-relative file path.
 * @param {object} ast The parsed source.
 * @param {Set<string>} namespaces The known namespace segments.
 * @returns {object[]} The violations found.
 */
function collectViolations(filePath, ast, namespaces)
{
  const violations = [];

  walk(ast, node =>
  {
    const isClassMethod = node.type === 'MethodDefinition';
    const isPrototypeAssignment = node.type === 'AssignmentExpression'
      && node.left.type === 'MemberExpression'
      && node.left.property?.type === 'Identifier'
      && (node.right.type === 'FunctionExpression' || node.right.type === 'ArrowFunctionExpression');

    if (!isClassMethod && !isPrototypeAssignment) return;

    const methodName = isClassMethod
      ? (node.key.name ?? String(node.key.value))
      : node.left.property.name;

    const fnNode = isClassMethod
      ? node.value
      : node.right;

    if (!fnNode.body) return;

    // constructors and initializers legitimately seed the fields they own.
    if (isClassMethod && node.kind === 'constructor') return;
    if (/^init/i.test(methodName)) return;

    // a method that IS an accessor is allowed to touch the one field it accesses.
    const ownedField = accessorFieldOf(fnNode);
    const alreadyReported = new Set();

    walk(fnNode.body, (inner, parent) =>
    {
      if (inner.type !== 'MemberExpression') return;

      // `this._doThing()` is a private *method* call, not field access. Methods are behaviour and
      // are allowed to be private; this rule polices state.
      if (parent?.type === 'CallExpression' && parent.callee === inner) return;

      const chain = chainOf(inner);
      if (!chain) return;

      // walk down the chain to the first segment that is not a namespace; that is the field.
      let fieldIndex = -1;
      for (let index = 0; index < chain.length; index++)
      {
        if (!namespaces.has(chain.slice(0, index + 1).join('.')))
        {
          fieldIndex = index;
          break;
        }
      }

      // an all-namespace chain touches no field at all.
      if (fieldIndex === -1) return;

      // report the field itself, not the longer expressions built on top of it.
      if (chain.length !== fieldIndex + 1) return;

      const field = chain[fieldIndex];

      // public properties are not this rule's business- `this.opacity` is the engine's, not ours.
      //
      // But anything hanging off a namespace *is* instance state whatever it is called, so a leaf like
      // `this._j.moreVisible` counts even though the leaf itself is not underscore-prefixed. Without
      // that, `_j` reads as a namespace, the leaf reads as public, and between the two the field is
      // invisible to this rule. The rest of the tree writes these as `this._j._thing._field`, with the
      // leaf underscored and an accessor pair to reach it.
      // ...and only when the namespace it hangs off is ours. `this.contents.fontSize` is the engine's
      // public bitmap, reached through a public property; that is not this rule's business either.
      const isOurNamespacedLeaf = fieldIndex > 0 && chain[0].startsWith('_');
      if (!field.startsWith('_') && !isOurNamespacedLeaf) return;

      const dotted = chain.join('.');
      const fieldAccessor = accessorNameFor(field);

      // this method is the accessor for exactly this field, which is where it belongs.
      //
      // touching exactly one field is necessary but not sufficient, or any method that happened to reach
      // one would be exempt. A real accessor hands its field in or out and does nothing else, so its body
      // is short; anything long enough to branch and orchestrate is behaviour, and behaviour asks nicely
      // like everyone.
      if (ownedField?.field === dotted && (ownedField.memoizing || isAccessorSized(fnNode))) return;

      // ...and so is a method NAMED for the field it touches, however long it runs. A setter that seeds
      // its namespace first, or a getter that copies on the way out, is still that field's owner, and
      // telling it to call itself is never the right advice.
      if (isNamedForField(methodName, fieldAccessor)) return;

      const key = `${inner.loc.start.line}:${dotted}`;
      if (alreadyReported.has(key)) return;
      alreadyReported.add(key);

      violations.push({
        filePath,
        line: inner.loc.start.line,
        method: methodName,
        path: dotted,
        accessor: isWriteTarget(inner, parent)
          ? `this.set${fieldAccessor.charAt(0)
            .toUpperCase()}${fieldAccessor.slice(1)}(value)`
          : `this.${fieldAccessor}()`,
        isWrite: isWriteTarget(inner, parent),
      });
    });
  });

  return violations;
}

/**
 * Prints the celebratory failure banner.
 * @param {number} count The number of violations found.
 * @param {number} fileCount The number of files involved.
 */
function printFailureBanner(count, fileCount)
{
  // the rainbow renderer colours one character at a time, which splits multi-byte emoji apart —
  // so the emoji get their own solid-styled lines and the rainbow is reserved for plain ASCII.
  Logger.logAnyway('', LogStyle.reset);
  Logger.logAnyway('🎆🎇🎏🎆🎇🎏🎆🎇🎏🎆🎇🎏🎆🎇🎏🎆🎇🎏🎆🎇🎏🎆🎇🎏', LogStyle.brightYellow);
  Logger.logAnyway('D I R E C T   P R O P E R T Y   A C C E S S   D E T E C T E D', LogStyle.rainbow);
  Logger.logAnyway('🎏🎇🎆🎏🎇🎆🎏🎇🎆🎏🎇🎆🎏🎇🎆🎏🎇🎆🎏🎇🎆🎏🎇🎆', LogStyle.brightYellow);
  Logger.logAnyway('', LogStyle.reset);
  Logger.logAnyway(`   ${count} field(s) touched outside their accessors, across ${fileCount} file(s).`, LogStyle.brightRed);
  Logger.logAnyway('   Fields belong to their getters and setters. Everyone else asks nicely.', LogStyle.brightYellow);
  Logger.logAnyway('', LogStyle.reset);
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

  // parse everything once; both passes below read the same ASTs.
  const astsByPath = new Map();
  for (const filePath of files)
  {
    try
    {
      astsByPath.set(path.normalize(filePath), parse(await fs.readFile(filePath, 'utf-8')));
    }
    catch (error)
    {
      Logger.logAnyway(`  • ${filePath}: could not parse — ${error.message}`, LogStyle.brightRed);
      return 1;
    }
  }

  const namespaces = collectNamespaces(astsByPath);

  const violations = [];
  for (const [ filePath, ast ] of astsByPath)
  {
    violations.push(...collectViolations(filePath, ast, namespaces));
  }

  if (violations.length === 0)
  {
    Logger.logAnyway('direct-property verify: OK (every field reached through its accessor).', LogStyle.brightGreen);
    return 0;
  }

  // group by file so the output reads as a work list rather than a wall.
  const byFile = new Map();
  for (const violation of violations)
  {
    if (!byFile.has(violation.filePath)) byFile.set(violation.filePath, []);
    byFile.get(violation.filePath)
      .push(violation);
  }

  printFailureBanner(violations.length, byFile.size);

  const ranked = [ ...byFile.entries() ].sort((a, b) => b[1].length - a[1].length);

  for (const [ filePath, fileViolations ] of ranked)
  {
    Logger.logAnyway(`  ${filePath}  (${fileViolations.length})`, LogStyle.brightCyan);

    for (const violation of fileViolations)
    {
      const verb = violation.isWrite
        ? 'writes'
        : 'reads';

      Logger.logAnyway(
        `    :${violation.line}  ${violation.method}() ${verb} this.${violation.path}  →  use ${violation.accessor}`,
        LogStyle.brightRed);
    }
  }

  Logger.logAnyway('', LogStyle.reset);
  Logger.logAnyway(`${violations.length} violation(s). Go get 'em.`, LogStyle.rainbow);
  Logger.logAnyway('🎆🎇🎏🎆🎇🎏🎆🎇🎏🎆🎇🎏🎆🎇🎏🎆🎇🎏🎆🎇🎏🎆🎇🎏', LogStyle.brightYellow);
  Logger.logAnyway('', LogStyle.reset);

  return 1;
}

const exitCode = await main();
process.exit(exitCode);
//endregion verify-no-direct-property-getset
