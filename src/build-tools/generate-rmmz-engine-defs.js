/* eslint-disable complexity -- AST classification intentionally branch-heavy */
/* eslint-disable prefer-destructuring -- clarity over micro shorthand */

/**
 * Generates RPG Maker MZ engine declarations from project/js/rmmz_*.js.
 * Parameter names from AST; types from nearby JSDoc plus lightweight body inference.
 *
 * Usage: bun src/build-tools/generate-rmmz-engine-defs.js [--clean]
 *
 * Output: src/defs/generated/rmmz/<stem>/... and index.d.ts (triple-slash references).
 */

import * as acorn from 'acorn';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  buildLineStarts,
  buildMethodSignature,
  collectThisUnderscorePropsFromFunction,
  collectThisUnderscoreUsageFromFunction,
  extractLeadingJsdoc,
  inferExprType,
  mergeInstancePropRhsObservations,
  parseJsdocBlock,
  refineInstanceBackingFieldTs,
} from './rmmz-defs-infer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const ENGINE_JS_DIR = path.join(REPO_ROOT, 'project', 'js');
const OUT_ROOT = path.join(REPO_ROOT, 'src', 'defs', 'generated', 'rmmz');

const RPG_DATA_MODELS_TEMPLATE = path.join(__dirname, 'templates', 'rpg-database-vanilla.d.ts');

/**
 * Force `$data*` globals to J-Base `RPG_*` row types from `_rpg-data-models.d.ts` (overrides vague/wrong engine JSDoc).
 *
 * @type {Readonly<Record<string, string>>}
 */
const GLOBAL_VAR_TYPE_OVERRIDES = Object.freeze({
  $dataActors: 'RPG_Actor[]',
  $dataAnimations: 'object[]',
  $dataArmors: 'RPG_Armor[]',
  $dataClasses: 'RPG_Class[]',
  $dataCommonEvents: 'object[]',
  $dataEnemies: 'RPG_Enemy[]',
  $dataItems: 'RPG_Item[]',
  $dataMap: 'object',
  $dataSkills: 'RPG_Skill[]',
  $dataStates: 'RPG_State[]',
  $dataSystem: 'object',
  $dataTilesets: 'object[]',
  $dataTroops: 'object[]',
  $dataWeapons: 'RPG_Weapon[]',
  $dataMapInfos: 'RPG_MapInfo[]',
});

const ENGINE_SOURCE_FILES = [
  { file: 'rmmz_core.js', stem: 'core' },
  { file: 'rmmz_managers.js', stem: 'managers' },
  { file: 'rmmz_objects.js', stem: 'objects' },
  { file: 'rmmz_scenes.js', stem: 'scenes' },
  { file: 'rmmz_sprites.js', stem: 'sprites' },
  { file: 'rmmz_windows.js', stem: 'windows' },
];

const BUILTIN_RECEIVERS = new Set([
  'Array', 'Number', 'String', 'Math', 'Object', 'Boolean', 'BigInt',
]);

/**
 * Minimal fallback docs when a member has no source JSDoc and no body to infer prose from.
 *
 * @param {string} summary
 * @returns {string}
 */
function fallbackDoc(summary)
{
  return ` * ${summary}`;
}

/**
 * @param {string} memberName
 * @param {string} returnTs
 * @returns {string}
 */
function fallbackMethodDoc(memberName, returnTs)
{
  const isGetLike = returnTs && returnTs !== 'void' && returnTs !== 'never';
  const verb = isGetLike ? 'Gets' : 'Performs';
  return fallbackDoc(`${verb} ${memberName}.`);
}

/**
 * `Object.defineProperties` often appears before `prototype.param` in source order, so return inference
 * can be `unknown`. Recover MZ-shaped getters from the getter body alone.
 *
 * @param {import('acorn').FunctionExpression | import('acorn').ArrowFunctionExpression} getterFn
 * @param {string} preliminaryTs
 * @returns {string}
 */
function refineDefinePropertyGetterReturn(getterFn, preliminaryTs)
{
  if (preliminaryTs !== 'unknown')
  {
    return preliminaryTs;
  }
  const body = getterFn.body;
  if (!body || body.type !== 'BlockStatement')
  {
    return preliminaryTs;
  }
  /** @type {import('acorn').ReturnStatement[]} */
  const rets = [];
  for (const st of body.body)
  {
    if (st.type === 'ReturnStatement')
    {
      rets.push(st);
    }
  }
  if (rets.length !== 1)
  {
    return preliminaryTs;
  }
  const arg = rets[0].argument;
  if (!arg)
  {
    return preliminaryTs;
  }
  if (arg.type === 'MemberExpression' && !arg.computed)
  {
    if (
      arg.object.type === 'ThisExpression'
      && arg.property.type === 'Identifier'
    )
    {
      const field = arg.property.name;
      if (field === '_hp' || field === '_mp' || field === '_tp')
      {
        return 'number';
      }
    }
    const ch = memberChain(arg);
    if (ch === '$dataSystem.currencyUnit')
    {
      return 'string';
    }
  }
  if (arg.type !== 'CallExpression' || arg.callee.type !== 'MemberExpression' || arg.callee.computed)
  {
    return preliminaryTs;
  }
  if (arg.callee.object.type !== 'ThisExpression' || arg.callee.property.type !== 'Identifier')
  {
    return preliminaryTs;
  }
  const m = arg.callee.property.name;
  if (
    m === 'param'
    || m === 'paramMax'
    || m === 'paramMin'
    || m === 'paramPlus'
    || m === 'paramBase'
    || m === 'paramRate'
    || m === 'paramBuffRate'
    || m === 'xparam'
    || m === 'sparam'
  )
  {
    return 'number';
  }
  return preliminaryTs;
}

/**
 * @typedef {{ paramsTs: string, returnTs: string, docBlock?: string, isGetter?: boolean }} MethodSig
 * @typedef {{
 *   instanceMethods: Map<string, MethodSig>,
 *   staticMethods: Map<string, MethodSig>,
 *   literalStatics: Map<string, string>,
 *   instancePropertyBuckets: Map<string, string[]>,
 *   instancePropertyUsage: Map<string, {
 *     initializedIn: Set<string>,
 *     writtenIn: Set<string>,
 *     readIn: Set<string>,
 *     consumedBy: Map<string, Set<string>>,
 *   }>,
 *   extendsBase: string | null,
 * }} ClassEntry
 */

