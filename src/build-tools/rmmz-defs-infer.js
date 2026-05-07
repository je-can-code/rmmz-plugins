/* eslint-disable complexity -- inference heuristics are inherently branchy */
/* eslint-disable prefer-destructuring */

/**
 * JSDoc + lightweight AST inference for generated RPG MZ `.d.ts` signatures.
 *
 * v1.1 policy: removed thousands of naming/class “guess” overrides. Anything not proved by engine JSDoc or
 * `inferExprType` / `inferReturnFromBody` stays `unknown` (or param `unknown`) instead of lying with `number`/`string`.
 * Intentionally favors honesty over autocomplete density — tighten types via engine JSDoc or richer AST rules.
 */

const RESERVED_PARAM = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'export',
  'extends', 'false', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'new', 'null', 'return',
  'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield', 'let',
  'static', 'enum', 'implements', 'interface', 'package', 'private', 'protected', 'public', 'abstract', 'boolean',
  'number', 'string', 'symbol', 'type', 'from', 'as', 'await',
]);

/**
 * @param {string} name
 * @returns {string}
 */
export function safeParam(name)
{
  if (RESERVED_PARAM.has(name))
  {
    return `_${name}`;
  }
  return name;
}

/**
 * @param {string} src
 * @returns {number[]}
 */
export function buildLineStarts(src)
{
  const starts = [0];
  for (let i = 0; i < src.length; i++)
  {
    if (src[i] === '\n')
    {
      starts.push(i + 1);
    }
  }
  return starts;
}

/**
 * @param {number[]} lineStarts
 * @param {{ line: number, column: number }} pos
 * @returns {number}
 */
export function locStartToOffset(lineStarts, pos)
{
  if (!pos || pos.line < 1)
  {
    return 0;
  }
  const row = lineStarts[pos.line - 1];
  if (row === undefined)
  {
    return 0;
  }
  return row + pos.column;
}

/**
 * @param {string} s
 * @returns {string[]}
 */
function splitUnionTop(s)
{
  const out = [];
  let depth = 0;
  let cur = '';
  for (let i = 0; i < s.length; i++)
  {
    const c = s[i];
    if (c === '<' || c === '(' || c === '{')
    {
      depth++;
    }
    else if (c === '>' || c === ')' || c === '}')
    {
      depth--;
    }
    else if (c === '|' && depth === 0)
    {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += c;
  }
  out.push(cur.trim());
  return out.filter(Boolean);
}

/**
 * @param {string} raw
 * @returns {string}
 */
export function jsdocTypeToTs(raw)
{
  let s = raw.trim();
  if (s.length === 0)
  {
    return 'unknown';
  }

  if (s.startsWith('[') && s.endsWith(']'))
  {
    s = s.slice(1, -1).trim();
    const eq = s.indexOf('=');
    if (eq >= 0)
    {
      s = s.slice(0, eq).trim();
    }
  }

  const lower = s.toLowerCase();
  if (lower === '*')
  {
    return 'unknown';
  }
  if (lower === 'any')
  {
    return 'any';
  }
  if (lower === 'void')
  {
    return 'void';
  }
  if (lower === 'null')
  {
    return 'null';
  }
  if (lower === 'undefined')
  {
    return 'undefined';
  }
  if (lower === 'boolean')
  {
    return 'boolean';
  }
  if (lower === 'number')
  {
    return 'number';
  }
  if (lower === 'string')
  {
    return 'string';
  }
  if (lower === 'object')
  {
    return 'object';
  }
  if (lower === 'array')
  {
    return 'unknown[]';
  }

  const arrayAngle = /^array\.<(.+)>$/i.exec(s);
  if (arrayAngle)
  {
    return `Array<${jsdocTypeToTs(arrayAngle[1])}>`;
  }

  if (/^array$/i.test(s))
  {
    return 'unknown[]';
  }

  const unionParts = splitUnionTop(s);
  if (unionParts.length > 1)
  {
    const mapped = unionParts.map(jsdocTypeToTs);
    const uniq = [...new Set(mapped)];
    return uniq.join(' | ');
  }

  if (/^function\b/i.test(s))
  {
    return '(...args: unknown[]) => unknown';
  }

  if (s === 'Object')
  {
    return 'object';
  }
  if (s === 'String')
  {
    return 'string';
  }
  if (s === 'Number')
  {
    return 'number';
  }
  if (s === 'Boolean')
  {
    return 'boolean';
  }

  return s;
}

/**
 * Extract `{content}` after `@param` on a line (handles nested braces shallowly).
 *
 * @param {string} line
 * @returns {{ typeRaw: string, name: string, description?: string } | null}
 */
function parseParamLine(line)
{
  const m = line.match(/@param\s+/);
  if (!m || m.index === undefined)
  {
    return null;
  }
  let i = m.index + m[0].length;
  while (i < line.length && /\s/.test(line[i]))
  {
    i++;
  }
  if (line[i] !== '{')
  {
    return null;
  }
  let depth = 0;
  const start = i;
  let j = i;
  for (; j < line.length; j++)
  {
    const c = line[j];
    if (c === '{')
    {
      depth++;
    }
    else if (c === '}')
    {
      depth--;
      if (depth === 0)
      {
        break;
      }
    }
  }
  if (depth !== 0)
  {
    return null;
  }
  const typeRaw = line.slice(start + 1, j);
  const rest = line.slice(j + 1).trim();
  const nameM = /^([\w$]+)\s*(?:-\s*)?(.*)$/.exec(rest);
  if (!nameM)
  {
    return null;
  }
  const desc = nameM[2].trim();
  return {
    typeRaw,
    name: nameM[1],
    description: desc.length > 0 ? desc : undefined,
  };
}

/**
 * @param {string} jsdoc
 * @returns {{
 *   params: Map<string, string>,
 *   paramDescriptions: Map<string, string>,
 *   returns: string | null,
 *   typeTag: string | null,
 *   summary: string,
 * }}
 */
export function parseJsdocBlock(jsdoc)
{
  /** @type {Map<string, string>} */
  const params = new Map();
  /** @type {Map<string, string>} */
  const paramDescriptions = new Map();
  let returns = null;
  let typeTag = null;

  if (!jsdoc || jsdoc.length === 0)
  {
    return { params, paramDescriptions, returns, typeTag, summary: '' };
  }

  const inner = jsdoc.replace(/^\/\*\*\s*/, '').replace(/\s*\*\/$/, '');
  const lines = inner.split(/\r?\n/).map(l => l.replace(/^\s*\*?\s?/, ''));

  /** @type {string[]} */
  const summaryParts = [];
  /** @type {boolean} */
  let blankAfterSummaryText = false;

  for (const line of lines)
  {
    if (/^\s*@/.test(line))
    {
      break;
    }
    const t = line.trim();
    if (t.length === 0)
    {
      if (summaryParts.length > 0)
      {
        blankAfterSummaryText = true;
      }
      continue;
    }
    if (blankAfterSummaryText)
    {
      break;
    }
    summaryParts.push(t);
  }

  const summary = summaryParts.join(' ');

  for (const line of lines)
  {
    const pl = parseParamLine(line);
    if (pl)
    {
      params.set(pl.name, jsdocTypeToTs(pl.typeRaw));
      if (pl.description && pl.description.length > 0)
      {
        paramDescriptions.set(pl.name, pl.description);
      }
      continue;
    }

    const retBrace = line.match(/@returns?\s+\{([^}]+)\}/);
    if (retBrace)
    {
      returns = jsdocTypeToTs(retBrace[1]);
      continue;
    }

    const retBare = line.match(/@returns?\s+(\w+)/);
    if (retBare && returns === null)
    {
      returns = jsdocTypeToTs(retBare[1]);
      continue;
    }

    const typeBrace = line.match(/@type\s+\{([^}]+)\}/);
    if (typeBrace)
    {
      typeTag = jsdocTypeToTs(typeBrace[1]);
      continue;
    }

    const typeBare = line.match(/@type\s+(\w+)/);
    if (typeBare && typeTag === null)
    {
      typeTag = jsdocTypeToTs(typeBare[1]);
    }
  }

  return { params, paramDescriptions, returns, typeTag, summary };
}

