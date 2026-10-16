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
 * The check is deliberately narrow, because narrow is what makes it trustworthy. It judges the two
 * shapes whose receiver is decidable without type inference:
 *
 * - a bare capitalised identifier- `IconManager.longParam(…)`, `TextManager.param(…)`- which names
 *   its class outright
 * - a parameter its function's JSDoc types wholly in classes- `battler.setAutoRuleLastFrame(…)` under
 *   `@param {Game_Actor|Game_Enemy} battler`- which names its classes in the doc block
 *
 * The second shape is here because of J-Passive-Conditional, which shipped
 * `battler.setAutoApplyLastFrame(…)` for a setter only ever named `setAutoRuleLastFrame`. Its unit test
 * built the battler by hand with the same wrong name, so the suite stayed green, and the first battler
 * to step off a stand-rule state threw. A typed call passes when any class its JSDoc names declares the
 * member. A type the index cannot speak for- `object`, `Foo[]`, a class inheriting from a library the
 * index cannot see- leaves the call unjudged rather than guessed at. Anything else- a local, a property
 * chain, `this`- is left alone.
 *
 * Membership is resolved against the union of:
 *
 * - every class declared in `src/plugins/**`, including statics, getters, setters and fields, and the
 *   fields its constructor and methods assign on `this`
 * - every prototype patch and static assignment the tree makes onto a class
 * - the vendored RMMZ engine, so `TextManager.param` and friends resolve as the real methods they are
 * - the PIXI classes the engine's display classes inherit from, written down in {@link PIXI_CLASSES}
 *
 * ...and it walks the inheritance chain, so a static defined on `AutoRuleManager` resolves through
 * `AutoApplyStateManager` exactly as it does at runtime.
 *
 * **On trusting a green result.** A detector that reports "all clear" is indistinguishable from a
 * detector that is quietly broken, and this one is only as good as its index- if the engine files
 * went missing, `members` would come up short and every engine call would read as a phantom, or a
 * mis-scoped index would silently resolve everything. So the engine files are mandatory rather than
 * best-effort, and `--selftest` runs the controls: two planted defects that must be caught, two real
 * calls that must resolve, and a planted typed-parameter method that must yield exactly the one phantom
 * it carries. Run it whenever the result surprises you.
 *
 * Usage:
 *   bun src/build-tools/verify-no-phantom-calls.js
 *   bun src/build-tools/verify-no-phantom-calls.js --selftest
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
 * Members every object inherits from `Object.prototype`, which no class in the tree declares.
 * @type {Set<string>}
 */
const OBJECT_MEMBERS = new Set([
  'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString', 'toString', 'valueOf',
]);

/**
 * A JSDoc `@param` line: its type in braces, then its name, bracketed when the parameter is optional.
 *
 * <pre>
 * Structure:
 *  @param {TYPE} NAME
 *
 * Example:
 *  @param {Game_Actor|Game_Enemy} battler The battler that just moved.
 *
 * Translation:
 *  the parameter battler holds a Game_Actor or a Game_Enemy
 * </pre>
 * @type {RegExp}
 */