/**
 * @param {import('acorn').MemberExpression | import('acorn').Expression} node
 * @returns {string|null}
 */
function memberChain(node)
{
  if (node.type === 'Identifier')
  {
    return node.name;
  }
  if (node.type === 'MemberExpression' && !node.computed)
  {
    if (node.property.type !== 'Identifier')
    {
      return null;
    }
    const base = memberChain(node.object);
    if (base === null)
    {
      return null;
    }
    return `${base}.${node.property.name}`;
  }
  return null;
}

/**
 * @param {import('acorn').Literal | import('acorn').UnaryExpression | import('acorn').TemplateLiteral} node
 * @returns {string|null}
 */
/**
 * @param {ClassEntry} entry
 * @param {Map<string, string>} propMap
 * @returns {void}
 */
function absorbInstanceProps(entry, propMap)
{
  if (propMap.size === 0)
  {
    return;
  }
  for (const [name, ts] of propMap)
  {
    const bucket = entry.instancePropertyBuckets.get(name) ?? [];
    bucket.push(ts);
    entry.instancePropertyBuckets.set(name, bucket);
  }
}

/**
 * @param {ClassEntry} entry
 * @param {Map<string, { reads: Set<string>, writes: Set<string>, consumes: Set<string> }>} usageMap
 * @param {string} methodName
 * @param {boolean} isInitializer
 * @returns {void}
 */
function absorbInstancePropUsage(entry, usageMap, methodName, isInitializer)
{
  if (usageMap.size === 0)
  {
    return;
  }
  for (const [prop, usage] of usageMap)
  {
    let meta = entry.instancePropertyUsage.get(prop);
    if (!meta)
    {
      meta = {
        initializedIn: new Set(),
        writtenIn: new Set(),
        readIn: new Set(),
        consumedBy: new Map(),
      };
      entry.instancePropertyUsage.set(prop, meta);
    }

    const methodKey = methodName;
    if (isInitializer && usage.writes.size > 0)
    {
      meta.initializedIn.add(methodKey);
    }
    if (usage.writes.size > 0)
    {
      meta.writtenIn.add(methodKey);
    }
    if (usage.reads.size > 0)
    {
      meta.readIn.add(methodKey);
    }
    for (const pat of usage.consumes)
    {
      const bucket = meta.consumedBy.get(pat) ?? new Set();
      bucket.add(methodKey);
      meta.consumedBy.set(pat, bucket);
    }
  }
}

/**
 * @param {ClassEntry} entry
 * @param {string} classPath
 * @returns {Map<string, string>}
 */
function finalizeInstancePropTs(entry, classPath)
{
  /** @type {Map<string, string>} */
  const out = new Map();
  for (const [name, arr] of entry.instancePropertyBuckets)
  {
    const merged = mergeInstancePropRhsObservations(arr);
    out.set(name, refineInstanceBackingFieldTs(classPath, name, merged));
  }
  return out;
}

/**
 * Instance typings merge surface (prototype methods and/or inferred `this._*` fields).
 *
 * @param {ClassEntry} entry
 * @returns {boolean}
 */
function entryHasInstanceSurface(entry)
{
  return entry.instanceMethods.size > 0 || entry.instancePropertyBuckets.size > 0;
}

/**
 * VS Code / TS hovers collapse multi-line JSDoc into one paragraph unless we force breaks.
 *
 * @param {string} indent
 * @param {string} body Text after the leading ` * ` (empty = blank spacer line).
 * @returns {string}
 */
function instancePropDocStarLine(indent, body)
{
  if (body === '')
  {
    return `${indent} *<br/>\n`;
  }
  return `${indent} * ${body}<br/>\n`;
}

/**
 * @param {ClassEntry} entry
 * @param {string} indent
 * @param {string} classPath
 * @returns {string}
 */
function formatInstancePropsBlock(entry, indent, classPath)
{
  const merged = finalizeInstancePropTs(entry, classPath);
  if (merged.size === 0)
  {
    return '';
  }
  /** @type {string[]} */
  const lines = [];
  for (const propName of [...merged.keys()].sort())
  {
    const ts = merged.get(propName);
    const meta = entry.instancePropertyUsage.get(propName);

    /** @type {string[]} */
    const doc = [];
    doc.push(`${indent}/**\n`);
    doc.push(instancePropDocStarLine(indent, 'Inferred engine backing field.'));
    doc.push(instancePropDocStarLine(indent, ''));
    doc.push(instancePropDocStarLine(indent, `Type: \`${ts}\`.`));

    if (meta)
    {
      const init = [...meta.initializedIn].sort();
      const written = [...meta.writtenIn].sort();
      const read = [...meta.readIn].sort();

      /**
       * @param {string[]} methods
       * @returns {string}
       */
      function methodLinks(methods)
      {
        if (methods.length === 0)
        {
          return 'none';
        }
        return methods.map((m) =>
        {
          if (m === '<constructor>')
          {
            return 'constructor';
          }
          if (m === '<module-init>')
          {
            return 'module init';
          }
          return `{@link ${m}}`;
        }).join(', ');
      }

      doc.push(instancePropDocStarLine(indent, `Initialized in: ${methodLinks(init)}.`));
      doc.push(instancePropDocStarLine(indent, `Written in: ${methodLinks(written)}.`));
      doc.push(instancePropDocStarLine(indent, `Read in: ${methodLinks(read)}.`));

      const consumeKeys = [...meta.consumedBy.keys()].sort();
      if (consumeKeys.length > 0)
      {
        doc.push(instancePropDocStarLine(indent, ''));
        doc.push(instancePropDocStarLine(indent, 'Consumed by:'));
        for (const k of consumeKeys)
        {
          const methods = [...(meta.consumedBy.get(k) ?? new Set())].sort();
          doc.push(instancePropDocStarLine(indent, `- \`${k}\`: ${methodLinks(methods)}.`));
        }
      }
    }
    doc.push(`${indent} */\n`);
    lines.push(doc.join(''));
    lines.push(`${indent}${propName}: ${ts};\n`);
  }

  return lines.join('');
}