/**
 * @param {string} src
 * @param {number[]} lineStarts
 * @param {{ start: { line: number, column: number } }} stmtLoc
 * @param {number} maxGap
 * @returns {string}
 */
export function extractLeadingJsdoc(src, lineStarts, stmtLoc, maxGap = 900)
{
  const pos = locStartToOffset(lineStarts, stmtLoc.start);
  const before = src.slice(0, pos);
  const re = /\/\*\*[\s\S]*?\*\//g;
  /** @type {{ text: string, end: number }[]} */
  const blocks = [];
  let m;
  while ((m = re.exec(before)) !== null)
  {
    blocks.push({ text: m[0], end: m.index + m[0].length });
  }

  for (let i = blocks.length - 1; i >= 0; i--)
  {
    const { text, end } = blocks[i];
    if (pos - end > maxGap)
    {
      continue;
    }

    // reject if another global/top assignment appears between this comment and the stmt (prevents
    // `$dataAnimations = null` from inheriting the `@type` above `$dataStates`, etc.).
    const mid = src.slice(end, pos);
    if (/\$[a-zA-Z_][\w$]*\s*=/m.test(mid))
    {
      continue;
    }

    return text;
  }

  return '';
}

/**
 * @param {string} classPath
 * @returns {string}
 */
function shortClassName(classPath)
{
  const parts = classPath.split('.');
  return parts[parts.length - 1];
}

/**
 * @param {import('acorn').Statement | import('acorn').Expression | null | undefined} node
 * @param {import('acorn').AnyNode[]} out
 */
function gatherReturns(node, out)
{
  if (!node)
  {
    return;
  }

  switch (node.type)
  {
    case 'ReturnStatement':
      out.push(node.argument);
      return;
    case 'BlockStatement':
      for (const st of node.body)
      {
        gatherReturns(st, out);
      }
      return;
    case 'IfStatement':
      gatherReturns(node.consequent, out);
      gatherReturns(node.alternate, out);
      return;
    case 'SwitchStatement':
      for (const sc of node.cases)
      {
        for (const st of sc.consequent)
        {
          gatherReturns(st, out);
        }
      }
      return;
    case 'TryStatement':
      gatherReturns(node.block, out);
      if (node.handler)
      {
        gatherReturns(node.handler.body, out);
      }
      gatherReturns(node.finalizer, out);
      return;
    case 'WhileStatement':
    case 'DoWhileStatement':
    case 'ForStatement':
    case 'ForInStatement':
    case 'ForOfStatement':
      gatherReturns(node.body, out);
      return;
    case 'LabeledStatement':
      gatherReturns(node.body, out);
      return;
    default:
      return;
  }
}

/**
 * @typedef {{
 *   assigningClassPath: string,
 *   role: 'instance' | 'static' | 'builtinProto',
 *   builtinReceiver?: string,
 *   methodName?: string,
 *   engineSourceFile?: string,
 * }} InferContext
 */

/**
 * RPG Maker MZ convention: predicate helpers named `isFoo` / `isJapanese` almost always return boolean.
 * Requires `is` + uppercase camel segment so we do not match identifiers like `issue` or `isolate`.
 *
 * @param {string} name
 * @returns {boolean}
 */
function looksLikeIsPredicateMethodName(name)
{
  return /^is[A-Z][\w$]*$/.test(name);
}

/**
 * `hasItem`, `hasSkill`, etc. — same predicate vibe as `is*`.
 *
 * @param {string} name
 * @returns {boolean}
 */
function looksLikeHasPredicateMethodName(name)
{
  return /^has[A-Z][\w$]*$/.test(name);
}

/**
 * Parameter array for one map event command (`event.commands[].parameters` / `currentCommand().parameters`).
 * JSON-backed; entries may be primitives, nested arrays (choice lists), or structured objects (audio blobs).
 *
 * @type {string}
 */
const RMMZ_EVENT_COMMAND_PARAMETERS =
  'readonly (number | string | boolean | object | null)[]';

/**
 * One event command entry in an interpreter list (`this._list`).
 * Vanilla shape: `{ code, indent, parameters }`.
 *
 * @type {string}
 */
const RMMZ_EVENT_COMMAND = `{ code: number; indent: number; parameters: ${RMMZ_EVENT_COMMAND_PARAMETERS} }`;

/**
 * An interpreter list (`this._list`) — array of event commands.
 *
 * @type {string}
 */
const RMMZ_EVENT_COMMAND_LIST = `Array<${RMMZ_EVENT_COMMAND}>`;

/**
 * Show Picture command — parameter tuple is long; keep out of the freeze table for lint line limits.
 *
 * @type {string}
 */
const INTERPRETER_COMMAND231_PARAMS =
  'readonly [number, string, number, number, number, number, number, number, number, number]';

/**
 * Move Picture command — thirteen numeric/event slots from the map editor schema.
 *
 * @type {string}
 */
const INTERPRETER_COMMAND232_PARAMS =
  'readonly [number, number, number, number, number, number, number, number, number, number, number, number, number]';

/**
 * Full map of vanilla `Game_Interpreter.prototype.commandNNN(params)` tuple shapes from
 * `project/js/rmmz_objects.js`. Regenerate with
 * `node src/build-tools/generate-interpreter-command-param-types.mjs`.
 * Polymorphic commands use `readonly unknown[]` (111, 122, 285, 302).
 *
 * @type {Readonly<Record<string, string>>}
 */
