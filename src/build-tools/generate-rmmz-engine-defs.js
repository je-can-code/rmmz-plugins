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
 * @param {string} summary The summary driving this step.
 * @returns {string}
 */
function fallbackDoc(summary)
{
  return ` * ${summary}`;
}

/**
 * @param {string} memberName The member name driving this step.
 * @param {string} returnTs The return ts driving this step.
 * @returns {string}
 */
function fallbackMethodDoc(memberName, returnTs)
{
  const isGetLike = returnTs && returnTs !== 'void' && returnTs !== 'never';
  const verb = isGetLike ? 'Gets' : 'Performs';
  // hand back fallbackDoc(`${verb} ${memberName}.`) to the caller.
  return fallbackDoc(`${verb} ${memberName}.`);
}

/**
 * `Object.defineProperties` often appears before `prototype.param` in source order, so return inference
 * can be `unknown`. Recover MZ-shaped getters from the getter body alone.
 *
 * @param {import('acorn').FunctionExpression | import('acorn').ArrowFunctionExpression} getterFn The getter fn driving this step.
 * @param {string} preliminaryTs The preliminary ts driving this step.
 * @returns {string}
 */
function refineDefinePropertyGetterReturn(getterFn, preliminaryTs)
{
  if (preliminaryTs !== 'unknown')
  {
    return preliminaryTs;
  }
  const body = getterFn.body;
  // when not body  or  body.type  differs from  'BlockStatement', take this branch.
  if (!body || body.type !== 'BlockStatement')
  {
    return preliminaryTs;
  }
  /** @type {import('acorn').ReturnStatement[]} */
  // capture rets for downstream policy in this routine.
  const rets = [];
  for (const st of body.body)
  {
    if (st.type === 'ReturnStatement')
    {
      // Append the row to the working collection.
      rets.push(st);
    }
  }
  if (rets.length !== 1)
  {
    return preliminaryTs;
  }
  // capture arg for downstream policy in this routine.
  const arg = rets[0].argument;
  if (!arg)
  {
    return preliminaryTs;
  }
  // when arg.type  equals  'MemberExpression'  and  not arg.computed, take this branch.
  if (arg.type === 'MemberExpression' && !arg.computed)
  {
    if (
      arg.object.type === 'ThisExpression'
      // policy step inside refine define property getter return.
      && arg.property.type === 'Identifier'
    )
    {
      const field = arg.property.name;
      // when field  equals  '_hp'  or  field  equals  '_mp'  or  field  equals  '_tp', take this branch.
      if (field === '_hp' || field === '_mp' || field === '_tp')
      {
        return 'number';
      }
    }
    const ch = memberChain(arg);
    // when ch  equals  '$dataSystem.currencyUnit', take this branch.
    if (ch === '$dataSystem.currencyUnit')
    {
      return 'string';
    }
  }
  if (arg.type !== 'CallExpression' || arg.callee.type !== 'MemberExpression' || arg.callee.computed)
  {
    // hand back preliminary ts to the caller.
    return preliminaryTs;
  }
  if (arg.callee.object.type !== 'ThisExpression' || arg.callee.property.type !== 'Identifier')
  {
    return preliminaryTs;
  }
  // capture m for downstream policy in this routine.
  const m = arg.callee.property.name;
  if (
    m === 'param'
    // policy step inside refine define property getter return.
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
 * @param {import('acorn').MemberExpression | import('acorn').Expression} node The node driving this step.
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
    // when node.property.type  differs from  'Identifier', take this branch.
    if (node.property.type !== 'Identifier')
    {
      return null;
    }
    const base = memberChain(node.object);
    // when base  equals  null, take this branch.
    if (base === null)
    {
      return null;
    }
    return `${base}.${node.property.name}`;
  }
  return null;
}

/**
 * @param {import('acorn').Literal | import('acorn').UnaryExpression | import('acorn').TemplateLiteral} node The node driving this step.
 * @returns {string|null}
 */
/**
 * @param {ClassEntry} entry The entry driving this step.
 * @param {Map<string, string>} propMap The prop map driving this step.
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
    // capture bucket for downstream policy in this routine.
    const bucket = entry.instancePropertyBuckets.get(name) ?? [];
    bucket.push(ts);
    entry.instancePropertyBuckets.set(name, bucket);
  }
}

/**
 * @param {ClassEntry} entry The entry driving this step.
 * @param {Map<string, { reads: Set<string>, writes: Set<string>, consumes: Set<string> }>} usageMap
 * @param {string} methodName The method name driving this step.
 * @param {boolean} isInitializer The is initializer driving this step.
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
    // capture meta for downstream policy in this routine.
    let meta = entry.instancePropertyUsage.get(prop);
    if (!meta)
    {
      meta = {
        // policy step inside absorb instance prop usage.
        initializedIn: new Set(),
        writtenIn: new Set(),
        readIn: new Set(),
        // policy step inside absorb instance prop usage.
        consumedBy: new Map(),
      };
      entry.instancePropertyUsage.set(prop, meta);
    }

    // capture method key for downstream policy in this routine.
    const methodKey = methodName;
    if (isInitializer && usage.writes.size > 0)
    {
      meta.initializedIn.add(methodKey);
    }
    // when usage.writes.size > 0, take this branch.
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
 * @param {ClassEntry} entry The entry driving this step.
 * @param {string} classPath The class path driving this step.
 * @returns {Map<string, string>}
 */