const JSDOC_PARAM = /@param\s+\{([^}]+)\}\s+\[?([A-Za-z_$][\w$]*)/g;

/**
 * A type the class index can answer for: one bare, capitalised name, with no array, generic, record or
 * function syntax around it.
 * @type {RegExp}
 */
const CLASS_TYPE = /^[A-Z][\w$]*$/;

/**
 * The node types that are functions, and so declare parameters of their own.
 * @type {Set<string>}
 */
const FUNCTION_TYPES = new Set([ 'FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression' ]);

/**
 * The nodes a JSDoc block can sit in front of on the way down to the function it documents, as in
 * `Foo.prototype.bar = function`, `static bar()`, `const bar = () =>` and `export function bar`.
 * @type {Set<string>}
 */
const DOC_CARRIERS = new Set([
  'ExpressionStatement',
  'AssignmentExpression',
  'MethodDefinition',
  'PropertyDefinition',
  'Property',
  'VariableDeclaration',
  'VariableDeclarator',
  'ExportNamedDeclaration',
  'ExportDefaultDeclaration',
]);

/**
 * The PIXI classes the engine's display classes inherit from, with the methods each one declares.
 *
 * The engine derives from PIXI (`Sprite` from `PIXI.Sprite`, `Window` and its kin from `PIXI.Container`),
 * but PIXI ships as a bundled library rather than as source this gate indexes, so `sprite.addChild()`
 * would otherwise resolve nowhere. These are PIXI 5.3's own prototype methods, read out of
 * `project/js/libs/pixi.js`. A PIXI class missing from here leaves its heirs unjudged rather than
 * wrongly flagged, through {@link ClassIndex#isOpen}.
 * @type {{name: string, parent: string, members: string[]}[]}
 */
const PIXI_CLASSES = [
  {
    name: 'PIXI.utils.EventEmitter',
    parent: String(),
    members: [
      'addListener', 'emit', 'eventNames', 'listenerCount', 'listeners', 'off', 'on', 'once', 'removeAllListeners',
      'removeListener',
    ],
  },
  {
    name: 'PIXI.DisplayObject',
    parent: 'PIXI.utils.EventEmitter',
    members: [
      'destroy', 'disableTempParent', 'enableTempParent', 'getBounds', 'getGlobalPosition', 'getLocalBounds',
      'setParent', 'setTransform', 'toGlobal', 'toLocal', 'updateTransform',
    ],
  },
  {
    name: 'PIXI.Container',
    parent: 'PIXI.DisplayObject',
    members: [
      'addChild', 'addChildAt', 'calculateBounds', 'destroy', 'getChildAt', 'getChildByName', 'getChildIndex',
      'getLocalBounds', 'onChildrenChange', 'removeChild', 'removeChildAt', 'removeChildren', 'render',
      'renderAdvanced', 'setChildIndex', 'sortChildren', 'swapChildren', 'updateTransform',
    ],
  },
  {
    name: 'PIXI.Sprite',
    parent: 'PIXI.Container',
    members: [ 'calculateTrimmedVertices', 'calculateVertices', 'containsPoint', 'destroy', 'getLocalBounds' ],
  },
  {
    name: 'PIXI.TilingSprite',
    parent: 'PIXI.Sprite',
    members: [ 'containsPoint', 'destroy', 'getLocalBounds' ],
  },
];

/**
 * A planted method making the very call J-Passive-Conditional shipped: a stand-rule cooldown stamped
 * through a setter that has never existed, beside the real one, and a call on a parameter whose type
 * no class describes. Exactly the phantom setter must be reported.
 * @type {string}
 */
const PLANTED_TYPED_SOURCE = [
  '/**',
  ' * Resets a stand rule cooldown.',
  ' * @param {Game_Actor|Game_Enemy} battler The battler that just moved.',
  ' * @param {object} context Something no class describes.',
  ' */',
  'function plantedReset(battler, context)',
  '{',
  '  battler.setAutoRuleLastFrame(1, 2);',
  '  battler.setAutoApplyLastFrame(1, 2);',
  '  context.anythingAtAll();',
  '}',
].join('\n');

/**
 * Parses source into an AST with location data.
 * @param {string} source The raw source text.
 * @param {string} sourceType Either 'module' for plugin source or 'script' for the vendored engine.
 * @returns {object} The parsed program.
 */
const parse = (source, sourceType) => acorn.parse(source, { ecmaVersion: 'latest', sourceType, locations: true });

/**
 * Parses plugin source along with its comments, which is where the typed-parameter rule reads JSDoc from.
 * @param {string} source The raw source text.
 * @returns {{ast: object, comments: object[]}} The parsed program and every comment in it.
 */
function parseWithComments(source)
{
  const comments = [];
  const ast = acorn.parse(source, {
    ecmaVersion: 'latest',
    sourceType: 'module',
    locations: true,
    onComment: comments,
  });

  return { ast, comments };
}

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
 * Walks every node of an AST like {@link walk}, also handing the visitor the nodes above it.
 * @param {object} node The node to walk.
 * @param {object[]} ancestors The nodes above this one, nearest last. Shared and mutated as the walk goes.
 * @param {(node: object, ancestors: object[]) => void} visit The visitor.
 */
function walkWithAncestors(node, ancestors, visit)
{
  // anything without a type is not a node worth descending into.
  if (!node || !node.type) return;

  visit(node, ancestors);
  ancestors.push(node);

  for (const key of Object.keys(node))
  {
    // skip the location bookkeeping acorn hangs off every node.
    if (key === 'loc' || key === 'start' || key === 'end') continue;

    const child = node[key];

    // a node's children arrive either singly or in a list.
    if (Array.isArray(child))
    {
      child.forEach(entry => walkWithAncestors(entry, ancestors, visit));
    }
    else if (child && child.type)
    {
      walkWithAncestors(child, ancestors, visit);
    }
  }

  ancestors.pop();
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

  /**
   * Determines whether a class inherits from something this index never saw declared, such as a
   * library class. A member missing from everything the index holds may still exist on that parent.
   * @param {string} className The class to check.
   * @returns {boolean}
   */
  isOpen(className)
  {
    let current = className;

    // a cycle should be impossible, but a malformed index must not hang the build.
    const visited = new Set();

    while (current !== undefined && visited.has(current) === false)
    {
      visited.add(current);

      // a class nobody declared is one whose members the index cannot list.
      if (this.knows(current) === false) return true;

      current = this.parents.get(current);
    }

    return false;
  }
}

/**
 * Seeds the index with the PIXI classes the engine's display classes inherit from.
 * @param {ClassIndex} index The index to populate.
 */
function indexPixi(index)
{
  for (const { name, parent, members } of PIXI_CLASSES)
  {
    members.forEach(member => index.addMember(name, member));

    if (parent !== String()) index.addParent(name, parent);
  }
}

/**
 * Reads a plain or namespaced name: `Foo`, `PIXI.Container` or `PIXI.utils.EventEmitter`.
 * @param {object} node The expression to read.
 * @returns {string} The dotted name, or an empty string when the expression is anything else.
 */
function readQualifiedName(node)
{
  if (node.type === 'Identifier') return node.name;
  if (node.type !== 'MemberExpression' || node.computed || node.property.type !== 'Identifier') return String();

  const owner = readQualifiedName(node.object);

  return owner === String() ? String() : `${owner}.${node.property.name}`;
}

/**
 * Reads whose prototype an expression names: `Foo.prototype` gives `Foo`, and `PIXI.Sprite.prototype`
 * keeps its dotted name.
 * @param {object} node The expression naming the prototype.
 * @returns {string} The owner's name, or an empty string when the expression names no prototype.
 */
function readPrototypeOwner(node)
{
  if (node.type !== 'MemberExpression' || node.computed) return String();
  if (node.property.type !== 'Identifier' || node.property.name !== 'prototype') return String();

  return readQualifiedName(node.object);
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

  // a parent reached through a namespace, like PIXI.Container, keeps its dotted name.
  const parentName = node.superClass ? readQualifiedName(node.superClass) : String();
  if (parentName !== String()) index.addParent(className, parentName);

  for (const element of node.body.body)
  {
    // a computed member name is a runtime string; there is nothing static to record.
    if (element.computed) continue;
    if (!element.key || element.key.type !== 'Identifier') continue;

    index.addMember(className, element.key.name);
  }

  // a field a constructor or method assigns on `this` is a member too, a function-valued one included.
  walk(node.body, inner =>
  {
    if (inner.type !== 'AssignmentExpression' || inner.left.type !== 'MemberExpression') return;

    const { object, property, computed } = inner.left;
    if (object.type !== 'ThisExpression' || computed || property.type !== 'Identifier') return;

    index.addMember(className, property.name);
  });
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
    if (!firstArgument) return;

    // the parent may sit in a namespace, as the engine's PIXI-derived classes do.
    const parentName = readPrototypeOwner(firstArgument);
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
 * Reads the parameters a JSDoc block types entirely with class names.
 *
 * A parameter typed `{object}`, `{Foo[]}` or `{number|Foo}` could hold something no class describes,
 * so it is left out rather than judged.
 * @param {string} docText The comment's text, without its delimiters.
 * @returns {Map<string, string[]>} Each parameter's name, to the classes its type allows.
 */
function readTypedParams(docText)
{
  const typed = new Map();

  for (const [ , typeText, name ] of docText.matchAll(JSDOC_PARAM))
  {
    // `?Foo` and `Foo=` mark a nullable and an optional parameter; the class underneath is the same.
    const types = typeText.split('|')
      .map(type => type.trim()
        .replace(/^[?!]/, '')
        .replace(/=$/, ''));

    if (types.every(type => CLASS_TYPE.test(type))) typed.set(name, types);
  }

  return typed;
}

/**
 * Maps each JSDoc block that types a parameter to where the code it documents begins.
 * @param {string} source The raw source text.
 * @param {object[]} comments Every comment acorn found in the source.
 * @returns {Map<number, Map<string, string[]>>} The offset of each documented node, to its typed parameters.
 */
function indexDocs(source, comments)
{
  const docs = new Map();

  for (const comment of comments)
  {
    // only a `/** … */` block is JSDoc.
    if (comment.type !== 'Block' || comment.value.startsWith('*') === false) continue;

    const typed = readTypedParams(comment.value);
    if (typed.size === 0) continue;

    // the documented code starts at the first character after the block that is not blank.
    let offset = comment.end;
    while (offset < source.length && /\s/.test(source[offset])) offset++;

    docs.set(offset, typed);
  }

  return docs;
}

/**
 * Finds the JSDoc typing a function's parameters. A block documents a function when it ends right
 * where the function begins, or where one of the nodes it can sit in front of begins: the statement
 * assigning it, the class member holding it, the declaration naming it.
 * @param {object} fn The function node.
 * @param {object[]} ancestors The function's ancestors, nearest last.
 * @param {Map<number, Map<string, string[]>>} docs The offset of each documented node, to its typed parameters.
 * @returns {Map<string, string[]>} The typed parameters, empty when no block documents the function.
 */
function findDoc(fn, ancestors, docs)
{
  if (docs.has(fn.start)) return docs.get(fn.start);

  for (let depth = ancestors.length - 1; depth >= 0; depth--)
  {
    const ancestor = ancestors[depth];

    // a function handed to a call or nested in an expression is not what a block above it documents.
    if (DOC_CARRIERS.has(ancestor.type) === false) break;
    if (docs.has(ancestor.start)) return docs.get(ancestor.start);
  }

  return new Map();
}

/**
 * The names a function declares as parameters, whether or not they carry a default value.
 * @param {object} fn The function node.
 * @returns {string[]}
 */
function parameterNames(fn)
{
  return fn.params
    .map(param => (param.type === 'AssignmentPattern' ? param.left : param))
    .filter(param => param.type === 'Identifier')
    .map(param => param.name);
}

/**
 * Determines whether a documented type is one the index can answer for.
 * @param {string} type The class name the JSDoc gives.
 * @param {ClassIndex} index The populated class index.
 * @returns {boolean}
 */
function isJudgeableType(type, index)
{
  return UNJUDGEABLE_RECEIVERS.has(type) === false && index.knows(type);
}

/**
 * Records a call when it is a method call made directly on one of the parameters being tracked.
 * @param {object} node The call expression.
 * @param {Map<string, string[]>} tracked Each tracked parameter in scope, to its classes.
 * @param {{receiver: string, member: string, types: string[], line: number}[]} found Where the call is recorded.
 */
function recordTypedCall(node, tracked, found)
{
  const { callee } = node;
  if (callee.type !== 'MemberExpression' || callee.computed) return;
  if (callee.object.type !== 'Identifier' || callee.property.type !== 'Identifier') return;

  const receiver = callee.object.name;
  if (tracked.has(receiver) === false) return;

  found.push({ receiver, member: callee.property.name, types: tracked.get(receiver), line: node.loc.start.line });
}

/**
 * Collects the calls a function body makes on its tracked parameters. A nested function that declares
 * a parameter by the same name hides the outer one, so the name is dropped inside it.
 * @param {object} node The node to search.
 * @param {Map<string, string[]>} tracked Each tracked parameter in scope, to its classes.
 * @param {{receiver: string, member: string, types: string[], line: number}[]} found Where each call is recorded.
 */
function collectTypedCalls(node, tracked, found)
{
  // anything without a type is not a node worth descending into.
  if (!node || !node.type) return;

  let inScope = tracked;

  if (FUNCTION_TYPES.has(node.type))
  {
    const shadowed = parameterNames(node);
    inScope = new Map([ ...tracked ].filter(([ name ]) => shadowed.includes(name) === false));

    // nothing being tracked is visible in here.
    if (inScope.size === 0) return;
  }

  if (node.type === 'CallExpression') recordTypedCall(node, inScope, found);

  for (const key of Object.keys(node))
  {
    // skip the location bookkeeping acorn hangs off every node.
    if (key === 'loc' || key === 'start' || key === 'end') continue;

    const child = node[key];

    // a node's children arrive either singly or in a list.
    if (Array.isArray(child))
    {
      child.forEach(entry => collectTypedCalls(entry, inScope, found));
    }
    else if (child && child.type)
    {
      collectTypedCalls(child, inScope, found);
    }
  }
}

/**
 * Collects every method call on a typed parameter that none of the parameter's documented classes
 * declares.
 *
 * A call is judged only when every class the JSDoc names is one the index knows, and it passes when
 * any one of them declares the member, on the class itself, up its inheritance chain, through any
 * prototype patch anywhere in the tree, or in the engine. So a finding is a method that exists on
 * nothing the JSDoc says the value can be.
 * @param {string} filePath The repository-relative file path.
 * @param {object} ast The parsed source.
 * @param {Map<number, Map<string, string[]>>} docs The offset of each documented node, to its typed parameters.
 * @param {ClassIndex} index The populated class index.
 * @returns {{filePath: string, line: number, receiver: string, member: string, types: string[]}[]} The violations.
 */
function collectTypedViolations(filePath, ast, docs, index)
{
  const violations = [];

  walkWithAncestors(ast, [], (node, ancestors) =>
  {
    if (FUNCTION_TYPES.has(node.type) === false) return;

    const documented = findDoc(node, ancestors, docs);
    const declared = parameterNames(node);

    // only a parameter this function declares, documented wholly in classes the index knows, is judged.
    const tracked = new Map([ ...documented ]
      .filter(([ name, types ]) => declared.includes(name) && types.every(type => isJudgeableType(type, index))));
    if (tracked.size === 0) return;

    const calls = [];
    collectTypedCalls(node.body, tracked, calls);

    for (const { receiver, member, types, line } of calls)
    {
      if (FUNCTION_MEMBERS.has(member) || OBJECT_MEMBERS.has(member)) continue;
      if (types.some(type => index.resolves(type, member))) continue;

      // a class inheriting from something the index cannot see may get the member from there.
      if (types.some(type => index.isOpen(type))) continue;

      violations.push({ filePath, line, receiver, member, types });
    }
  });

  return violations;
}

/**
 * Runs the typed-parameter control: the planted method must yield exactly one finding, for the
 * setter that never existed. The real setter has to resolve through `Game_Actor`'s inheritance chain to
 * a prototype patch in another plugin, and the parameter typed `{object}` must not be judged at all.
 * @param {ClassIndex} index The populated class index.
 * @returns {boolean} True when the control behaved as required.
 */
function runTypedControl(index)
{
  const { ast, comments } = parseWithComments(PLANTED_TYPED_SOURCE);
  const docs = indexDocs(PLANTED_TYPED_SOURCE, comments);
  const flagged = collectTypedViolations('planted', ast, docs, index)
    .map(violation => `${violation.receiver}.${violation.member}`);

  const passed = flagged.length === 1 && flagged[0] === 'battler.setAutoApplyLastFrame';
  const reported = flagged.length === 0 ? 'nothing' : flagged.join(', ');
  const style = passed ? LogStyle.brightGreen : LogStyle.brightRed;

  Logger.logAnyway(`  [${passed ? 'PASS' : 'FAIL'}] typed parameter control -> flagged ${reported}`, style);

  return passed;
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

  // PIXI is a bundled library rather than source, so what the engine inherits from it is written down.
  indexPixi(index);

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

  /** @type {{filePath: string, ast: object, docs: Map<number, Map<string, string[]>>}[]} */
  const parsed = [];

  for (const filePath of files)
  {
    let ast;
    let docs;

    try
    {
      const source = await fs.readFile(filePath, 'utf-8');
      const { ast: parsedAst, comments } = parseWithComments(source);

      ast = parsedAst;
      docs = indexDocs(source, comments);
    }
    catch (error)
    {
      Logger.logAnyway(`  • ${filePath}: could not parse — ${error.message}`, LogStyle.brightRed);

      return 1;
    }

    // indexing must finish across the whole tree before any call can be judged against it.
    indexFile(ast, index);
    parsed.push({ filePath, ast, docs });
  }

  if (process.argv.includes('--selftest'))
  {
    const controlsPassed = runControls(index);
    const typedControlPassed = runTypedControl(index);

    if (controlsPassed === false || typedControlPassed === false)
    {
      Logger.logAnyway('phantom-call verify FAILED: controls did not behave as required.', LogStyle.brightRed);
      Logger.logAnyway('  The index is wrong, so any result it produces is meaningless. Fix the index first.',
        LogStyle.brightYellow);

      return 1;
    }
  }

  const violations = [];
  const typedViolations = [];

  for (const { filePath, ast, docs } of parsed)
  {
    violations.push(...collectViolations(filePath, ast, index));
    typedViolations.push(...collectTypedViolations(filePath, ast, docs, index));
  }

  if (violations.length === 0 && typedViolations.length === 0)
  {
    Logger.logAnyway('phantom-call verify: OK (every statically-dispatched and typed-parameter call resolves).',
      LogStyle.brightGreen);

    return 0;
  }

  const total = violations.length + typedViolations.length;
  Logger.logAnyway(`phantom-call verify FAILED: ${total} violation(s) found.`, LogStyle.brightRed);
  Logger.logAnyway('  These calls name a method that does not exist on the receiver or anywhere up its', LogStyle.brightYellow);
  Logger.logAnyway('  inheritance chain. Each one throws the moment its line runs. Implement the method,', LogStyle.brightYellow);
  Logger.logAnyway('  or correct the call to the name that does exist.', LogStyle.brightYellow);

  for (const violation of violations)
  {
    Logger.logAnyway(`  • ${violation.filePath}:${violation.line}: ${violation.receiver}.${violation.member}() does not exist`,
      LogStyle.brightRed);
  }

  for (const violation of typedViolations)
  {
    const typeText = violation.types.join('|');
    const where = `${violation.filePath}:${violation.line}`;

    Logger.logAnyway(`  • ${where}: ${violation.receiver}.${violation.member}() is declared on none of {${typeText}}`,
      LogStyle.brightRed);
  }

  return 1;
}

const exitCode = await main();
process.exit(exitCode);
//endregion verify-no-phantom-calls