const INTERPRETER_COMMAND_PARAM_TYPES = Object.freeze({
  command101: 'readonly [string, number, number, number, string]',
  command102: 'readonly [readonly string[], number, number, number, number]',
  command103: 'readonly [number, number]',
  command104: 'readonly [number, number]',
  command105: 'readonly [number, number]',
  command108: 'readonly [string]',
  command111: RMMZ_EVENT_COMMAND_PARAMETERS,
  command117: 'readonly [number]',
  command119: 'readonly [string]',
  command121: 'readonly [number, number, number]',
  command122: RMMZ_EVENT_COMMAND_PARAMETERS,
  command123: 'readonly [string, number]',
  command124: 'readonly [number, number]',
  command125: 'readonly [number, number, number]',
  command126: 'readonly [number, number, number, number]',
  command127: 'readonly [number, number, number, number, number]',
  command128: 'readonly [number, number, number, number, number]',
  command129: 'readonly [number, number, number]',
  command132: 'readonly [{ name: string; pan: number; pitch: number; volume: number }]',
  command133: 'readonly [{ name: string; pan: number; pitch: number; volume: number }]',
  command134: 'readonly [number]',
  command135: 'readonly [number]',
  command136: 'readonly [number]',
  command137: 'readonly [number]',
  command138: 'readonly [readonly [number, number, number, number]]',
  command139: 'readonly [{ name: string; pan: number; pitch: number; volume: number }]',
  command140: 'readonly [number, { name: string; pan: number; pitch: number; volume: number }]',
  command201: 'readonly [number, number, number, number, number, number]',
  command202: 'readonly [number, number, number, number, number]',
  command203: 'readonly [number, number, number, number, number]',
  command204: 'readonly [number, number, number, number]',
  command205: 'readonly [number, number]',
  command211: 'readonly [number]',
  command212: 'readonly [number, number, number]',
  command213: 'readonly [number, number, number]',
  command216: 'readonly [number]',
  command223: 'readonly [[number, number, number, number], number]',
  command224: 'readonly [[number, number, number, number], number]',
  command225: 'readonly [number, number, number, number]',
  command230: 'readonly [number]',
  command231: INTERPRETER_COMMAND231_PARAMS,
  command232: INTERPRETER_COMMAND232_PARAMS,
  command233: 'readonly [number, number]',
  command234: 'readonly [number, [number, number, number, number], number]',
  command235: 'readonly [number]',
  command236: 'readonly [number, number, number, number]',
  command241: 'readonly [{ name: string; pan: number; pitch: number; volume: number }]',
  command242: 'readonly [number]',
  command245: 'readonly [{ name: string; pan: number; pitch: number; volume: number }]',
  command246: 'readonly [number]',
  command249: 'readonly [{ name: string; pan: number; pitch: number; volume: number }]',
  command250: 'readonly [{ name: string; pan: number; pitch: number; volume: number }]',
  command261: 'readonly [string]',
  command281: 'readonly [number]',
  command282: 'readonly [number]',
  command283: 'readonly [number, number]',
  command284: 'readonly [number, number, number, number, number]',
  command285: RMMZ_EVENT_COMMAND_PARAMETERS,
  command301: 'readonly [number, number, number, number]',
  command302: RMMZ_EVENT_COMMAND_PARAMETERS,
  command303: 'readonly [number, number]',
  command311: 'readonly [number, number, number, number, number, number]',
  command312: 'readonly [number, number, number, number, number]',
  command313: 'readonly [number, number, number, number]',
  command314: 'readonly [number, number]',
  command315: 'readonly [number, number, number, number, number, number]',
  command316: 'readonly [number, number, number, number, number, number]',
  command317: 'readonly [number, number, number, number, number, number]',
  command318: 'readonly [number, number, number, number]',
  command319: 'readonly [number, number, number]',
  command320: 'readonly [number, string]',
  command321: 'readonly [number, number, number]',
  command322: 'readonly [number, string, number, string, number, string]',
  command323: 'readonly [number, number, number]',
  command324: 'readonly [number, string]',
  command325: 'readonly [number, string]',
  command326: 'readonly [number, number, number, number, number]',
  command331: 'readonly [number, number, number, number, number]',
  command332: 'readonly [number, number, number, number]',
  command333: 'readonly [number, number, number]',
  command334: 'readonly [number]',
  command335: 'readonly [number]',
  command336: 'readonly [number, number]',
  command337: 'readonly [number, number, number]',
  command339: 'readonly [number, number, number, number]',
  command342: 'readonly [number, number, number, number]',
  command356: 'readonly [string]',
  command357: 'readonly [string, string, object, string]',
  command402: 'readonly [number]',
});

/**
 * @param {string} methodName
 * @returns {string}
 */
function interpreterCommandParamsTs(methodName)
{
  const tuple = INTERPRETER_COMMAND_PARAM_TYPES[methodName];
  if (tuple !== undefined && tuple !== null && tuple.length > 0)
  {
    return tuple;
  }

  return RMMZ_EVENT_COMMAND_PARAMETERS;
}

/**
 * Small allow-list of return types verified against vanilla `project/js/rmmz_*.js` implementations.
 * Add entries only after reading the method body — no regex/name-shape guessing (see v1.1 banner).
 *
 * @param {string | undefined} cls
 * @param {string} methodName
 * @param {string} currentTs
 * @returns {string | null}
 */
function refineReturnTsByEngineClass(cls, methodName, currentTs)
{
  if (!cls)
  {
    return null;
  }

  const n = methodName;

  // `textSizeEx` returns width/height from `textState`; literal `{ ... }` inference is only `object`.
  if (cls === 'Window_Base' && n === 'textSizeEx')
  {
    if (currentTs === 'unknown' || currentTs === 'object')
    {
      return '{ width: number; height: number }';
    }
  }

  // `return this._parameters[name.toLowerCase()] || {}` — string-keyed plugin defaults from plugins.json.
  if (cls === 'PluginManager' && n === 'parameters')
  {
    if (currentTs === 'unknown' || currentTs === 'object')
    {
      return 'RPG_PluginParameterMap';
    }
  }

  const allowPromiseRefinement = cls === 'StorageManager' && currentTs === 'Promise';

  if (
    !allowPromiseRefinement
    && currentTs !== 'unknown'
    && currentTs !== 'unknown[]'
    && currentTs !== 'null'
    && currentTs !== 'void'
  )
  {
    return null;
  }

  // `Window_Base.prototype.drawTextEx` ends with `return textState.outputWidth` (final rendered width in px).
  if (cls === 'Window_Base' && n === 'drawTextEx')
  {
    return 'number';
  }

  // Plain object built in `createTextState`; shared by `Window_Message` overrides that accept `textState`.
  if (cls === 'Window_Base' && n === 'createTextState')
  {
    return 'RPG_TextState';
  }

  return null;
}


/**
 * Last pass after JSDoc + `inferReturnFromBody`. v1.1 removed broad name-shape heuristics; only
 * a few engine singleton accessors and `is*` / `has*` predicates are tightened here.
 *
 * @param {string} currentTs
 * @param {InferContext} inferCtx
 * @returns {string}
 */