function literalToTsType(node)
{
  if (node.type === 'Literal')
  {
    if (node.value === null)
    {
      return 'null';
    }
    if (typeof node.value === 'string')
    {
      return JSON.stringify(node.value);
    }
    if (typeof node.value === 'number')
    {
      return String(node.value);
    }
    if (typeof node.value === 'boolean')
    {
      return node.value ? 'true' : 'false';
    }
    if (typeof node.value === 'bigint')
    {
      return `${node.value}n`;
    }
    return null;
  }
  if (node.type === 'UnaryExpression' && node.operator === 'void' && node.argument.type === 'Literal')
  {
    return 'undefined';
  }
  return null;
}

/**
 * @param {import('acorn').Program} ast
 * @param {(stmt: import('acorn').Statement) => void} visitor
 */
function walkStatementTree(ast, visitor)
{
  /**
   * @param {import('acorn').Statement | null | undefined} stmt
   */
  function recurse(stmt)
  {
    if (!stmt)
    {
      return;
    }
    visitor(stmt);
    switch (stmt.type)
    {
      case 'BlockStatement':
        for (const s of stmt.body)
        {
          recurse(s);
        }
        break;
      case 'IfStatement':
        recurse(stmt.consequent);
        recurse(stmt.alternate);
        break;
      case 'WhileStatement':
      case 'DoWhileStatement':
        recurse(stmt.body);
        break;
      case 'ForStatement':
        recurse(stmt.body);
        break;
      case 'ForInStatement':
      case 'ForOfStatement':
        recurse(stmt.body);
        break;
      case 'LabeledStatement':
        recurse(stmt.body);
        break;
      case 'SwitchStatement':
        for (const caseClause of stmt.cases)
        {
          for (const cons of caseClause.consequent)
          {
            recurse(cons);
          }
        }
        break;
      case 'TryStatement':
        recurse(stmt.block);
        if (stmt.handler)
        {
          recurse(stmt.handler.body);
        }
        if (stmt.finalizer)
        {
          recurse(stmt.finalizer);
        }
        break;
      default:
        break;
    }
  }

  for (const stmt of ast.body)
  {
    recurse(stmt);
  }
}

/**
 * @param {string} enginePath
 * @param {string} stem
 */