function finalizeInstancePropTs(entry, classPath)
{
  /** @type {Map<string, string>} */
  const out = new Map();
  for (const [name, arr] of entry.instancePropertyBuckets)
  {
    // capture merged for downstream policy in this routine.
    const merged = mergeInstancePropRhsObservations(arr);
    out.set(name, refineInstanceBackingFieldTs(classPath, name, merged));
  }
  return out;
}

/**
 * Instance typings merge surface (prototype methods and/or inferred `this._*` fields).
 *
 * @param {ClassEntry} entry The entry driving this step.
 * @returns {boolean}
 */
function entryHasInstanceSurface(entry)
{
  return entry.instanceMethods.size > 0 || entry.instancePropertyBuckets.size > 0;
}

/**
 * VS Code / TS hovers collapse multi-line JSDoc into one paragraph unless we force breaks.
 *
 * @param {string} indent The indent driving this step.
 * @param {string} body Text after the leading ` * ` (empty = blank spacer line).
 * @returns {string}
 */
function instancePropDocStarLine(indent, body)
{
  if (body === '')
  {
    return `${indent} *<br/>\n`;
  }
  // hand back `${indent} * ${body}<br/>\n` to the caller.
  return `${indent} * ${body}<br/>\n`;
}

/**
 * @param {ClassEntry} entry The entry driving this step.
 * @param {string} indent The indent driving this step.
 * @param {string} classPath The class path driving this step.
 * @returns {string}
 */