function refineReturnTsByMethodName(currentTs, inferCtx)
{
  const methodName = inferCtx.methodName;
  if (!methodName)
  {
    return currentTs;
  }

  const n = methodName;
  const cls = inferCtx.assigningClassPath;

  if (currentTs === 'unknown' || currentTs === 'null')
  {
    if (cls === 'Game_Actors' && n === 'actor')
    {
      return 'Game_Actor | null';
    }

    if (cls === 'Game_Map' && n === 'event')
    {
      return 'Game_Event | undefined';
    }

    if (cls === 'Game_Map' && n === 'vehicle')
    {
      return 'Game_Vehicle | null';
    }

    const engineHit = refineReturnTsByEngineClass(cls, n, currentTs);
    if (engineHit !== null)
    {
      return engineHit;
    }
  }

  if (currentTs === 'Promise')
  {
    const engineHit = refineReturnTsByEngineClass(cls, n, currentTs);
    if (engineHit !== null)
    {
      return engineHit;
    }
    return currentTs;
  }

  if (currentTs === 'unknown' || currentTs === 'unknown[]')
  {
    const engineHit = refineReturnTsByEngineClass(cls, n, currentTs);
    if (engineHit !== null)
    {
      return engineHit;
    }
    if (currentTs === 'unknown[]')
    {
      return currentTs;
    }
  }

  if (currentTs === 'void')
  {
    const engineVoidHit = refineReturnTsByEngineClass(cls, n, currentTs);
    if (engineVoidHit !== null)
    {
      return engineVoidHit;
    }
    return currentTs;
  }

  // Literal `{ ... }` return inference is often plain `object`; allow verified sharpening (e.g. `textSizeEx`).
  if (currentTs === 'object')
  {
    const engineObjectHit = refineReturnTsByEngineClass(cls, n, currentTs);
    if (engineObjectHit !== null)
    {
      return engineObjectHit;
    }
    return currentTs;
  }

  if (currentTs !== 'unknown' && currentTs !== 'unknown[]')
  {
    return currentTs;
  }

  // Naming predicates map to boolean across vanilla MZ patterns.
  if (looksLikeIsPredicateMethodName(n) || looksLikeHasPredicateMethodName(n))
  {
    return 'boolean';
  }

  return currentTs;
}

/**
 * Verified parameter shapes where vanilla uses a stable identifier (v1.1 allow-list only).
 *
 * @param {string} paramName
 * @param {InferContext | undefined} inferCtx
 * @returns {string | null}
 */
function refineParamTsByEnginePrototype(paramName, inferCtx)
{
  if (!inferCtx || !inferCtx.assigningClassPath)
  {
    return null;
  }

  const cls = inferCtx.assigningClassPath;
  const methodName = inferCtx.methodName;

  if (paramName === 'textState' && (cls === 'Window_Base' || cls === 'Window_Message'))
  {
    return 'RPG_TextState';
  }

  // `name.toLowerCase()` — plugin basename / path fragment from `plugins.js`. Vanilla only uses `name` on
  // `parameters` / `setParameters`; do not require `inferCtx.methodName` (some extract paths omit it).
  if (cls === 'PluginManager' && paramName === 'name')
  {
    return 'string';
  }

  if (cls === 'PluginManager' && methodName === 'setParameters' && paramName === 'parameters')
  {
    return 'RPG_PluginParameterMap';
  }

  if (cls === 'PluginManager' && methodName === 'registerCommand' && paramName === 'func')
  {
    return '(args: unknown) => void';
  }

  return null;
}

/**
 * When JSDoc left a parameter as `unknown`, apply the small engine prototype allow-list above.
 *
 * @param {string} paramName
 * @param {string} currentTs
 * @param {InferContext | undefined} inferCtx
 * @returns {string}
 */
function refineParamTsByParamName(paramName, currentTs, inferCtx)
{
  if ((currentTs !== 'unknown' && currentTs !== 'unknown[]') || !paramName)
  {
    return currentTs;
  }

  const protoTs = refineParamTsByEnginePrototype(paramName, inferCtx);
  if (protoTs !== null)
  {
    return protoTs;
  }

  return currentTs;
}

/**
 * @param {string | undefined | null} jsdocTs
 * @param {string} paramName
 * @param {InferContext | undefined} inferCtx
 * @returns {string}
 */
function resolveParamTs(jsdocTs, paramName, inferCtx)
{
  /** @type {string} */
  let resolved;
  const vagueJsdoc =
    jsdocTs === null
    || jsdocTs === undefined
    || jsdocTs === ''
    || jsdocTs === 'unknown'
    || jsdocTs === 'unknown[]';

  if (vagueJsdoc)
  {
    const seed = jsdocTs === 'unknown[]' ? 'unknown[]' : 'unknown';
    resolved = refineParamTsByParamName(paramName, seed, inferCtx);
  }
  else
  {
    resolved = jsdocTs;
  }

  // Vanilla JSDoc `{function}` becomes an unusably-wide TS callback — allow engine overrides.
  if (resolved === '(...args: unknown[]) => unknown')
  {
    const engineTs = refineParamTsByEnginePrototype(paramName, inferCtx);
    if (engineTs !== null)
    {
      return engineTs;
    }
  }

  return resolved;
}

/**
 * @param {import('acorn').Expression | null | undefined} expr
 * @param {InferContext} ctx
 * @returns {string | null}
 */