function extractFromFile(enginePath, stem)
{
  /** @type {Map<string, ClassEntry>} */
  const classes = new Map();
  /** @type {Map<string, Map<string, MethodSig>>} */
  const builtinProto = new Map();
  /** @type {Map<string, Map<string, MethodSig>>} */
  const builtinStatic = new Map();
  /** @type {Map<string, { ts: string, docSummary: string | null }>} */
  const globals = new Map();

  const engineSourceFile = path.basename(enginePath);

  /**
   * @param {string} pathStr
   * @returns {ClassEntry}
   */
  function ensureClass(pathStr)
  {
    let e = classes.get(pathStr);
    if (!e)
    {
      e = {
        instanceMethods: new Map(),
        staticMethods: new Map(),
        literalStatics: new Map(),
        instancePropertyBuckets: new Map(),
        instancePropertyUsage: new Map(),
        extendsBase: null,
      };
      classes.set(pathStr, e);
    }
    return e;
  }

  const src = fs.readFileSync(enginePath, 'utf8');
  const lineStarts = buildLineStarts(src);

  /** @type {import('acorn').Program} */
  const ast = acorn.parse(src,
    {
      ecmaVersion: 2022,
      sourceType: 'script',
      locations: true,
    });

  /**
   * @param {import('acorn').AssignmentExpression} node
   * @param {import('acorn').ExpressionStatement} parentStmt
   */
  function handleAssign(node, parentStmt)
  {
    if (node.operator !== '=')
    {
      return;
    }

    const loc = parentStmt.loc;
    if (!loc)
    {
      return;
    }

    const left = node.left;
    const right = node.right;

    // -------------------------------------------------------------------------
    // Prototype inheritance: Child.prototype = Object.create(Parent.prototype)
    // -------------------------------------------------------------------------
    if (
      left.type === 'MemberExpression'
      && !left.computed
      && left.property.type === 'Identifier'
      && left.property.name === 'prototype'
      && right.type === 'CallExpression'
      && right.callee.type === 'MemberExpression'
      && !right.callee.computed
      && right.callee.object.type === 'Identifier'
      && right.callee.object.name === 'Object'
      && right.callee.property.type === 'Identifier'
      && right.callee.property.name === 'create'
      && right.arguments.length >= 1
    )
    {
      const arg0 = right.arguments[0];
      if (
        arg0
        && arg0.type === 'MemberExpression'
        && !arg0.computed
        && arg0.property.type === 'Identifier'
        && arg0.property.name === 'prototype'
      )
      {
        const childPath = memberChain(left.object);
        const parentPath = memberChain(arg0.object);
        if (childPath !== null && parentPath !== null)
        {
          ensureClass(childPath).extendsBase = parentPath;
        }
      }
      return;
    }

    // -------------------------------------------------------------------------
    // Global identifiers: $gameParty = ...
    // -------------------------------------------------------------------------
    if (
      left.type === 'Identifier'
      && left.name.startsWith('$')
      && stem === 'managers'
    )
    {
      const jdText = extractLeadingJsdoc(src, lineStarts, loc);
      const jd = parseJsdocBlock(jdText);
      const rawTs = jd.typeTag ?? 'unknown';
      const ts = GLOBAL_VAR_TYPE_OVERRIDES[left.name] ?? rawTs;
      const docSummary = jd.summary && jd.summary.trim().length > 0
        ? jd.summary.trim()
        : null;
      globals.set(left.name, { ts, docSummary });
      return;
    }

    if (left.type !== 'MemberExpression' || left.computed)
    {
      return;
    }

    // Foo.prototype.bar = function
    if (
      left.object.type === 'MemberExpression'
      && !left.object.computed
      && left.object.property.type === 'Identifier'
      && left.object.property.name === 'prototype'
    )
    {
      const clsPath = memberChain(left.object.object);
      const prop = left.property.type === 'Identifier' ? left.property.name : null;
      if (clsPath === null || prop === null)
      {
        return;
      }

      const root = clsPath.split('.')[0];
      if (BUILTIN_RECEIVERS.has(root))
      {
        const bucket = builtinProto.get(root) ?? new Map();
        if (prop !== 'constructor')
        {
          if (right.type === 'FunctionExpression' || right.type === 'ArrowFunctionExpression')
          {
            bucket.set(prop, buildMethodSignature(right, src, lineStarts, loc,
              {
                role: 'builtinProto',
                assigningClassPath: root,
                builtinReceiver: root,
                methodName: prop,
                engineSourceFile,
              }));
          }
          else
          {
            bucket.set(prop, { paramsTs: '', returnTs: 'unknown', docBlock: fallbackMethodDoc(prop, 'unknown') });
          }
        }
        builtinProto.set(root, bucket);
        return;
      }

      const fn = ensureClass(clsPath);
      if (prop === 'constructor')
      {
        return;
      }

      if (right.type === 'FunctionExpression' || right.type === 'ArrowFunctionExpression')
      {
        const inferCtx = {
          role: 'instance',
          assigningClassPath: clsPath,
          methodName: prop,
          engineSourceFile,
        };
        fn.instanceMethods.set(prop, buildMethodSignature(right, src, lineStarts, loc, inferCtx));
        absorbInstanceProps(fn, collectThisUnderscorePropsFromFunction(right, inferCtx));
        absorbInstancePropUsage(
          fn,
          collectThisUnderscoreUsageFromFunction(right),
          `${clsPath}#${prop}`,
          prop === 'initialize',
        );
      }
      else
      {
        fn.instanceMethods.set(prop,
          {
            paramsTs: '',
            returnTs: 'unknown',
            docBlock: fallbackMethodDoc(prop, 'unknown'),
          });
      }
      return;
    }

    const chain = memberChain(left);
    if (chain === null)
    {
      return;
    }

    const segments = chain.split('.');
    const parentPath = segments.slice(0, -1).join('.');
    const last = segments[segments.length - 1];

    // -----------------------------------------------------------------------
    // Built-in static: Math.randomInt = function
    // -----------------------------------------------------------------------
    if (segments.length === 2 && BUILTIN_RECEIVERS.has(segments[0]))
    {
      const receiver = segments[0];
      if (right.type === 'FunctionExpression' || right.type === 'ArrowFunctionExpression')
      {
        const bucket = builtinStatic.get(receiver) ?? new Map();
        bucket.set(last, buildMethodSignature(right, src, lineStarts, loc,
          {
            role: 'static',
            assigningClassPath: receiver,
            methodName: last,
            engineSourceFile,
          }));
        builtinStatic.set(receiver, bucket);
      }
      return;
    }

    // -----------------------------------------------------------------------
    // Module-init slots on singleton namespaces: `DataManager._databaseFiles = [...]`.
    // Skip `Graphics._createCanvas = function …` — non-function RHS only (methods use path below).
    // -----------------------------------------------------------------------
    if (
      parentPath.length > 0
      && last.startsWith('_')
      && right.type !== 'FunctionExpression'
      && right.type !== 'ArrowFunctionExpression'
    )
    {
      const inferCtx = {
        role: 'instance',
        assigningClassPath: parentPath,
        methodName: '<module-init>',
        engineSourceFile,
      };
      let rhsTs;
      if (right.type === 'Literal' || right.type === 'UnaryExpression')
      {
        rhsTs = literalToTsType(/** @type {*} */ (right));
      }
      else
      {
        rhsTs = inferExprType(right, inferCtx);
      }
      absorbInstanceProps(ensureClass(parentPath), new Map([[last, rhsTs ?? 'unknown']]));
      absorbInstancePropUsage(
        ensureClass(parentPath),
        new Map([[last, { reads: new Set(), writes: new Set(['=']), consumes: new Set() }]]),
        '<module-init>',
        true,
      );
      return;
    }

    const literalTs = (right.type === 'Literal' || right.type === 'UnaryExpression')
      ? literalToTsType(/** @type {*} */ (right))
      : null;

    if (literalTs !== null && parentPath.length > 0)
    {
      ensureClass(parentPath).literalStatics.set(last, literalTs);
      return;
    }

    if (right.type === 'FunctionExpression' || right.type === 'ArrowFunctionExpression')
    {
      const isNestedCtor = /^[A-Z]/.test(last[0]) && segments.length >= 2;
      if (isNestedCtor)
      {
        const nestedEntry = ensureClass(chain);
        const ctorInferCtx = {
          role: 'instance',
          assigningClassPath: chain,
          methodName: '<constructor>',
          engineSourceFile,
        };
        absorbInstanceProps(nestedEntry, collectThisUnderscorePropsFromFunction(right, ctorInferCtx));
        return;
      }

      if (parentPath.length === 0)
      {
        return;
      }

      const staticOwner = ensureClass(parentPath);
      staticOwner.staticMethods.set(last,
        buildMethodSignature(right, src, lineStarts, loc,
          {
            role: 'static',
            assigningClassPath: parentPath,
            methodName: last,
            engineSourceFile,
          }));
      // Vanilla namespaces attach methods as `Manager.foo = function () { this._state = ... }`; `this` is
      // the constructor object — same underscore fields as prototype-backed classes, but assigned here.
      absorbInstanceProps(
        staticOwner,
        collectThisUnderscorePropsFromFunction(right,
          {
            role: 'instance',
            assigningClassPath: parentPath,
            methodName: last,
            engineSourceFile,
          }),
      );
      absorbInstancePropUsage(
        staticOwner,
        collectThisUnderscoreUsageFromFunction(right),
        `${parentPath}#${last}`,
        last === 'initMembers' || last === 'initialize',
      );
      return;
    }
  }

  /**
   * @param {import('acorn').Property} prop
   * @returns {string | null}
   */
  function definePropsKeyName(prop)
  {
    if (prop.type !== 'Property' || prop.computed)
    {
      return null;
    }
    if (prop.key.type === 'Identifier')
    {
      return prop.key.name;
    }
    if (prop.key.type === 'Literal' && typeof prop.key.value === 'string')
    {
      return prop.key.value;
    }
    return null;
  }

  /**
   * @param {import('acorn').ObjectExpression} descObj
   * @returns {import('acorn').FunctionExpression | import('acorn').ArrowFunctionExpression | null}
   */
  function findGetterInDescriptor(descObj)
  {
    if (descObj.type !== 'ObjectExpression')
    {
      return null;
    }
    for (const p of descObj.properties)
    {
      if (p.type !== 'Property' || p.computed)
      {
        continue;
      }
      const kn = p.key.type === 'Identifier' ? p.key.name : null;
      if (kn !== 'get')
      {
        continue;
      }
      if (p.value.type === 'FunctionExpression' || p.value.type === 'ArrowFunctionExpression')
      {
        return p.value;
      }
    }
    return null;
  }

  /**
   * @param {import('acorn').Expression} valueNode
   * @returns {string | null}
   */
  function returnTsFromTextManagerGetterFactory(valueNode)
  {
    if (valueNode.type !== 'CallExpression')
    {
      return null;
    }
    const c = valueNode.callee;
    if (c.type !== 'MemberExpression' || c.computed || c.property.type !== 'Identifier')
    {
      return null;
    }
    if (c.property.name !== 'getter')
    {
      return null;
    }
    const owner = memberChain(c.object);
    if (owner !== 'TextManager')
    {
      return null;
    }
    return 'string';
  }

  /**
   * @param {import('acorn').ObjectExpression} propsObj
   * @param {string} assigningClassPath
   * @param {'instance' | 'static'} kind
   * @param {import('acorn').SourceLocation | null | undefined} stmtLoc
   * @returns {void}
   */
  function absorbDefinePropertiesDescriptors(propsObj, assigningClassPath, kind, stmtLoc)
  {
    const entry = ensureClass(assigningClassPath);
    const loc = stmtLoc;
    for (const prop of propsObj.properties)
    {
      if (prop.type !== 'Property' || prop.computed)
      {
        continue;
      }
      const name = definePropsKeyName(prop);
      if (name === null)
      {
        continue;
      }
      const inferCtx = {
        role: kind === 'instance' ? 'instance' : 'static',
        assigningClassPath,
        methodName: name,
        engineSourceFile,
      };
      if (prop.value.type === 'ObjectExpression')
      {
        const getterFn = findGetterInDescriptor(prop.value);
        if (getterFn)
        {
          const sig = buildMethodSignature(getterFn, src, lineStarts, loc, inferCtx);
          const returnTs = refineDefinePropertyGetterReturn(getterFn, sig.returnTs);
          const payload = {
            paramsTs: '',
            returnTs,
            docBlock: sig.docBlock,
            isGetter: true,
          };
          if (kind === 'instance')
          {
            entry.instanceMethods.set(name, payload);
          }
          else
          {
            entry.staticMethods.set(name, payload);
          }
        }
        continue;
      }
      const factoryTs = returnTsFromTextManagerGetterFactory(prop.value);
      if (factoryTs !== null && kind === 'static')
      {
        entry.staticMethods.set(name,
          {
            paramsTs: '',
            returnTs: factoryTs,
            docBlock: fallbackDoc('Localized UI string from `$dataSystem.terms` (TextManager.getter factory).'),
            isGetter: true,
          });
      }
    }
  }

  /**
   * @param {import('acorn').ExpressionStatement} stmt
   * @returns {void}
   */
  function tryConsumeObjectDefineProperties(stmt)
  {
    if (stmt.type !== 'ExpressionStatement')
    {
      return;
    }
    const ex = stmt.expression;
    if (ex.type !== 'CallExpression' || ex.arguments.length < 2)
    {
      return;
    }
    const callee = ex.callee;
    if (callee.type !== 'MemberExpression' || callee.computed)
    {
      return;
    }
    if (callee.object.type !== 'Identifier' || callee.object.name !== 'Object')
    {
      return;
    }
    if (callee.property.type !== 'Identifier' || callee.property.name !== 'defineProperties')
    {
      return;
    }
    const target = ex.arguments[0];
    const propsObj = ex.arguments[1];
    if (!propsObj || propsObj.type !== 'ObjectExpression')
    {
      return;
    }
    if (
      target.type === 'MemberExpression'
      && !target.computed
      && target.property.type === 'Identifier'
      && target.property.name === 'prototype'
    )
    {
      const clsPath = memberChain(target.object);
      if (clsPath === null)
      {
        return;
      }
      absorbDefinePropertiesDescriptors(propsObj, clsPath, 'instance', stmt.loc);
      return;
    }
    if (target.type === 'Identifier')
    {
      absorbDefinePropertiesDescriptors(propsObj, target.name, 'static', stmt.loc);
    }
  }

  /**
   * @param {import('acorn').ExpressionStatement} stmt
   * @returns {void}
   */
  function tryConsumeObjectDefineProperty(stmt)
  {
    if (stmt.type !== 'ExpressionStatement')
    {
      return;
    }
    const ex = stmt.expression;
    if (ex.type !== 'CallExpression' || ex.arguments.length < 3)
    {
      return;
    }
    const callee = ex.callee;
    if (
      callee.type !== 'MemberExpression'
      || callee.computed
      || callee.object.type !== 'Identifier'
      || callee.object.name !== 'Object'
      || callee.property.type !== 'Identifier'
      || callee.property.name !== 'defineProperty'
    )
    {
      return;
    }
    const target = ex.arguments[0];
    const keyArg = ex.arguments[1];
    const desc = ex.arguments[2];
    if (!desc || desc.type !== 'ObjectExpression')
    {
      return;
    }
    const getterFn = findGetterInDescriptor(desc);
    if (!getterFn)
    {
      return;
    }
    let name = null;
    if (keyArg.type === 'Literal' && typeof keyArg.value === 'string')
    {
      name = keyArg.value;
    }
    else if (keyArg.type === 'Identifier')
    {
      name = keyArg.name;
    }
    if (name === null)
    {
      return;
    }
    let clsPath = null;
    let kind = 'instance';
    if (
      target.type === 'MemberExpression'
      && !target.computed
      && target.property.type === 'Identifier'
      && target.property.name === 'prototype'
    )
    {
      clsPath = memberChain(target.object);
      kind = 'instance';
    }
    else if (target.type === 'Identifier')
    {
      clsPath = target.name;
      kind = 'static';
    }
    if (clsPath === null)
    {
      return;
    }
    const inferCtx = {
      role: kind === 'instance' ? 'instance' : 'static',
      assigningClassPath: clsPath,
      methodName: name,
      engineSourceFile,
    };
    const sig = buildMethodSignature(getterFn, src, lineStarts, stmt.loc, inferCtx);
    const returnTs = refineDefinePropertyGetterReturn(getterFn, sig.returnTs);
    const entry = ensureClass(clsPath);
    const payload = {
      paramsTs: '',
      returnTs,
      docBlock: sig.docBlock,
      isGetter: true,
    };
    if (kind === 'instance')
    {
      entry.instanceMethods.set(name, payload);
    }
    else
    {
      entry.staticMethods.set(name, payload);
    }
  }

  walkStatementTree(ast, (stmt) =>
  {
    if (stmt.type === 'ExpressionStatement')
    {
      tryConsumeObjectDefineProperty(stmt);
      tryConsumeObjectDefineProperties(stmt);
    }
    if (stmt.type === 'FunctionDeclaration' && stmt.id)
    {
      const idName = stmt.id.name;
      ensureClass(idName);
      if (/^[A-Z]/.test(idName))
      {
        const ctorInferCtx = {
          role: 'instance',
          assigningClassPath: idName,
          methodName: '<constructor>',
          engineSourceFile,
        };
        absorbInstanceProps(
          ensureClass(idName),
          collectThisUnderscorePropsFromFunction(stmt, ctorInferCtx),
        );
        absorbInstancePropUsage(
          ensureClass(idName),
          collectThisUnderscoreUsageFromFunction(stmt),
          '<constructor>',
          true,
        );
      }
    }

    if (stmt.type === 'ExpressionStatement' && stmt.expression.type === 'AssignmentExpression')
    {
      handleAssign(stmt.expression, stmt);
    }
  });

  return {
    stem,
    sourceLabel: path.relative(REPO_ROOT, enginePath).replace(/\\/g, '/'),
    classes,
    builtinProto,
    builtinStatic,
    globals,
  };
}