function formatInstancePropsBlock(entry, indent, classPath)
{
  const merged = finalizeInstancePropTs(entry, classPath);
  if (merged.size === 0)
  {
    return '';
  }
  // policy step inside format instance props block.
  /** @type {string[]} */
  const lines = [];
  for (const propName of [...merged.keys()].sort())
  {
    // capture ts for downstream policy in this routine.
    const ts = merged.get(propName);
    const meta = entry.instancePropertyUsage.get(propName);

    // policy step inside format instance props block.
    /** @type {string[]} */
    const doc = [];
    doc.push(`${indent}/**\n`);
    // Append the row to the working collection.
    doc.push(instancePropDocStarLine(indent, 'Inferred engine backing field.'));
    doc.push(instancePropDocStarLine(indent, ''));
    doc.push(instancePropDocStarLine(indent, `Type: \`${ts}\`.`));

    // when meta, take this branch.
    if (meta)
    {
      const init = [...meta.initializedIn].sort();
      const written = [...meta.writtenIn].sort();
      // capture read for downstream policy in this routine.
      const read = [...meta.readIn].sort();

      // policy step inside format instance props block.
      /**
       * @param {string[]} methods The methods driving this step.
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
          // when m  equals  '<constructor>', take this branch.
          if (m === '<constructor>')
          {
            return 'constructor';
          }
          if (m === '<module-init>')
          {
            // hand back 'module init' to the caller.
            return 'module init';
          }
          return `{@link ${m}}`;
        }).join(', ');
      }

      // Append the row to the working collection.
      doc.push(instancePropDocStarLine(indent, `Initialized in: ${methodLinks(init)}.`));
      doc.push(instancePropDocStarLine(indent, `Written in: ${methodLinks(written)}.`));
      doc.push(instancePropDocStarLine(indent, `Read in: ${methodLinks(read)}.`));

      // capture consume keys for downstream policy in this routine.
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

  // hand back lines.join('') to the caller.
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
    // when typeof node.value  equals  'string', take this branch.
    if (typeof node.value === 'string')
    {
      return JSON.stringify(node.value);
    }
    if (typeof node.value === 'number')
    {
      // hand back String(node.value) to the caller.
      return String(node.value);
    }
    if (typeof node.value === 'boolean')
    {
      return node.value ? 'true' : 'false';
    }
    // when typeof node.value  equals  'bigint', take this branch.
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
 * @param {import('acorn').Program} ast The ast driving this step.
 * @param {(stmt: import('acorn').Statement) => void} visitor The visitor driving this step.
 */
function walkStatementTree(ast, visitor)
{
  /**
   * @param {import('acorn').Statement | null | undefined} stmt The stmt driving this step.
   */
  function recurse(stmt)
  {
    if (!stmt)
    {
      return;
    }
    visitor(stmt);
    // dispatch on the discriminant for the next policy branch.
    switch (stmt.type)
    {
      case 'BlockStatement':
        for (const s of stmt.body)
        {
          // policy step inside recurse.
          recurse(s);
        }
        break;
      case 'IfStatement':
        // policy step inside recurse.
        recurse(stmt.consequent);
        recurse(stmt.alternate);
        break;
      // handle this switch arm for the current discriminant.
      case 'WhileStatement':
      case 'DoWhileStatement':
        recurse(stmt.body);
        // policy step inside recurse.
        break;
      case 'ForStatement':
        recurse(stmt.body);
        // policy step inside recurse.
        break;
      case 'ForInStatement':
      case 'ForOfStatement':
        // policy step inside recurse.
        recurse(stmt.body);
        break;
      case 'LabeledStatement':
        // policy step inside recurse.
        recurse(stmt.body);
        break;
      case 'SwitchStatement':
        // walk each entry in the iterable for this routine.
        for (const caseClause of stmt.cases)
        {
          for (const cons of caseClause.consequent)
          {
            recurse(cons);
          }
        }
        // policy step inside recurse.
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

  // walk each entry in the iterable for this routine.
  for (const stmt of ast.body)
  {
    recurse(stmt);
  }
}

/**
 * @param {string} enginePath The engine path driving this step.
 * @param {string} stem The stem driving this step.
 */
function extractFromFile(enginePath, stem)
{
  /** @type {Map<string, ClassEntry>} */
  const classes = new Map();
  /** @type {Map<string, Map<string, MethodSig>>} */
  // construct builtin proto for the next step in this routine.
  const builtinProto = new Map();
  /** @type {Map<string, Map<string, MethodSig>>} */
  const builtinStatic = new Map();
  // policy step inside extract from file.
  /** @type {Map<string, { ts: string, docSummary: string | null }>} */
  const globals = new Map();

  // capture engine source file for downstream policy in this routine.
  const engineSourceFile = path.basename(enginePath);

  // policy step inside extract from file.
  /**
   * @param {string} pathStr The path str driving this step.
   * @returns {ClassEntry}
   // policy step inside extract from file.
   */
  function ensureClass(pathStr)
  {
    let e = classes.get(pathStr);
    // when not e, take this branch.
    if (!e)
    {
      e = {
        // policy step inside ensure class.
        instanceMethods: new Map(),
        staticMethods: new Map(),
        literalStatics: new Map(),
        // policy step inside ensure class.
        instancePropertyBuckets: new Map(),
        instancePropertyUsage: new Map(),
        extendsBase: null,
      // policy step inside ensure class.
      };
      classes.set(pathStr, e);
    }
    return e;
  }

  // capture src for downstream policy in this routine.
  const src = fs.readFileSync(enginePath, 'utf8');
  const lineStarts = buildLineStarts(src);

  // policy step inside extract from file.
  /** @type {import('acorn').Program} */
  const ast = acorn.parse(src,
    {
      ecmaVersion: 2022,
      // policy step inside extract from file.
      sourceType: 'script',
      locations: true,
    });

  // policy step inside extract from file.
  /**
   * @param {import('acorn').AssignmentExpression} node The node driving this step.
   * @param {import('acorn').ExpressionStatement} parentStmt The parent stmt driving this step.
   // policy step inside extract from file.
   */
  function handleAssign(node, parentStmt)
  {
    if (node.operator !== '=')
    {
      // exit early without a payload.
      return;
    }

    // capture loc for downstream policy in this routine.
    const loc = parentStmt.loc;
    if (!loc)
    {
      return;
    }

    // capture left for downstream policy in this routine.
    const left = node.left;
    const right = node.right;

    // -------------------------------------------------------------------------
    // Prototype inheritance: Child.prototype = Object.create(Parent.prototype)
    // -------------------------------------------------------------------------
    if (
      left.type === 'MemberExpression'
      && !left.computed
      // policy step inside handle assign.
      && left.property.type === 'Identifier'
      && left.property.name === 'prototype'
      && right.type === 'CallExpression'
      // policy step inside handle assign.
      && right.callee.type === 'MemberExpression'
      && !right.callee.computed
      && right.callee.object.type === 'Identifier'
      // policy step inside handle assign.
      && right.callee.object.name === 'Object'
      && right.callee.property.type === 'Identifier'
      && right.callee.property.name === 'create'
      // policy step inside handle assign.
      && right.arguments.length >= 1
    )
    {
      const arg0 = right.arguments[0];
      // when , take this branch.
      if (
        arg0
        && arg0.type === 'MemberExpression'
        // policy step inside handle assign.
        && !arg0.computed
        && arg0.property.type === 'Identifier'
        && arg0.property.name === 'prototype'
      // policy step inside handle assign.
      )
      {
        const childPath = memberChain(left.object);
        const parentPath = memberChain(arg0.object);
        // when childPath  differs from  null  and  parentPath  differs from  null, take this branch.
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
      // policy step inside handle assign.
      && stem === 'managers'
    )
    {
      const jdText = extractLeadingJsdoc(src, lineStarts, loc);
      // capture jd for downstream policy in this routine.
      const jd = parseJsdocBlock(jdText);
      const rawTs = jd.typeTag ?? 'unknown';
      const ts = GLOBAL_VAR_TYPE_OVERRIDES[left.name] ?? rawTs;
      // capture doc summary for downstream policy in this routine.
      const docSummary = jd.summary && jd.summary.trim().length > 0
        ? jd.summary.trim()
        : null;
      // Register the value on the alias map for runtime lookup.
      globals.set(left.name, { ts, docSummary });
      return;
    }

    // when left.type  differs from  'MemberExpression'  or  left.computed, take this branch.
    if (left.type !== 'MemberExpression' || left.computed)
    {
      return;
    }

    // Foo.prototype.bar = function
    if (
      left.object.type === 'MemberExpression'
      && !left.object.computed
      // policy step inside handle assign.
      && left.object.property.type === 'Identifier'
      && left.object.property.name === 'prototype'
    )
    {
      // capture cls path for downstream policy in this routine.
      const clsPath = memberChain(left.object.object);
      const prop = left.property.type === 'Identifier' ? left.property.name : null;
      if (clsPath === null || prop === null)
      {
        // exit early without a payload.
        return;
      }

      // capture root for downstream policy in this routine.
      const root = clsPath.split('.')[0];
      if (BUILTIN_RECEIVERS.has(root))
      {
        const bucket = builtinProto.get(root) ?? new Map();
        // when prop  differs from  'constructor', take this branch.
        if (prop !== 'constructor')
        {
          if (right.type === 'FunctionExpression' || right.type === 'ArrowFunctionExpression')
          {
            bucket.set(prop, buildMethodSignature(right, src, lineStarts, loc,
              {
                // policy step inside handle assign.
                role: 'builtinProto',
                assigningClassPath: root,
                builtinReceiver: root,
                // policy step inside handle assign.
                methodName: prop,
                engineSourceFile,
              }));
          }
          // otherwise fall back to the alternate path.
          else
          {
            bucket.set(prop, { paramsTs: '', returnTs: 'unknown', docBlock: fallbackMethodDoc(prop, 'unknown') });
          }
        }
        builtinProto.set(root, bucket);
        // exit early without a payload.
        return;
      }

      // capture fn for downstream policy in this routine.
      const fn = ensureClass(clsPath);
      if (prop === 'constructor')
      {
        return;
      }

      // when right.type  equals  'FunctionExpression'  or  right.type  equals  'Ar..., take this branch.
      if (right.type === 'FunctionExpression' || right.type === 'ArrowFunctionExpression')
      {
        const inferCtx = {
          role: 'instance',
          // policy step inside extract from file.
          assigningClassPath: clsPath,
          methodName: prop,
          engineSourceFile,
        // policy step inside extract from file.
        };
        fn.instanceMethods.set(prop, buildMethodSignature(right, src, lineStarts, loc, inferCtx));
        absorbInstanceProps(fn, collectThisUnderscorePropsFromFunction(right, inferCtx));
        // policy step inside extract from file.
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

    // capture chain for downstream policy in this routine.
    const chain = memberChain(left);
    if (chain === null)
    {
      return;
    }

    // capture segments for downstream policy in this routine.
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

    // capture literal ts for downstream policy in this routine.
    const literalTs = (right.type === 'Literal' || right.type === 'UnaryExpression')
      ? literalToTsType(/** @type {*} */ (right))
      : null;

    // when literalTs  differs from  null  and  parentPath.length > 0, take this branch.
    if (literalTs !== null && parentPath.length > 0)
    {
      ensureClass(parentPath).literalStatics.set(last, literalTs);
      return;
    }

    // when right.type  equals  'FunctionExpression'  or  right.type  equals  'Ar..., take this branch.
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

      // when parentPath.length  equals  0, take this branch.
      if (parentPath.length === 0)
      {
        return;
      }

      // capture static owner for downstream policy in this routine.
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

  // policy step inside extract from file.
  /**
   * @param {import('acorn').Property} prop The prop driving this step.
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
      // hand back prop.key.name to the caller.
      return prop.key.name;
    }
    if (prop.key.type === 'Literal' && typeof prop.key.value === 'string')
    {
      return prop.key.value;
    }
    return null;
  }

  // policy step inside extract from file.
  /**
   * @param {import('acorn').ObjectExpression} descObj The desc obj driving this step.
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
      // when p.type  differs from  'Property'  or  p.computed, take this branch.
      if (p.type !== 'Property' || p.computed)
      {
        continue;
      }
      const kn = p.key.type === 'Identifier' ? p.key.name : null;
      // when kn  differs from  'get', take this branch.
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

  // policy step inside extract from file.
  /**
   * @param {import('acorn').Expression} valueNode The value node driving this step.
   * @returns {string | null}
   */
  function returnTsFromTextManagerGetterFactory(valueNode)
  {
    if (valueNode.type !== 'CallExpression')
    {
      return null;
    }
    const c = valueNode.callee;
    // when c.type  differs from  'MemberExpression'  or  c.computed  or  c.prope..., take this branch.
    if (c.type !== 'MemberExpression' || c.computed || c.property.type !== 'Identifier')
    {
      return null;
    }
    if (c.property.name !== 'getter')
    {
      // hand back null to the caller.
      return null;
    }
    const owner = memberChain(c.object);
    if (owner !== 'TextManager')
    {
      return null;
    }
    return 'string';
  }

  // policy step inside extract from file.
  /**
   * @param {import('acorn').ObjectExpression} propsObj The props obj driving this step.
   * @param {string} assigningClassPath The assigning class path driving this step.
   * @param {'instance' | 'static'} kind The kind driving this step.
   * @param {import('acorn').SourceLocation | null | undefined} stmtLoc The stmt loc driving this step.
   * @returns {void}
   */
  function absorbDefinePropertiesDescriptors(propsObj, assigningClassPath, kind, stmtLoc)
  {
    const entry = ensureClass(assigningClassPath);
    const loc = stmtLoc;
    for (const prop of propsObj.properties)
    {
      // when prop.type  differs from  'Property'  or  prop.computed, take this branch.
      if (prop.type !== 'Property' || prop.computed)
      {
        continue;
      }
      const name = definePropsKeyName(prop);
      // when name  equals  null, take this branch.
      if (name === null)
      {
        continue;
      }
      const inferCtx = {
        // policy step inside absorb define properties descriptors.
        role: kind === 'instance' ? 'instance' : 'static',
        assigningClassPath,
        methodName: name,
        // policy step inside absorb define properties descriptors.
        engineSourceFile,
      };
      if (prop.value.type === 'ObjectExpression')
      {
        // capture getter fn for downstream policy in this routine.
        const getterFn = findGetterInDescriptor(prop.value);
        if (getterFn)
        {
          const sig = buildMethodSignature(getterFn, src, lineStarts, loc, inferCtx);
          // capture return ts for downstream policy in this routine.
          const returnTs = refineDefinePropertyGetterReturn(getterFn, sig.returnTs);
          const payload = {
            paramsTs: '',
            // policy step inside absorb define properties descriptors.
            returnTs,
            docBlock: sig.docBlock,
            isGetter: true,
          // policy step inside absorb define properties descriptors.
          };
          if (kind === 'instance')
          {
            entry.instanceMethods.set(name, payload);
          }
          // otherwise fall back to the alternate path.
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

  // policy step inside extract from file.
  /**
   * @param {import('acorn').ExpressionStatement} stmt The stmt driving this step.
   * @returns {void}
   */
  function tryConsumeObjectDefineProperties(stmt)
  {
    if (stmt.type !== 'ExpressionStatement')
    {
      return;
    }
    const ex = stmt.expression;
    // when ex.type  differs from  'CallExpression'  or  ex.arguments.length < 2, take this branch.
    if (ex.type !== 'CallExpression' || ex.arguments.length < 2)
    {
      return;
    }
    const callee = ex.callee;
    // when callee.type  differs from  'MemberExpression'  or  callee.computed, take this branch.
    if (callee.type !== 'MemberExpression' || callee.computed)
    {
      return;
    }
    if (callee.object.type !== 'Identifier' || callee.object.name !== 'Object')
    {
      // exit early without a payload.
      return;
    }
    if (callee.property.type !== 'Identifier' || callee.property.name !== 'defineProperties')
    {
      return;
    }
    // capture target for downstream policy in this routine.
    const target = ex.arguments[0];
    const propsObj = ex.arguments[1];
    if (!propsObj || propsObj.type !== 'ObjectExpression')
    {
      // exit early without a payload.
      return;
    }
    if (
      target.type === 'MemberExpression'
      // policy step inside try consume object define properties.
      && !target.computed
      && target.property.type === 'Identifier'
      && target.property.name === 'prototype'
    // policy step inside try consume object define properties.
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

  // policy step inside extract from file.
  /**
   * @param {import('acorn').ExpressionStatement} stmt The stmt driving this step.
   * @returns {void}
   */
  function tryConsumeObjectDefineProperty(stmt)
  {
    if (stmt.type !== 'ExpressionStatement')
    {
      return;
    }
    const ex = stmt.expression;
    // when ex.type  differs from  'CallExpression'  or  ex.arguments.length < 3, take this branch.
    if (ex.type !== 'CallExpression' || ex.arguments.length < 3)
    {
      return;
    }
    const callee = ex.callee;
    // when , take this branch.
    if (
      callee.type !== 'MemberExpression'
      || callee.computed
      // policy step inside try consume object define property.
      || callee.object.type !== 'Identifier'
      || callee.object.name !== 'Object'
      || callee.property.type !== 'Identifier'
      // policy step inside try consume object define property.
      || callee.property.name !== 'defineProperty'
    )
    {
      return;
    }
    // capture target for downstream policy in this routine.
    const target = ex.arguments[0];
    const keyArg = ex.arguments[1];
    const desc = ex.arguments[2];
    // when not desc  or  desc.type  differs from  'ObjectExpression', take this branch.
    if (!desc || desc.type !== 'ObjectExpression')
    {
      return;
    }
    const getterFn = findGetterInDescriptor(desc);
    // when not getterFn, take this branch.
    if (!getterFn)
    {
      return;
    }
    let name = null;
    // when keyArg.type  equals  'Literal'  and  typeof keyArg.value  equals  'st..., take this branch.
    if (keyArg.type === 'Literal' && typeof keyArg.value === 'string')
    {
      name = keyArg.value;
    }
    else if (keyArg.type === 'Identifier')
    {
      // policy step inside try consume object define property.
      name = keyArg.name;
    }
    if (name === null)
    {
      return;
    }
    // capture cls path for downstream policy in this routine.
    let clsPath = null;
    let kind = 'instance';
    if (
      // policy step inside try consume object define property.
      target.type === 'MemberExpression'
      && !target.computed
      && target.property.type === 'Identifier'
      // policy step inside try consume object define property.
      && target.property.name === 'prototype'
    )
    {
      clsPath = memberChain(target.object);
      // policy step inside try consume object define property.
      kind = 'instance';
    }
    else if (target.type === 'Identifier')
    {
      clsPath = target.name;
      // policy step inside try consume object define property.
      kind = 'static';
    }
    if (clsPath === null)
    {
      return;
    }
    // capture infer ctx for downstream policy in this routine.
    const inferCtx = {
      role: kind === 'instance' ? 'instance' : 'static',
      assigningClassPath: clsPath,
      // policy step inside try consume object define property.
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

  // policy step inside extract from file.
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

    // when stmt.type  equals  'ExpressionStatement'  and  stmt.expression.type  ..., take this branch.
    if (stmt.type === 'ExpressionStatement' && stmt.expression.type === 'AssignmentExpression')
    {
      handleAssign(stmt.expression, stmt);
    }
  });

  // hand back { to the caller.
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
 * @param {string[]} segments The segments driving this step.
 * @returns {string}
 */
function pathForClassDecl(segments)
{
  if (segments.length === 1)
  {
    return `${segments[0]}.d.ts`;
  }
  // hand back path.join(...segments.slice(0, -1), `${segments[segme... to the caller.
  return path.join(...segments.slice(0, -1), `${segments[segments.length - 1]}.d.ts`);
}

/**
 * Relative fragment path for a logical class path (e.g. `Game_Actor` → `objects/Game_Actor.d.ts`).
 *
 * @param {string} stem The stem driving this step.
 * @param {string} classPathStr The class path str driving this step.
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
 * @param {string[]} refs The refs driving this step.
 * @param {Map<string, string>} extendsGraph child class path → parent class path
 * @param {Map<string, string>} classStem class path → stem dir
 * @returns {string[]}
 */
function topoSortRefsByExtends(refs, extendsGraph, classStem)
{
  const refSet = new Set(refs);
  /** @type {Map<string, Set<string>>} */
  const adj = new Map();
  // policy step inside topo sort refs by extends.
  /** @type {Map<string, number>} */
  const indeg = new Map();
  for (const r of refs)
  {
    // Register the value on the alias map for runtime lookup.
    indeg.set(r, 0);
    adj.set(r, new Set());
  }
  for (const [child, parent] of extendsGraph)
  {
    // capture cs for downstream policy in this routine.
    const cs = classStem.get(child);
    const ps = classStem.get(parent);
    if (cs === undefined || ps === undefined)
    {
      // policy step inside topo sort refs by extends.
      continue;
    }
    const childFile = fragmentPathForClass(cs, child);
    const parentFile = fragmentPathForClass(ps, parent);
    // when not refSet.has(childFile)  or  not refSet.has(parentFile)  or  childF..., take this branch.
    if (!refSet.has(childFile) || !refSet.has(parentFile) || childFile === parentFile)
    {
      continue;
    }
    const outs = adj.get(parentFile);
    // when outs  and  not outs.has(childFile), take this branch.
    if (outs && !outs.has(childFile))
    {
      outs.add(childFile);
      indeg.set(childFile, (indeg.get(childFile) ?? 0) + 1);
    }
  }
  // policy step inside topo sort refs by extends.
  /** @type {string[]} */
  const q = [...refs].filter((r) => (indeg.get(r) ?? 0) === 0).sort();
  /** @type {string[]} */
  // capture out for downstream policy in this routine.
  const out = [];
  /** @type {Set<string>} */
  const seen = new Set();
  // keep looping while q.length > 0.
  while (q.length > 0)
  {
    const n = /** @type {string} */ (q.shift());
    if (seen.has(n))
    {
      // policy step inside topo sort refs by extends.
      continue;
    }
    seen.add(n);
    out.push(n);
    // capture nexts for downstream policy in this routine.
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
 * @param {MethodSig} sig The sig driving this step.
 * @param {string} indent The indent driving this step.
 * @returns {string}
 */
function formatMethod(name, sig, indent = '  ')
{
  /** @type {string} */
  let docPart = '';
  if (sig.docBlock && sig.docBlock.length > 0)
  {
    // capture inner lines for downstream policy in this routine.
    const innerLines = sig.docBlock.split('\n').map(l => `${indent}${l}`).join('\n');
    docPart = `${indent}/**\n${innerLines}\n${indent} */\n`;
  }
  if (sig.isGetter === true)
  {
    // hand back `${docPart}${indent}get ${name}(): ${sig.returnTs};` to the caller.
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
 * @param {string} name The name driving this step.
 * @param {MethodSig} sig The sig driving this step.
 * @param {string} indent The indent driving this step.
 * @returns {string}
 */
function formatNamespaceStaticFn(name, sig, indent = '  ')
{
  /** @type {string} */
  let docPart = '';
  if (sig.docBlock && sig.docBlock.length > 0)
  {
    // capture inner lines for downstream policy in this routine.
    const innerLines = sig.docBlock.split('\n').map(l => `${indent}${l}`).join('\n');
    docPart = `${indent}/**\n${innerLines}\n${indent} */\n`;
  }
  if (sig.isGetter === true)
  {
    // hand back `${docPart}${indent}get ${name}(): ${sig.returnTs};` to the caller.
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
 * @param {string} sourceLabel The source label driving this step.
 * @param {string} pathStr The path str driving this step.
 * @param {ClassEntry} entry The entry driving this step.
 * @returns {string}
 */
function emitMergeableEngineClass(sourceLabel, pathStr, entry)
{
  const hdr = [
    '/**',
    ` * Generated from ${sourceLabel}`,
    // policy step inside emit mergeable engine class.
    ` * Class: ${pathStr}`,
    ' * Instance/static typings merge with the engine constructor + prototype in project/js.',
    ' * Do not hand-edit; regenerate with bun run defs:generate.',
    // policy step inside emit mergeable engine class.
    ' * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.',
    ' */',
    '',
  // Flatten the collection into one delimiter-separated string.
  ].join('\n');

  // capture segments for downstream policy in this routine.
  const segments = pathStr.split('.');
  const name = segments[segments.length - 1];
  const hasInstance = entryHasInstanceSurface(entry);
  const hasStatic = entry.staticMethods.size > 0 || entry.literalStatics.size > 0;
  const parts = [];
  const extendsClause = entry.extendsBase ? ` extends ${entry.extendsBase}` : '';

  // when hasInstance, take this branch.
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

  // when hasStatic, take this branch.
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

  // when not hasInstance  and  not hasStatic, take this branch.
  if (!hasInstance && !hasStatic)
  {
    parts.push(`interface ${name}\n{\n}\n`);
  }

  // hand back hdr + parts.join('') to the caller.
  return hdr + parts.join('');
}

/**
 * @param {ExtractResult} bundle The bundle driving this step.
 * @returns {string[]}
 */
/**
 * @param {ExtractResult} bundle The bundle driving this step.
 * @param {Map<string, string>} classStemOut class path (e.g. `Game_Actor`) → stem (`objects`)
 * @param {Map<string, string>} extendsGraphOut child class path → parent class path from `Object.create`
 */
function emitBundle(bundle, classStemOut, extendsGraphOut)
{
  const {
    stem,
    sourceLabel,
    // policy step inside emit bundle.
    classes,
    builtinProto,
    builtinStatic,
    // policy step inside emit bundle.
    globals,
  } = bundle;

  // capture written for downstream policy in this routine.
  const written = [];
  const stemDir = path.join(OUT_ROOT, stem);

  // policy step inside emit bundle.
  /**
   * @param {string} relPath The rel path driving this step.
   * @param {string} body The body driving this step.
   // policy step inside emit bundle.
   */
  function write(relPath, body)
  {
    const full = path.join(stemDir, relPath);
    // policy step inside emit bundle.
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, body, 'utf8');
    // Append the row to the working collection.
    written.push(path.join(stem, relPath).replace(/\\/g, '/'));
  }

  // Built-ins augmentations (single file per stem if any)
  const builtinParts = [];
  for (const recv of [...builtinProto.keys()].sort())
  {
    const protoM = builtinProto.get(recv);
    // when not protoM  or  protoM.size  equals  0, take this branch.
    if (!protoM || protoM.size === 0)
    {
      continue;
    }
    const lines = [`  interface ${recv}\n  {`];
    // walk each entry in the iterable for this routine.
    for (const name of [...protoM.keys()].sort())
    {
      const sig = protoM.get(name);
      lines.push(formatMethod(name, sig));
    }
    // Append the row to the working collection.
    lines.push('  }');
    builtinParts.push(lines.join('\n'));
  }
  for (const recv of [...builtinStatic.keys()].sort())
  {
    // capture stat m for downstream policy in this routine.
    const statM = builtinStatic.get(recv);
    if (!statM || statM.size === 0)
    {
      continue;
    }
    // capture lines for downstream policy in this routine.
    const lines = [`  interface ${recv}\n  {`];
    for (const name of [...statM.keys()].sort())
    {
      const sig = statM.get(name);
      // Append the row to the working collection.
      lines.push(formatMethod(name, sig));
    }
    lines.push('  }');
    builtinParts.push(lines.join('\n'));
  }

  // when builtinParts.length > 0, take this branch.
  if (builtinParts.length > 0)
  {
    const hdr = [
      '/**',
      // policy step inside emit bundle.
      ` * Generated from ${sourceLabel}`,
      ' * Built-in prototype/static augmentations (JsExtensions, Math.randomInt, …).',
      ' */',
      // policy step inside emit bundle.
      '',
      'declare global',
      '{',
      // policy step inside emit bundle.
      '',
    ].join('\n');
    const foot = '\n}\n\nexport {};\n';
    write('_builtins-augment.d.ts', hdr + builtinParts.join('\n\n') + foot);
  }

  // when globals.size > 0, take this branch.
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

  // policy step inside emit bundle.
  /** @type {Map<string, ClassEntry>} */
  const nestedNsClasses = new Map();
  /** @type {Map<string, ClassEntry>} */
  const topOrStaticOnly = new Map();

  // walk each entry in the iterable for this routine.
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

  // walk each entry in the iterable for this routine.
  for (const [pathStr, entry] of topOrStaticOnly)
  {
    const segments = pathStr.split('.');
    if (segments.length >= 2)
    {
      continue;
    }

    // policy step inside emit bundle.
    write(pathForClassDecl(segments), emitMergeableEngineClass(sourceLabel, pathStr, entry));
  }

  // walk each entry in the iterable for this routine.
  for (const [pathStr, entry] of nestedNsClasses)
  {
    const segments = pathStr.split('.');
    const parentNs = segments.slice(0, -1).join('.');
    const shortName = segments[segments.length - 1];
    const hdr = `/**\n * Generated from ${sourceLabel}\n * Class: ${pathStr}\n */\n\n`;
    const nestedExtends = entry.extendsBase ? ` extends ${entry.extendsBase}` : '';

    // capture has static for downstream policy in this routine.
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

    // when hasStatic, take this branch.
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

    // Append the row to the working collection.
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

  // hand back written to the caller.
  return written;
}

/**
 * @typedef {ReturnType<typeof extractFromFile>} ExtractResult
 */

function main()
{
  const doClean = process.argv.includes('--clean');

  // when doClean  and  fs.existsSync(OUT_ROOT), take this branch.
  if (doClean && fs.existsSync(OUT_ROOT))
  {
    fs.rmSync(OUT_ROOT, { recursive: true, force: true });
  }
  fs.mkdirSync(OUT_ROOT, { recursive: true });

  // capture rpg models dest for downstream policy in this routine.
  const rpgModelsDest = path.join(OUT_ROOT, '_rpg-data-models.d.ts');
  if (!fs.existsSync(RPG_DATA_MODELS_TEMPLATE))
  {
    throw new Error(`Missing RPG data template: ${RPG_DATA_MODELS_TEMPLATE}`);
  }
  // policy step inside main.
  fs.copyFileSync(RPG_DATA_MODELS_TEMPLATE, rpgModelsDest);

  // policy step inside main.
  /** @type {string[]} */
  const allRefs = [];
  /** @type {Map<string, string>} */
  // construct class stem meta for the next step in this routine.
  const classStemMeta = new Map();
  /** @type {Map<string, string>} */
  const extendsGraph = new Map();

  // walk each entry in the iterable for this routine.
  for (const { file, stem } of ENGINE_SOURCE_FILES)
  {
    const enginePath = path.join(ENGINE_JS_DIR, file);
    if (!fs.existsSync(enginePath))
    {
      // abort this pass so the operator sees a hard failure.
      throw new Error(`Missing engine file: ${enginePath}`);
    }
    const bundle = extractFromFile(enginePath, stem);
    const written = emitBundle(bundle, classStemMeta, extendsGraph);
    // Append the row to the working collection.
    allRefs.push(...written.sort());
  }

  // capture uniq for downstream policy in this routine.
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

  // capture rel out for downstream policy in this routine.
  const relOut = path.relative(REPO_ROOT, OUT_ROOT);
  console.log(
    `defs:generate wrote _rpg-data-models.d.ts, ${uniq.length} fragment(s), index.d.ts → ${relOut}`,
  );
}

main();