export function inferExprType(expr, ctx)
{
  if (expr === null || expr === undefined)
  {
    return 'void';
  }

  switch (expr.type)
  {
    case 'Literal':
      if (expr.value === null)
      {
        return 'null';
      }
      if (typeof expr.value === 'boolean')
      {
        return 'boolean';
      }
      if (typeof expr.value === 'number')
      {
        return 'number';
      }
      if (typeof expr.value === 'string')
      {
        return 'string';
      }
      if (typeof expr.value === 'bigint')
      {
        return 'bigint';
      }
      return null;

    case 'TemplateLiteral':
      return 'string';

    case 'UnaryExpression':
      if (expr.operator === '!')
      {
        return 'boolean';
      }
      if (expr.operator === 'void')
      {
        return 'undefined';
      }
      if (expr.operator === 'typeof')
      {
        return 'string';
      }
      return inferExprType(expr.argument, ctx);

    case 'BinaryExpression':
      if (
        expr.operator === '=='
        || expr.operator === '==='
        || expr.operator === '!='
        || expr.operator === '!=='
        || expr.operator === '<'
        || expr.operator === '>'
        || expr.operator === '<='
        || expr.operator === '>='
        || expr.operator === 'in'
        || expr.operator === 'instanceof'
      )
      {
        return 'boolean';
      }
      if (
        expr.operator === '+'
        || expr.operator === '-'
        || expr.operator === '*'
        || expr.operator === '/'
        || expr.operator === '%'
      )
      {
        const lt = inferExprType(expr.left, ctx);
        const rt = inferExprType(expr.right, ctx);
        if (lt === 'number' && rt === 'number')
        {
          return 'number';
        }
        if (expr.operator === '+' && (lt === 'string' || rt === 'string'))
        {
          return 'string';
        }
        return null;
      }
      return null;

    case 'LogicalExpression':
    {
      const lt = inferExprType(expr.left, ctx);
      const rt = inferExprType(expr.right, ctx);
      /** @type {string[]} */
      const parts = [];
      if (lt !== null && lt !== undefined)
      {
        parts.push(lt);
      }
      if (rt !== null && rt !== undefined)
      {
        parts.push(rt);
      }
      if (parts.length === 0)
      {
        return null;
      }
      return mergeReturnTypes(parts);
    }

    case 'ConditionalExpression':
    {
      const ct = inferExprType(expr.consequent, ctx);
      const at = inferExprType(expr.alternate, ctx);
      if (ct && at && ct === at)
      {
        return ct;
      }
      if (ct && at)
      {
        return `${ct} | ${at}`;
      }
      return ct ?? at;
    }

    case 'CallExpression':
      if (expr.callee.type === 'MemberExpression' && !expr.callee.computed)
      {
        const prop = expr.callee.property.type === 'Identifier' ? expr.callee.property.name : '';
        if (
          expr.callee.object.type === 'ThisExpression'
          && (prop === 'slice' || prop === 'concat')
          && expr.arguments.length === 0
        )
        {
          return 'unknown[]';
        }
      }
      if (expr.callee.type === 'Identifier')
      {
        const name = expr.callee.name;
        if (name === 'Boolean' || name === 'isFinite' || name === 'isNaN')
        {
          return 'boolean';
        }
        if (name === 'Number' || name === 'parseInt' || name === 'parseFloat')
        {
          return 'number';
        }
        if (name === 'String')
        {
          return 'string';
        }
      }
      if (
        expr.callee.type === 'MemberExpression'
        && !expr.callee.computed
        && expr.callee.property.type === 'Identifier'
        && expr.callee.object.type === 'Identifier'
        && expr.callee.object.name === 'Utils'
        && expr.callee.property.name === 'isOptionValid'
      )
      {
        return 'boolean';
      }
      if (
        expr.callee.type === 'MemberExpression'
        && !expr.callee.computed
        && expr.callee.property.type === 'Identifier'
        && expr.callee.property.name === 'getPixel'
      )
      {
        return 'string';
      }
      if (
        expr.callee.type === 'MemberExpression'
        && !expr.callee.computed
        && expr.callee.property.type === 'Identifier'
        && expr.callee.property.name === 'textColor'
        && expr.callee.object.type === 'ThisExpression'
      )
      {
        return 'string';
      }
      return null;

    case 'NewExpression':
      if (expr.callee.type === 'Identifier')
      {
        return expr.callee.name;
      }
      if (expr.callee.type === 'MemberExpression' && !expr.callee.computed)
      {
        const ch = [];
        let cur = expr.callee;
        while (cur.type === 'MemberExpression' && !cur.computed && cur.property.type === 'Identifier')
        {
          ch.unshift(cur.property.name);
          cur = /** @type {*} */ (cur.object);
        }
        if (cur.type === 'Identifier')
        {
          ch.unshift(cur.name);
          return ch.join('.');
        }
      }
      return null;

    case 'ThisExpression':
      if (ctx.role === 'builtinProto')
      {
        switch (ctx.builtinReceiver)
        {
          case 'Array':
            return 'unknown[]';
          case 'Number':
            return 'number';
          case 'String':
            return 'string';
          case 'Boolean':
            return 'boolean';
          case 'Object':
            return 'object';
          default:
            return null;
        }
      }
      if (ctx.role === 'instance')
      {
        return shortClassName(ctx.assigningClassPath);
      }
      if (ctx.role === 'static')
      {
        return `typeof ${shortClassName(ctx.assigningClassPath)}`;
      }
      return null;

    case 'ArrayExpression':
      if (expr.elements.length === 0)
      {
        return 'unknown[]';
      }
      {
        /** @type {string[]} */
        const elemTs = [];
        for (let i = 0; i < expr.elements.length; i++)
        {
          const el = expr.elements[i];
          if (!el || el.type === 'SpreadElement')
          {
            return 'unknown[]';
          }
          const t = inferExprType(el, ctx);
          if (!t)
          {
            return 'unknown[]';
          }
          elemTs.push(t);
        }
        const uniqE = [...new Set(elemTs)];
        if (uniqE.length === 1)
        {
          return `${uniqE[0]}[]`;
        }
      }
      return 'unknown[]';

    case 'ObjectExpression':
      return 'object';

    case 'Identifier':
      if (expr.name === 'undefined')
      {
        return 'undefined';
      }
      if (expr.name === 'true' || expr.name === 'false')
      {
        return 'boolean';
      }
      return resolveParamTs(null, expr.name, ctx);

    case 'MemberExpression':
      if (
        !expr.computed
        && expr.object.type === 'ThisExpression'
        && expr.property.type === 'Identifier'
      )
      {
        const n = expr.property.name;
        if (/^_is[A-Z]/.test(n) || /^_needs[A-Z]/.test(n))
        {
          return 'boolean';
        }
      }
      return null;

    case 'AssignmentExpression':
      return inferExprType(expr.right, ctx);

    case 'SequenceExpression':
      return inferExprType(expr.expressions[expr.expressions.length - 1], ctx);

    case 'YieldExpression':
    case 'AwaitExpression':
      return null;

    default:
      return null;
  }
}

/**
 * Collapse multiple inferred RHS types into one TS union (shared by returns and instance fields).
 *
 * @param {string[]} types
 * @returns {string}
 */
export function mergeReturnTypes(types)
{
  const filtered = types.filter(Boolean).map(t => t.trim()).filter(Boolean);
  const uniq = [...new Set(filtered)];
  if (uniq.some(t => t === 'unknown'))
  {
    return 'unknown';
  }
  if (uniq.length === 1)
  {
    return uniq[0];
  }
  if (uniq.length <= 6)
  {
    return uniq.join(' | ');
  }
  return 'unknown';
}

/**
 * Flatten shallow `a | b` chunks into ordered unique members (engine RHS unions stay simple).
 *
 * @param {string[]} chunks
 * @returns {string[]}
 */
function dedupeUnionTypeMembers(chunks)
{
  /** @type {string[]} */
  const order = [];
  const seen = new Set();
  for (const chunk of chunks)
  {
    const parts = chunk.split(/\s*\|\s*/).map(p => p.trim()).filter(Boolean);
    for (const p of parts)
    {
      if (seen.has(p) === false)
      {
        seen.add(p);
        order.push(p);
      }
    }
  }
  return order;
}