/**
 * @param {string[]} segments
 * @returns {string}
 */
function pathForClassDecl(segments)
{
  if (segments.length === 1)
  {
    return `${segments[0]}.d.ts`;
  }
  return path.join(...segments.slice(0, -1), `${segments[segments.length - 1]}.d.ts`);
}

/**
 * Relative fragment path for a logical class path (e.g. `Game_Actor` → `objects/Game_Actor.d.ts`).
 *
 * @param {string} stem
 * @param {string} classPathStr
 * @returns {string}
 */
function fragmentPathForClass(stem, classPathStr)
{
  const segments = classPathStr.split('.');
  return path.join(stem, pathForClassDecl(segments)).replace(/\\/g, '/');
}

/**
 * Topological order so each `extends` parent fragment precedes the child (TS needs the base type in scope).
 *
 * @param {string[]} refs
 * @param {Map<string, string>} extendsGraph child class path → parent class path
 * @param {Map<string, string>} classStem class path → stem dir
 * @returns {string[]}
 */
function topoSortRefsByExtends(refs, extendsGraph, classStem)
{
  const refSet = new Set(refs);
  /** @type {Map<string, Set<string>>} */
  const adj = new Map();
  /** @type {Map<string, number>} */
  const indeg = new Map();
  for (const r of refs)
  {
    indeg.set(r, 0);
    adj.set(r, new Set());
  }
  for (const [child, parent] of extendsGraph)
  {
    const cs = classStem.get(child);
    const ps = classStem.get(parent);
    if (cs === undefined || ps === undefined)
    {
      continue;
    }
    const childFile = fragmentPathForClass(cs, child);
    const parentFile = fragmentPathForClass(ps, parent);
    if (!refSet.has(childFile) || !refSet.has(parentFile) || childFile === parentFile)
    {
      continue;
    }
    const outs = adj.get(parentFile);
    if (outs && !outs.has(childFile))
    {
      outs.add(childFile);
      indeg.set(childFile, (indeg.get(childFile) ?? 0) + 1);
    }
  }
  /** @type {string[]} */
  const q = [...refs].filter((r) => (indeg.get(r) ?? 0) === 0).sort();
  /** @type {string[]} */
  const out = [];
  /** @type {Set<string>} */
  const seen = new Set();
  while (q.length > 0)
  {
    const n = /** @type {string} */ (q.shift());
    if (seen.has(n))
    {
      continue;
    }
    seen.add(n);
    out.push(n);
    const nexts = [...(adj.get(n) ?? new Set())].sort();
    for (const v of nexts)
    {
      indeg.set(v, (indeg.get(v) ?? 1) - 1);
      if (indeg.get(v) === 0)
      {
        q.push(v);
        q.sort();
      }
    }
  }
  if (out.length < refs.length)
  {
    for (const r of [...refs].sort())
    {
      if (!seen.has(r))
      {
        out.push(r);
      }
    }
  }
  return out;
}