/**
 * Engine fields often start as numeric literals (`Sprite._counter = 0`) but are mutated later (`++`).
 *
 * @param {string} ts
 * @returns {string}
 */
function widenNumericLiteralInstanceProp(ts)
{
  const t = ts.trim();
  if (/^-?\d+(?:\.\d+)?$/.test(t))
  {
    return 'number';
  }
  if (/^-?\d+n$/.test(t))
  {
    return 'bigint';
  }
  return ts;
}

/**
 * Drop numeric literals from a union when `number` is already present (`0 | number` → `number`).
 *
 * @param {string[]} members
 * @returns {string[]}
 */
function collapseNumericLiteralWithNumber(members)
{
  const hasNumber = members.includes('number');
  if (!hasNumber)
  {
    return members;
  }
  return members.filter((m) => /^-?\d+(?:\.\d+)?$/.test(m.trim()) === false);
}

/**
 * Drop boolean literals when `boolean` is already present (`false | boolean` → `boolean`).
 *
 * @param {string[]} members
 * @returns {string[]}
 */
function collapseBoolLiteralWithBoolean(members)
{
  const hasBoolean = members.includes('boolean');
  if (!hasBoolean)
  {
    return members;
  }
  return members.filter((m) => m !== 'true' && m !== 'false');
}

/**
 * Replace generic `object` instance buckets with ambient RPG_* shapes where vanilla uses a stable mutation protocol.
 *
 * @param {string} classPath Engine class path (`Game_Interpreter`, `PluginManager`, …).
 * @param {string} propName Backing field (`_branch`, `_handlers`, …).
 * @param {string} currentTs Merged RHS observation string.
 * @returns {string}
 */
export function refineInstanceBackingFieldTs(classPath, propName, currentTs)
{
  if (currentTs !== 'object')
  {
    return currentTs;
  }

  if (classPath === 'Game_Interpreter' && propName === '_branch')
  {
    return 'RPG_InterpreterBranchMap';
  }

  if (classPath === 'Window_Selectable' && propName === '_handlers')
  {
    return 'RPG_WindowSelectableHandlers';
  }

  if (classPath === 'PluginManager' && propName === '_parameters')
  {
    return 'RPG_PluginParameterRegistry';
  }

  if (classPath === 'PluginManager' && propName === '_commands')
  {
    return 'RPG_PluginCommandRegistry';
  }

  return currentTs;
}

/**
 * Merge RHS observations for instance fields: drop `unknown` when any concrete inference exists
 * (literal vs call-expression on the same prop).
 *
 * @param {string[]} types
 * @returns {string}
 */
export function mergeInstancePropRhsObservations(types)
{
  const filtered = types.filter(Boolean).map(t => t.trim()).filter(Boolean);
  const concrete = filtered.filter(t => t !== 'unknown');
  const chosen = concrete.length > 0 ? concrete : filtered;
  const uniq = [...new Set(chosen)];
  if (uniq.some(t => t === 'unknown'))
  {
    return 'unknown';
  }
  let members = dedupeUnionTypeMembers(uniq);
  members = collapseBoolLiteralWithBoolean(collapseNumericLiteralWithNumber(members));
  if (members.some(t => t === 'unknown'))
  {
    return 'unknown';
  }
  if (members.length === 1)
  {
    return widenNumericLiteralInstanceProp(members[0]);
  }
  if (members.length <= 6)
  {
    return members.join(' | ');
  }
  return 'unknown';
}

/**
 * Depth-first walk over Acorn nodes (skips `loc` / `range` metadata).
 *
 * @param {import('acorn').AnyNode | null | undefined} node
 * @param {(n: import('acorn').AnyNode) => void} visitor
 * @returns {void}
 */
export function walkAstRecursive(node, visitor)
{
  if (!node || typeof node !== 'object')
  {
    return;
  }
  if (typeof node.type === 'string')
  {
    visitor(/** @type {import('acorn').AnyNode} */ (node));
  }
  for (const key of Object.keys(node))
  {
    if (key === 'loc' || key === 'range' || key === 'start' || key === 'end')
    {
      continue;
    }
    const child = /** @type {*} */ (node)[key];
    if (Array.isArray(child))
    {
      for (let i = 0; i < child.length; i++)
      {
        walkAstRecursive(child[i], visitor);
      }
    }
    else if (child && typeof child === 'object' && typeof child.type === 'string')
    {
      walkAstRecursive(child, visitor);
    }
  }
}

/** Numeric compound assigns — RHS inference fills most shapes; `++`/`--` add `number` hints. */
const INSTANCE_PROP_COMPOUND_ASSIGNS = new Set(['+=', '-=', '*=', '/=', '%=', '**=']);

/**
 * Gather `this._prop = rhs`, compound assigns (`+=`, …), logical assigns (`||=`), and `++`/`--` on
 * `this._prop` from one function body; infer RHS types where applicable.
 *
 * @param {import('acorn').FunctionDeclaration |
 *   import('acorn').FunctionExpression |
 *   import('acorn').ArrowFunctionExpression} funcNode
 * @param {InferContext} inferCtx
 * @returns {Map<string, string>}
 */
export function collectThisUnderscorePropsFromFunction(funcNode, inferCtx)
{
  /** @type {Map<string, string[]>} */
  const bucket = new Map();

  /**
   * @param {string} propName
   * @param {string} rhsTs
   * @returns {void}
   */
  function pushProp(propName, rhsTs)
  {
    const arr = bucket.get(propName) ?? [];
    arr.push(rhsTs);
    bucket.set(propName, arr);
  }

  const body = funcNode.body;
  if (!body || body.type !== 'BlockStatement')
  {
    return new Map();
  }

  walkAstRecursive(body, (node) =>
  {
    if (node.type === 'UpdateExpression')
    {
      const arg = node.argument;
      if (
        arg.type === 'MemberExpression'
        && !arg.computed
        && arg.object.type === 'ThisExpression'
        && arg.property.type === 'Identifier'
      )
      {
        const propName = arg.property.name;
        if (propName.startsWith('_'))
        {
          pushProp(propName, 'number');
        }
      }
      return;
    }
    if (node.type !== 'AssignmentExpression')
    {
      return;
    }
    const op = node.operator;
    if (
      op !== '='
      && op !== '||='
      && op !== '&&='
      && op !== '??='
      && !INSTANCE_PROP_COMPOUND_ASSIGNS.has(op)
    )
    {
      return;
    }
    const left = node.left;
    if (left.type !== 'MemberExpression' || left.computed)
    {
      return;
    }
    if (left.object.type !== 'ThisExpression')
    {
      return;
    }
    if (left.property.type !== 'Identifier')
    {
      return;
    }
    const propName = left.property.name;
    if (!propName.startsWith('_'))
    {
      return;
    }
    const rhsTs = inferExprType(node.right, inferCtx) ?? 'unknown';
    pushProp(propName, rhsTs);
  });

  /** @type {Map<string, string>} */
  const out = new Map();
  for (const [k, rhss] of bucket)
  {
    out.set(k, mergeInstancePropRhsObservations(rhss));
  }
  return out;
}

/**
 * A single function's observation of `this._*` usage.
 * - `reads`: `this._x` used as an expression/condition.
 * - `writes`: `this._x = ...`, `this._x += ...`, `this._x++`, etc.
 * - `consumes`: common patterns on the property (shift/pop/length/etc).
 *
 * @typedef {{
 *  reads: Set<string>,
 *  writes: Set<string>,
 *  consumes: Set<string>,
 * }} ThisUnderscoreUsage
 */

/**
 * Collect read/write/consume usage for `this._*` within one function.
 *
 * @param {import('acorn').FunctionDeclaration |
 *   import('acorn').FunctionExpression |
 *   import('acorn').ArrowFunctionExpression} funcNode
 * @returns {Map<string, ThisUnderscoreUsage>}
 */
export function collectThisUnderscoreUsageFromFunction(funcNode)
{
  /** @type {Map<string, ThisUnderscoreUsage>} */
  const out = new Map();

  /**
   * @param {string} propName
   * @returns {ThisUnderscoreUsage}
   */
  function ensure(propName)
  {
    let cur = out.get(propName);
    if (!cur)
    {
      cur = {
        reads: new Set(),
        writes: new Set(),
        consumes: new Set(),
      };
      out.set(propName, cur);
    }
    return cur;
  }

  /**
   * @param {import('acorn').AnyNode | null | undefined} node
   * @param {import('acorn').AnyNode | null} parent
   * @returns {void}
   */
  function walk(node, parent)
  {
    if (!node || typeof node !== 'object')
    {
      return;
    }

    // `this._prop` direct member.
    if (
      node.type === 'MemberExpression'
      && !node.computed
      && node.object.type === 'ThisExpression'
      && node.property.type === 'Identifier'
    )
    {
      const propName = node.property.name;
      if (propName.startsWith('_'))
      {
        const usage = ensure(propName);

        // LHS sites are writes (not reads).
        if (
          parent
          && parent.type === 'AssignmentExpression'
          && /** @type {*} */ (parent).left === node
        )
        {
          usage.writes.add('assign');
        }
        else if (
          parent
          && parent.type === 'UpdateExpression'
          && /** @type {*} */ (parent).argument === node
        )
        {
          usage.writes.add('update');
        }
        else
        {
          usage.reads.add('read');
        }
      }
    }

    // Write operators on `this._prop` (captures `=`, `+=`, `||=`, etc).
    if (node.type === 'AssignmentExpression')
    {
      const left = node.left;
      if (
        left.type === 'MemberExpression'
        && !left.computed
        && left.object.type === 'ThisExpression'
        && left.property.type === 'Identifier'
      )
      {
        const propName = left.property.name;
        if (propName.startsWith('_'))
        {
          ensure(propName).writes.add(node.operator);
        }
      }
    }
    if (node.type === 'UpdateExpression')
    {
      const arg = node.argument;
      if (
        arg.type === 'MemberExpression'
        && !arg.computed
        && arg.object.type === 'ThisExpression'
        && arg.property.type === 'Identifier'
      )
      {
        const propName = arg.property.name;
        if (propName.startsWith('_'))
        {
          ensure(propName).writes.add(node.operator);
        }
      }
    }

    // Consumption patterns: `this._queue.shift()` etc.
    if (
      node.type === 'CallExpression'
      && node.callee
      && node.callee.type === 'MemberExpression'
      && !node.callee.computed
    )
    {
      const callee = node.callee;
      if (
        callee.object.type === 'MemberExpression'
        && !callee.object.computed
        && callee.object.object.type === 'ThisExpression'
        && callee.object.property.type === 'Identifier'
        && callee.property.type === 'Identifier'
      )
      {
        const propName = callee.object.property.name;
        if (propName.startsWith('_'))
        {
          const op = callee.property.name;
          if (['shift', 'pop', 'push', 'unshift', 'splice', 'sort', 'reverse', 'clear'].includes(op))
          {
            ensure(propName).consumes.add(`${op}()`);
          }
        }
      }
    }

    // `.length` checks.
    if (
      node.type === 'MemberExpression'
      && !node.computed
      && node.property.type === 'Identifier'
      && node.property.name === 'length'
    )
    {
      if (
        node.object.type === 'MemberExpression'
        && !node.object.computed
        && node.object.object.type === 'ThisExpression'
        && node.object.property.type === 'Identifier'
      )
      {
        const propName = node.object.property.name;
        if (propName.startsWith('_'))
        {
          ensure(propName).consumes.add('.length');
        }
      }
    }

    // Recurse into children (skip loc/range metadata).
    for (const key of Object.keys(node))
    {
      if (key === 'loc' || key === 'range' || key === 'start' || key === 'end')
      {
        continue;
      }
      const child = /** @type {*} */ (node)[key];
      if (Array.isArray(child))
      {
        for (let i = 0; i < child.length; i++)
        {
          walk(child[i], node);
        }
      }
      else if (child && typeof child === 'object')
      {
        walk(child, node);
      }
    }
  }

  const body = funcNode.body;
  if (!body || body.type !== 'BlockStatement')
  {
    return out;
  }

  walk(body, null);
  return out;
}

/**
 * @param {import('acorn').Function | import('acorn').ArrowFunctionExpression} funcNode
 * @param {InferContext} ctx
 * @returns {string}
 */
function inferReturnFromBody(funcNode, ctx)
{
  /** @type {(import('acorn').Expression | null | undefined)[]} */
  const outs = [];
  if (funcNode.body.type !== 'BlockStatement')
  {
    outs.push(/** @type {*} */ (funcNode.body));
  }
  else
  {
    gatherReturns(funcNode.body, outs);
  }

  if (outs.length === 0)
  {
    return 'void';
  }

  const inferred = outs.map(e => inferExprType(e, ctx));
  const usable = inferred.filter(t => t !== null && t !== undefined);
  if (usable.length === 0)
  {
    return 'unknown';
  }

  return mergeReturnTypes(usable);
}

/**
 * @param {import('acorn').AnyNode[]} params
 * @param {Map<string, string>} jsdocParams
 * @param {InferContext | undefined} inferCtx
 * @returns {string}
 */