/**
 * @param {MethodSig} sig
 * @param {string} indent
 * @returns {string}
 */
function formatMethod(name, sig, indent = '  ')
{
  /** @type {string} */
  let docPart = '';
  if (sig.docBlock && sig.docBlock.length > 0)
  {
    const innerLines = sig.docBlock.split('\n').map(l => `${indent}${l}`).join('\n');
    docPart = `${indent}/**\n${innerLines}\n${indent} */\n`;
  }
  if (sig.isGetter === true)
  {
    return `${docPart}${indent}get ${name}(): ${sig.returnTs};`;
  }
  if (!sig.paramsTs || sig.paramsTs.length === 0)
  {
    return `${docPart}${indent}${name}(): ${sig.returnTs};`;
  }
  return `${docPart}${indent}${name}(${sig.paramsTs}): ${sig.returnTs};`;
}

/**
 * Static functions inside `declare namespace Foo { ... }` (MZ singleton managers).
 *
 * @param {string} name
 * @param {MethodSig} sig
 * @param {string} indent
 * @returns {string}
 */
function formatNamespaceStaticFn(name, sig, indent = '  ')
{
  /** @type {string} */
  let docPart = '';
  if (sig.docBlock && sig.docBlock.length > 0)
  {
    const innerLines = sig.docBlock.split('\n').map(l => `${indent}${l}`).join('\n');
    docPart = `${indent}/**\n${innerLines}\n${indent} */\n`;
  }
  if (sig.isGetter === true)
  {
    return `${docPart}${indent}get ${name}(): ${sig.returnTs};`;
  }
  const paramsInner = sig.paramsTs && sig.paramsTs.length > 0 ? sig.paramsTs : '';
  return `${docPart}${indent}function ${name}(${paramsInner}): ${sig.returnTs};`;
}