function buildParamsTs(params, jsdocParams, inferCtx)
{
  const parts = [];
  for (let i = 0; i < params.length; i++)
  {
    const p = params[i];
    if (p.type === 'Identifier')
    {
      const jt = jsdocParams.get(p.name);
      parts.push(`${safeParam(p.name)}: ${resolveParamTs(jt, p.name, inferCtx)}`);
    }
    else if (p.type === 'AssignmentPattern' && p.left.type === 'Identifier')
    {
      const jt = jsdocParams.get(p.left.name);
      parts.push(`${safeParam(p.left.name)}?: ${resolveParamTs(jt, p.left.name, inferCtx)}`);
    }
    else if (p.type === 'RestElement' && p.argument.type === 'Identifier')
    {
      parts.push(`...${safeParam(p.argument.name)}: unknown[]`);
    }
    else
    {
      parts.push(`arg${i}: unknown`);
    }
  }
  return parts.join(', ');
}

/**
 * Accepts function expressions (including arrows) assigned to prototypes / static bags.
 *
 * @param {import('acorn').FunctionExpression} funcNode
 * @param {string} src
 * @param {number[]} lineStarts
 * @param {{ start: { line: number, column: number } }} stmtLoc
 * @param {InferContext} inferCtx
 * @returns {{ paramsTs: string, returnTs: string, docBlock: string }}
 */
export function buildMethodSignature(funcNode, src, lineStarts, stmtLoc, inferCtx)
{
  const jdText = extractLeadingJsdoc(src, lineStarts, stmtLoc);
  const jd = parseJsdocBlock(jdText);

  const paramsTs = buildParamsTs(funcNode.params, jd.params, inferCtx);

  let returnTs = jd.returns;
  if (returnTs === null || returnTs === undefined || returnTs === '')
  {
    returnTs = inferReturnFromBody(funcNode, inferCtx);
  }

  returnTs = refineReturnTsByMethodName(returnTs, inferCtx);

  const docBlock = buildMethodDocStarLines(jd, funcNode, inferCtx, returnTs);

  return { paramsTs, returnTs, docBlock };
}

/**
 * @param {string} s
 * @returns {string}
 */
function escapeDocStarText(s)
{
  return s.replace(/\*\//g, '*\\/');
}

/**
 * @param {import('acorn').Function | import('acorn').ArrowFunctionExpression} funcNode
 * @returns {string[]}
 */
function collectFormalParamNames(funcNode)
{
  /** @type {string[]} */
  const out = [];
  for (let i = 0; i < funcNode.params.length; i++)
  {
    const p = funcNode.params[i];
    if (p.type === 'Identifier')
    {
      out.push(p.name);
    }
    else if (p.type === 'AssignmentPattern' && p.left.type === 'Identifier')
    {
      out.push(p.left.name);
    }
  }
  return out;
}

/**
 * Only emits when the engine JSDoc actually describes behavior or parameters — no “see source” filler.
 *
 * @param {ReturnType<typeof parseJsdocBlock>} jd
 * @param {import('acorn').Function | import('acorn').ArrowFunctionExpression} funcNode
 * @returns {string}
 */
function buildMethodDocStarLines(jd, funcNode, inferCtx, returnTs)
{
  /** @type {string[]} */
  const starLines = [];

  /**
   * @param {string} methodName
   * @returns {string}
   */
  function methodNameToWords(methodName)
  {
    return methodName
      .replace(/^_+/, '')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .trim()
      .toLowerCase();
  }

  /**
   * @param {string} raw
   * @returns {string}
   */
  function titleFromName(raw)
  {
    const w = methodNameToWords(raw);
    if (!w)
    {
      return 'this action';
    }
    return w;
  }

  if (jd.summary && jd.summary.trim().length > 0)
  {
    starLines.push(` * ${escapeDocStarText(jd.summary.trim())}`);
  }
  else if (inferCtx && inferCtx.methodName)
  {
    const m = inferCtx.methodName;
    const words = titleFromName(m);

    if (/^is[A-Z]/.test(m) || /^can[A-Z]/.test(m) || /^has[A-Z]/.test(m))
    {
      starLines.push(` * Determines whether ${escapeDocStarText(words.replace(/^(is|can|has) /, ''))}.`);
    }
    else if (/^get[A-Z]/.test(m))
    {
      starLines.push(` * Gets ${escapeDocStarText(words.replace(/^get /, ''))}.`);
    }
    else if (/^set[A-Z]/.test(m))
    {
      starLines.push(` * Sets ${escapeDocStarText(words.replace(/^set /, ''))}.`);
    }
    else if (/^clear[A-Z]/.test(m) || /^reset[A-Z]/.test(m))
    {
      starLines.push(` * Clears ${escapeDocStarText(words.replace(/^(clear|reset) /, ''))}.`);
    }
    else if (/^add[A-Z]/.test(m))
    {
      starLines.push(` * Adds ${escapeDocStarText(words.replace(/^add /, ''))}.`);
    }
    else if (/^remove[A-Z]/.test(m))
    {
      starLines.push(` * Removes ${escapeDocStarText(words.replace(/^remove /, ''))}.`);
    }
    else if (/^update[A-Z]/.test(m))
    {
      starLines.push(` * Updates ${escapeDocStarText(words.replace(/^update /, ''))}.`);
    }
    else if (/^make[A-Z]/.test(m) || /^create[A-Z]/.test(m))
    {
      starLines.push(` * Creates ${escapeDocStarText(words.replace(/^(make|create) /, ''))}.`);
    }
    else if (/^init[A-Z]/.test(m) || m === 'initialize')
    {
      starLines.push(` * Initializes ${escapeDocStarText(words.replace(/^(init|initialize) /, ''))}.`);
    }
    else
    {
      if (returnTs && returnTs !== 'void')
      {
        starLines.push(` * Gets ${escapeDocStarText(words)}.`);
      }
      else
      {
        starLines.push(` * Performs ${escapeDocStarText(words)}.`);
      }
    }
  }

  const names = collectFormalParamNames(funcNode);
  for (const pname of names)
  {
    const prose = jd.paramDescriptions.get(pname);
    if (prose && prose.trim().length > 0)
    {
      starLines.push(` * @param ${safeParam(pname)} ${escapeDocStarText(prose.trim())}`);
    }
    else
    {
      starLines.push(` * @param ${safeParam(pname)} ${escapeDocStarText(`The ${pname} parameter.`)}`);
    }
  }

  if (jd.returnsDescription && jd.returnsDescription.trim().length > 0)
  {
    starLines.push(` * @returns ${escapeDocStarText(jd.returnsDescription.trim())}`);
  }
  else if (returnTs && returnTs !== 'void')
  {
    const m = inferCtx && inferCtx.methodName ? inferCtx.methodName : '';
    const boolPrefix = /^is[A-Z]/.test(m) || /^can[A-Z]/.test(m) || /^has[A-Z]/.test(m);
    if (m && boolPrefix && returnTs === 'boolean')
    {
      const words = titleFromName(m).replace(/^(is|can|has) /, '');
      starLines.push(` * @returns True if ${escapeDocStarText(words)}; false otherwise.`);
    }
    else
    {
      starLines.push(' * @returns The result.');
    }
  }

  if (starLines.length === 0)
  {
    return '';
  }

  return starLines.join('\n');
}