/**
 * MZ defines gameplay classes as `function Name(){...}` + prototype. Ambient `declare class Name`
 * duplicates that symbol when `project/js/rmmz_*.js` is on the TS program (`allowJs`).
 * Emit an `interface Name` (instance) plus optional `declare namespace Name` (statics) so types
 * merge with the JS constructor instead of fighting it.
 *
 * @param {string} sourceLabel
 * @param {string} pathStr
 * @param {ClassEntry} entry
 * @returns {string}
 */
function emitMergeableEngineClass(sourceLabel, pathStr, entry)
{
  const hdr = [
    '/**',
    ` * Generated from ${sourceLabel}`,
    ` * Class: ${pathStr}`,
    ' * Instance/static typings merge with the engine constructor + prototype in project/js.',
    ' * Do not hand-edit; regenerate with bun run defs:generate.',
    ' * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.',
    ' */',
    '',
  ].join('\n');

  const segments = pathStr.split('.');
  const name = segments[segments.length - 1];
  const hasInstance = entryHasInstanceSurface(entry);
  const hasStatic = entry.staticMethods.size > 0 || entry.literalStatics.size > 0;
  const parts = [];
  const extendsClause = entry.extendsBase ? ` extends ${entry.extendsBase}` : '';

  if (hasInstance)
  {
    parts.push(`interface ${name}${extendsClause}\n{\n`);
    parts.push(formatInstancePropsBlock(entry, '  ', pathStr));
    for (const m of [...entry.instanceMethods.keys()].sort())
    {
      parts.push(`${formatMethod(m, entry.instanceMethods.get(m), '  ')}\n`);
    }
    parts.push('}\n');
  }

  if (hasStatic)
  {
    // Static-only engine singletons (`function X(){throw ...}`, methods on `X`) — keep the never-ctor even
    // when `interface X` exists purely for underscored fields inferred from those static bodies.
    if (entry.instanceMethods.size === 0)
    {
      parts.push(`declare function ${name}(): never;\n`);
    }
    parts.push(`declare namespace ${name}\n{\n`);
    for (const s of [...entry.staticMethods.keys()].sort())
    {
      const sig = entry.staticMethods.get(s);
      parts.push(`${formatNamespaceStaticFn(s, sig, '  ')}\n`);
    }
    for (const c of [...entry.literalStatics.keys()].sort())
    {
      parts.push(
        `  /**\n`
        + `   * Engine static constant.\n`
        + `   */\n`
        + `  const ${c}: ${entry.literalStatics.get(c)};\n`,
      );
    }
    parts.push('}\n');
  }

  if (!hasInstance && !hasStatic)
  {
    parts.push(`interface ${name}\n{\n}\n`);
  }

  return hdr + parts.join('');
}

/**
 * @param {ExtractResult} bundle
 * @returns {string[]}
 */
/**
 * @param {ExtractResult} bundle
 * @param {Map<string, string>} classStemOut class path (e.g. `Game_Actor`) → stem (`objects`)
 * @param {Map<string, string>} extendsGraphOut child class path → parent class path from `Object.create`
 */
function emitBundle(bundle, classStemOut, extendsGraphOut)
{
  const {
    stem,
    sourceLabel,
    classes,
    builtinProto,
    builtinStatic,
    globals,
  } = bundle;

  const written = [];
  const stemDir = path.join(OUT_ROOT, stem);

  /**
   * @param {string} relPath
   * @param {string} body
   */
  function write(relPath, body)
  {
    const full = path.join(stemDir, relPath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, body, 'utf8');
    written.push(path.join(stem, relPath).replace(/\\/g, '/'));
  }

  // Built-ins augmentations (single file per stem if any)
  const builtinParts = [];
  for (const recv of [...builtinProto.keys()].sort())
  {
    const protoM = builtinProto.get(recv);
    if (!protoM || protoM.size === 0)
    {
      continue;
    }
    const lines = [`  interface ${recv}\n  {`];
    for (const name of [...protoM.keys()].sort())
    {
      const sig = protoM.get(name);
      lines.push(formatMethod(name, sig));
    }
    lines.push('  }');
    builtinParts.push(lines.join('\n'));
  }
  for (const recv of [...builtinStatic.keys()].sort())
  {
    const statM = builtinStatic.get(recv);
    if (!statM || statM.size === 0)
    {
      continue;
    }
    const lines = [`  interface ${recv}\n  {`];
    for (const name of [...statM.keys()].sort())
    {
      const sig = statM.get(name);
      lines.push(formatMethod(name, sig));
    }
    lines.push('  }');
    builtinParts.push(lines.join('\n'));
  }

  if (builtinParts.length > 0)
  {
    const hdr = [
      '/**',
      ` * Generated from ${sourceLabel}`,
      ' * Built-in prototype/static augmentations (JsExtensions, Math.randomInt, …).',
      ' */',
      '',
      'declare global',
      '{',
      '',
    ].join('\n');
    const foot = '\n}\n\nexport {};\n';
    write('_builtins-augment.d.ts', hdr + builtinParts.join('\n\n') + foot);
  }

  if (globals.size > 0)
  {
    const lines = [
      `/**\n * Generated from ${sourceLabel}\n * Engine globals assigned in managers.\n */\n`,
    ];
    for (const name of [...globals.keys()].sort())
    {
      const entry = globals.get(name);
      if (entry.docSummary && entry.docSummary.length > 0)
      {
        const doc = entry.docSummary.replace(/\*\//g, '*\\/');
        lines.push(`/**\n * ${doc}\n */\n`);
      }
      lines.push(`declare var ${name}: ${entry.ts};\n`);
    }
    // Script-mode ambient file so engine `$game*` / `$data*` vars stay global (same as engine class defs).
    lines.push('\n');
    write('_globals.d.ts', lines.join(''));
  }

  /** @type {Map<string, ClassEntry>} */
  const nestedNsClasses = new Map();
  /** @type {Map<string, ClassEntry>} */
  const topOrStaticOnly = new Map();

  for (const [pathStr, entry] of classes)
  {
    const segments = pathStr.split('.');
    if (segments.length >= 2 && entryHasInstanceSurface(entry))
    {
      nestedNsClasses.set(pathStr, entry);
    }
    else
    {
      topOrStaticOnly.set(pathStr, entry);
    }
  }

  for (const [pathStr, entry] of topOrStaticOnly)
  {
    const segments = pathStr.split('.');
    if (segments.length >= 2)
    {
      continue;
    }

    write(pathForClassDecl(segments), emitMergeableEngineClass(sourceLabel, pathStr, entry));
  }

  for (const [pathStr, entry] of nestedNsClasses)
  {
    const segments = pathStr.split('.');
    const parentNs = segments.slice(0, -1).join('.');
    const shortName = segments[segments.length - 1];
    const hdr = `/**\n * Generated from ${sourceLabel}\n * Class: ${pathStr}\n */\n\n`;
    const nestedExtends = entry.extendsBase ? ` extends ${entry.extendsBase}` : '';

    const hasStatic = entry.staticMethods.size > 0 || entry.literalStatics.size > 0;
    const lines = [
      hdr,
      `declare namespace ${parentNs}\n{\n`,
      `  export interface ${shortName}${nestedExtends}\n  {\n`,
    ];
    lines.push(formatInstancePropsBlock(entry, '    ', pathStr));
    for (const m of [...entry.instanceMethods.keys()].sort())
    {
      lines.push(`${formatMethod(m, entry.instanceMethods.get(m), '    ')}\n`);
    }
    lines.push('  }\n');

    if (hasStatic)
    {
      lines.push(`\n  export namespace ${shortName}\n  {\n`);
      for (const s of [...entry.staticMethods.keys()].sort())
      {
        const sig = entry.staticMethods.get(s);
        lines.push(`${formatNamespaceStaticFn(s, sig, '    ')}\n`);
      }
      for (const c of [...entry.literalStatics.keys()].sort())
      {
        lines.push(
          `    /**\n`
          + `     * Engine static constant.\n`
          + `     */\n`
          + `    const ${c}: ${entry.literalStatics.get(c)};\n`,
        );
      }
      lines.push('  }\n');
    }

    lines.push('}\n');
    write(pathForClassDecl(segments), lines.join(''));
  }

  // Namespaces like Graphics.FPSCounter do not emit parent static-only here if parent emitted above.

  for (const [pathStr, entry] of classes)
  {
    classStemOut.set(pathStr, stem);
    if (entry.extendsBase !== null && entry.extendsBase.length > 0)
    {
      extendsGraphOut.set(pathStr, entry.extendsBase);
    }
  }

  return written;
}

/**
 * @typedef {ReturnType<typeof extractFromFile>} ExtractResult
 */

function main()
{
  const doClean = process.argv.includes('--clean');

  if (doClean && fs.existsSync(OUT_ROOT))
  {
    fs.rmSync(OUT_ROOT, { recursive: true, force: true });
  }
  fs.mkdirSync(OUT_ROOT, { recursive: true });

  const rpgModelsDest = path.join(OUT_ROOT, '_rpg-data-models.d.ts');
  if (!fs.existsSync(RPG_DATA_MODELS_TEMPLATE))
  {
    throw new Error(`Missing RPG data template: ${RPG_DATA_MODELS_TEMPLATE}`);
  }
  fs.copyFileSync(RPG_DATA_MODELS_TEMPLATE, rpgModelsDest);

  /** @type {string[]} */
  const allRefs = [];
  /** @type {Map<string, string>} */
  const classStemMeta = new Map();
  /** @type {Map<string, string>} */
  const extendsGraph = new Map();

  for (const { file, stem } of ENGINE_SOURCE_FILES)
  {
    const enginePath = path.join(ENGINE_JS_DIR, file);
    if (!fs.existsSync(enginePath))
    {
      throw new Error(`Missing engine file: ${enginePath}`);
    }
    const bundle = extractFromFile(enginePath, stem);
    const written = emitBundle(bundle, classStemMeta, extendsGraph);
    allRefs.push(...written.sort());
  }

  const uniq = topoSortRefsByExtends([...new Set(allRefs)], extendsGraph, classStemMeta);
  const indexLines = [
    '/**',
    ' * RPG Maker MZ engine declarations generated from project/js/rmmz_*.js',
    ' * Regenerate: bun run defs:generate',
    ' */',
    '',
    '/// <reference path="./_rpg-data-models.d.ts" />',
    '',
  ];
  for (const ref of uniq)
  {
    indexLines.push(`/// <reference path="./${ref}" />`);
  }
  indexLines.push('');
  indexLines.push('export {};');
  fs.writeFileSync(path.join(OUT_ROOT, 'index.d.ts'), indexLines.join('\n'), 'utf8');

  const relOut = path.relative(REPO_ROOT, OUT_ROOT);
  console.log(
    `defs:generate wrote _rpg-data-models.d.ts, ${uniq.length} fragment(s), index.d.ts → ${relOut}`,
  );
}

main();