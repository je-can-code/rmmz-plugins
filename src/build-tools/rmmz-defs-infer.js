/* eslint-disable complexity -- inference heuristics are inherently branchy */
/* eslint-disable prefer-destructuring */

/**
 * JSDoc + lightweight AST inference for generated RPG MZ .d.ts signatures.
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
 * `setBattleBgm`-style setters: almost always void in vanilla MZ.
 *
 * @param {string} name
 * @returns {boolean}
 */
function looksLikeSetterMethodName(name)
{
  return /^set[A-Z][\w$]*$/.test(name);
}

/**
 * `initEquips`-style initializers (not `initialize`, which is handled by body inference).
 *
 * @param {string} name
 * @returns {boolean}
 */
function looksLikeInitPrefixedMethodName(name)
{
  return /^init[A-Z][\w$]*$/.test(name);
}

/**
 * `clear` or `clearBattleRefreshRequest`-style clears.
 *
 * @param {string} name
 * @returns {boolean}
 */
function looksLikeClearMethodName(name)
{
  return name === 'clear' || /^clear[A-Z][\w$]*$/.test(name);
}

/**
 * `apply` or `applyDamage`-style mutators.
 *
 * @param {string} name
 * @returns {boolean}
 */
function looksLikeApplyMethodName(name)
{
  return name === 'apply' || /^apply[A-Z][\w$]*$/.test(name);
}

/**
 * `actorId`, `weaponId`, etc. — numeric database ids (not `uuid`, which stays inferred separately).
 *
 * @param {string} name
 * @returns {boolean}
 */
function looksLikeIdAccessorName(name)
{
  return /Id$/.test(name);
}

/**
 * Parameter names that almost always carry counts, coordinates, or sizes in MZ engine code.
 *
 * @param {string} name
 * @returns {boolean}
 */
function looksLikeNumericShapeParamName(name)
{
  if (/^[xyz]$/i.test(name))
  {
    return true;
  }
  if (/^(width|height|opacity|speed|volume|pitch|pan|duration|distance|radius)$/i.test(name))
  {
    return true;
  }
  if (/(Index|Offset|Count|Amount|Tile|Layer|Step)$/i.test(name))
  {
    return true;
  }
  return false;
}

/**
 * Parameter names that usually carry human-readable or formula text.
 *
 * @param {string} name
 * @returns {boolean}
 */
function looksLikeTextShapeParamName(name)
{
  if (/(Name|Text|Message|Title|Pattern|Formula|Note|Label)$/i.test(name))
  {
    return true;
  }
  return false;
}

/**
 * Inference tiers (when JSDoc + AST left `unknown`): (1) exact pairs like `Game_Actors.actor`;
 * (2) morphological rules (`is*` → boolean, `*Id` → number); (3) regex families below;
 * (4) `NUMERIC_RETURN_METHOD_EXACT` / future small Sets for one-offs; (5) param rules that may use
 * `inferCtx.methodName` for context (same idea as English collocations — “value” in `gainMp` ≠ “value” in `setValue`).
 *
 * When adding a regex: prefer narrow roots (`tpb`, `effectType`) over loose suffixes ending in `Type`.
 * Grepping vanilla sources under `src/rmmz/` catches false positives before widening a pattern.
 *
 * @type {ReadonlySet<string>}
 */
const NUMERIC_RETURN_METHOD_EXACT = new Set([
  'motionType',
  'numActions',
  'speedModifier',
  'actionPlus',
  'makeActionTimes',
]);

/**
 * Battler param names that mirror `Game_Battler.paramRate` keys — always numeric rates in MZ.
 *
 * @type {ReadonlySet<string>}
 */
const PARAM_NAME_RATE_STYLE = new Set([
  'damageRate',
  'hitRate',
  'evaRate',
  'criRate',
  'cntRate',
  'mrfRate',
  'tgrRate',
  'grdRate',
  'recRate',
  'phaRate',
  'mcrRate',
  'pdrRate',
  'mdrRate',
  'fdrRate',
  'exrRate',
]);

/**
 * Vanilla `$data*` rows surfaced through `Game_Item.object()` / `Game_Action.item()` (MZ naming).
 *
 * @type {string}
 */
const MZ_DATABASE_ENTRY = 'RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null';

/**
 * Audio asset triple stored on `$dataSystem` / `Game_System` custom fields (MZ convention).
 *
 * @type {string}
 */
const MZ_AUDIO_FILE = '{ name: string; pan: number; pitch: number; volume: number }';
const MZ_AUDIO_WITH_POS = '{ name: string; pan: number; pitch: number; volume: number; pos: number }';
const MZ_AUDIO_NO_PAN = '{ name: string; pitch: number; volume: number }';
const MZ_DATABASE_ENTRY_ARRAY = `Array<${MZ_DATABASE_ENTRY}>`;

/**
 * RGB + gray channel tuple used by `Game_Screen` tone / flash helpers (matches MV/MZ screen APIs).
 *
 * @type {string}
 */
const MZ_SCREEN_RGBA = '[number, number, number, number]';

/**
 * `Window_Command.addCommand` extra payload (vanilla rarely uses it; plugins stash handles here).
 *
 * @type {string}
 */
const WINDOW_COMMAND_EXT = 'object | string | number | boolean | null';

/**
 * One entry in `Window_Command.prototype._list` (`addCommand`).
 *
 * @type {string}
 */
const WINDOW_COMMAND_ENTRY =
  `{ name: string; symbol: string; enabled: boolean; ext: ${WINDOW_COMMAND_EXT} }`;

/**
 * Menu windows that call `setActor` with a party `Game_Actor`.
 *
 * @type {RegExp}
 */
const WINDOW_SET_ACTOR_MENU_RX = new RegExp(
  '^Window_(SkillStatus|EquipItem|SkillType|StatusParams|Status|StatusEquip|EquipSlot|EquipStatus|SkillList|ItemList)$',
);

/**
 * `Window_StatusBase.prototype.createInnerSprite` uses `new spriteClass()` (see `Sprite_Name`, …).
 *
 * @type {string}
 */
const SPRITE_SUBCLASS_CONSTRUCTOR = 'new () => Sprite';

/**
 * Scene constructor reference passed to `SceneManager.goto` / `push` / `run`.
 *
 * @type {string}
 */
const SCENE_BASE_CONSTRUCTOR = 'new () => Scene_Base';

/**
 * One shop goods tuple (`Window_ShopBuy.goodsToItem` argument shape).
 *
 * @type {string}
 */
const SHOP_GOODS_ROW = '[number, number, number?, number?]';

/**
 * Full catalog list (`Scene_Shop.prepare`, `Window_ShopBuy.setupGoods`).
 *
 * @type {string}
 */
const SHOP_GOODS_ROWS = `${SHOP_GOODS_ROW}[]`;

/**
 * Values read/written through `ConfigManager[symbol]` from the options window (booleans + numeric volumes).
 *
 * @type {string}
 */
const CONFIG_MANAGER_OPTION_VALUE = 'boolean | number';

/**
 * Shape produced by `ConfigManager.makeData` / consumed by `applyData` (matches save JSON keys).
 *
 * @type {string}
 */
const CONFIG_MANAGER_SAVE_BLOB = [
  '{ alwaysDash: boolean; commandRemember: boolean; touchUI: boolean; ',
  'bgmVolume: number; bgsVolume: number; meVolume: number; seVolume: number }',
].join('');

/**
 * Object.defineProperty bundle from `TextManager.getter` (lazy text lookups).
 *
 * @type {string}
 */
const TEXT_MANAGER_GETTER_DESCRIPTOR = '{ get: () => string; configurable: boolean }';

/**
 * Class paths whose methods commonly take battlers (`subject`, `target`, …).
 *
 * @type {RegExp}
 */
const BATTLE_RELATED_CLASS_RE = new RegExp(
  [
    'Battle',
    'Battler',
    'Party',
    'Troop',
    'Damage',
    'Sprite_Battler',
    'Spriteset_Battle',
    'Scene_Battle',
    'Window_Battle',
    'BattleManager',
  ].join('|'),
);

/**
 * `Game_Action` helpers returning scalars (`evaluate`, `itemHit`, …).
 *
 * @type {ReadonlySet<string>}
 */
const GAME_ACTION_SCALAR_NUMBER_RETURN = new Set([
  'evaluate',
  'evaluateWithTarget',
  'evalDamageFormula',
  'itemHit',
  'calcElementRate',
  'elementsMaxRate',
  'lukEffectRate',
  'makeDamageValue',
  'speed',
]);

/**
 * `Game_Action` predicates (`checkDamageType`, …).
 *
 * @type {ReadonlySet<string>}
 */
const GAME_ACTION_BOOLEAN_RETURN = new Set([
  'checkDamageType',
  'checkItemScope',
  'needsSelection',
]);

/**
 * `Game_Action` helpers returning battler arrays (`makeTargets`, `targetsForEveryone`, …).
 *
 * @type {ReadonlySet<string>}
 */
const GAME_ACTION_BATTLER_ARRAY_RETURN = new Set([
  'itemTargetCandidates',
  'makeTargets',
  'randomTargets',
  'repeatTargets',
  'targetsForAlive',
  'targetsForDead',
  'targetsForDeadAndAlive',
  'targetsForEveryone',
  'targetsForFriends',
  'targetsForOpponents',
]);

/**
 * Scroll-layer XY helpers (`Game_Map.displayX`, `Window_Scrollable.scrollX`, …).
 *
 * @param {string} name
 * @returns {boolean}
 */
function looksLikeNumericSpatialScrollReturn(name)
{
  return /^(scroll(Base)?[XY]|overall(Width|Height)|scrollBlock(Width|Height))$/i.test(name)
    || /^(display[XY]|adjust[XY]|canvasToMap[XY]|delta[XY]|distance)$/.test(name)
    || /^round[XY](WithDirection)?$/i.test(name)
    || /^(screenTile[XY]|scrollDistance|xWithDirection|yWithDirection)$/i.test(name)
    || /^newLineX$/i.test(name)
    || /^savefileIdToIndex$/i.test(name);
}

/**
 * Character / battler geometry getters (`Game_CharacterBase.direction`, `jumpHeight`, …).
 *
 * @param {string} name
 * @returns {boolean}
 */
function looksLikeCharacterMovementReturn(name)
{
  return /^(direction|moveSpeed|moveFrequency|blendMode|characterIndex|animationWait)$/.test(name)
    || /^distancePerFrame$/.test(name)
    || /^(jumpHeight|realMoveSpeed|terrainTag|screenZ|scrolled[XY])$/.test(name)
    || /^reverseDir$/i.test(name)
    || /^bushDepth$/i.test(name);
}

/**
 * Scene/window layout helpers (`Scene_Base.buttonY`, `Window_Selectable.itemHeight`, …).
 *
 * @param {string} name
 * @returns {boolean}
 */
function looksLikeSceneLayoutMetricReturn(name)
{
  return /^(slowFadeSpeed|buttonAreaBottom|buttonY|calcWindowHeight|itemHeight)$/i.test(name);
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
 * Text metrics for `Window_Base.textSizeEx`.
 *
 * @type {string}
 */
const RMMZ_TEXT_SIZE = '{ width: number; height: number }';

/**
 * Loose textState bag used across `Window_Base` text processing.
 *
 * @type {string}
 */
const RMMZ_TEXT_STATE = [
  '{ text: string; index: number; x: number; y: number; width: number; height: number }',
  '& Record<string, object | number | string | boolean>',
].join(' ');

/**
 * After morphological rules: engine-class singleton overrides grounded in `project/js/rmmz_*.js`.
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
  const allowPromiseRefinement = cls === 'StorageManager' && currentTs === 'Promise';

  // Include `void` so we can correct mistaken empty-body / unreachable-return inference (e.g. numeric easing helpers).
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

  switch (cls)
  {
    case 'SceneManager':
      if (n === 'snap')
      {
        return 'Bitmap';
      }
      if (n === 'backgroundBitmap')
      {
        return 'Bitmap | null';
      }
      return null;

    case 'EffectManager':
      if (n === 'makeUrl')
      {
        return 'string';
      }
      if (n === 'startLoading')
      {
        return 'object';
      }
      return null;

    case 'ConfigManager':
      if (n === 'makeData')
      {
        return CONFIG_MANAGER_SAVE_BLOB;
      }
      return null;

    case 'TextManager':
      if (n === 'basic' || n === 'param' || n === 'command' || n === 'message')
      {
        return 'string';
      }
      if (n === 'getter')
      {
        return TEXT_MANAGER_GETTER_DESCRIPTOR;
      }
      return null;

    case 'FontManager':
      if (n === 'makeUrl')
      {
        return 'string';
      }
      return null;

    case 'ColorManager':
      if (n === 'damageColor')
      {
        return 'string';
      }
      if (n === 'loadWindowskin')
      {
        return 'void';
      }
      return 'number';

    case 'Game_System':
      if (
        n === 'battleBgm'
        || n === 'defeatMe'
        || n === 'victoryMe'
      )
      {
        return MZ_AUDIO_FILE;
      }
      if (n === 'windowTone')
      {
        return '[number, number, number, number]';
      }
      if (
        n === 'mainFontFace'
        || n === 'numberFontFace'
        || n === 'playtimeText'
      )
      {
        return 'string';
      }
      if (
        n === 'battleCount'
        || n === 'escapeCount'
        || n === 'saveCount'
        || n === 'winCount'
        || n === 'playtime'
        || n === 'mainFontSize'
        || n === 'windowOpacity'
      )
      {
        return 'number';
      }
      return null;

    case 'Game_Party':
      if (n === 'leader' || n === 'menuActor' || n === 'targetActor')
      {
        return 'Game_Actor | undefined';
      }
      if (
        n === 'members'
        || n === 'battleMembers'
        || n === 'allMembers'
        || n === 'allBattleMembers'
        || n === 'hiddenBattleMembers'
      )
      {
        return 'Game_Actor[]';
      }
      if (n === 'items')
      {
        return 'RPG_Item[]';
      }
      if (n === 'weapons')
      {
        return 'RPG_Weapon[]';
      }
      if (n === 'armors')
      {
        return 'RPG_Armor[]';
      }
      if (n === 'equipItems' || n === 'allItems')
      {
        return '(RPG_Item | RPG_Weapon | RPG_Armor)[]';
      }
      if (n === 'gold' || n === 'size' || n === 'highestLevel')
      {
        return 'number';
      }
      if (n === 'lastItem')
      {
        return MZ_DATABASE_ENTRY;
      }
      if (n === 'canInput' || n === 'canUse' || n === 'partyAbility')
      {
        return 'boolean';
      }
      if (n === 'ratePreemptive' || n === 'rateSurprise')
      {
        return 'number';
      }
      if (n === 'charactersForSavefile' || n === 'facesForSavefile')
      {
        return '[string, number][]';
      }
      return null;

    case 'Game_Map':
      if (n === 'airship' || n === 'boat' || n === 'ship')
      {
        return 'Game_Vehicle';
      }
      if (n === 'events')
      {
        return 'Game_Event[]';
      }
      if (n === 'vehicles')
      {
        return 'Game_Vehicle[]';
      }
      if (n === 'tileset')
      {
        return 'object | undefined';
      }
      if (n === 'encounterList')
      {
        return 'object[]';
      }
      if (n === 'encounterStep')
      {
        return 'number';
      }
      if (n === 'autorunCommonEvents' || n === 'parallelCommonEvents')
      {
        return 'object[]';
      }
      if (n === 'eventsXy' || n === 'eventsXyNt' || n === 'tileEventsXy')
      {
        return 'Game_Event[]';
      }
      if (n === 'layeredTiles' || n === 'allTiles')
      {
        return 'number[]';
      }
      if (n === 'checkLayeredTilesFlags')
      {
        return 'boolean';
      }
      if (n === 'data')
      {
        return 'number[]';
      }
      if (n === 'tilesetFlags')
      {
        return 'number[]';
      }
      return null;

    case 'Game_Battler':
      if (n === 'currentAction' || n === 'action')
      {
        return 'Game_Action | undefined';
      }
      if (n === 'result')
      {
        return 'Game_ActionResult';
      }
      return null;

    case 'Game_Action':
      if (n === 'item')
      {
        return MZ_DATABASE_ENTRY;
      }
      if (n === 'subject')
      {
        return 'Game_Battler';
      }
      if (n === 'friendsUnit' || n === 'opponentsUnit')
      {
        return 'Game_Unit';
      }
      if (n === 'confusionTarget')
      {
        return 'Game_Battler | null';
      }
      if (GAME_ACTION_SCALAR_NUMBER_RETURN.has(n))
      {
        return 'number';
      }
      if (GAME_ACTION_BOOLEAN_RETURN.has(n))
      {
        return 'boolean';
      }
      if (GAME_ACTION_BATTLER_ARRAY_RETURN.has(n))
      {
        return 'Game_Battler[]';
      }
      return null;

    case 'Sprite_Damage':
      if (n === 'createBitmap' || n === 'createChildSprite')
      {
        return 'Bitmap';
      }
      if (n === 'damageColor' || n === 'fontSize' || n === 'outlineWidth')
      {
        return 'number';
      }
      if (n === 'fontFace' || n === 'outlineColor')
      {
        return 'string';
      }
      return null;

    case 'Scene_File':
      if (n === 'needsAutosave')
      {
        return 'boolean';
      }
      return null;

    case 'Scene_MenuBase':
      if (n === 'actor')
      {
        return 'Game_Actor';
      }
      if (
        n === 'helpAreaBottom'
        || n === 'helpAreaHeight'
        || n === 'mainAreaBottom'
        || n === 'mainAreaHeight'
      )
      {
        return 'number';
      }
      return null;

    case 'Scene_Battle':
      if (n === 'actorWindowRect' || n === 'itemWindowRect')
      {
        return 'Rectangle';
      }
      if (
        n === 'buttonAreaTop'
        || n === 'helpAreaBottom'
        || n === 'helpAreaHeight'
        || n === 'statusWindowX'
        || n === 'windowAreaHeight'
      )
      {
        return 'number';
      }
      if (n === 'needsSlowFadeOut' || n === 'shouldAutosave')
      {
        return 'boolean';
      }
      return null;

    case 'Scene_Map':
      if (n === 'needsFadeIn' || n === 'needsSlowFadeOut')
      {
        return 'boolean';
      }
      return null;

    case 'Scene_Shop':
      if (n === 'buyingPrice' || n === 'money' || n === 'sellingPrice')
      {
        return 'number';
      }
      if (n === 'currencyUnit')
      {
        return 'string';
      }
      return null;

    case 'Window_ShopBuy':
      if (n === 'goodsToItem' || n === 'item' || n === 'itemAt')
      {
        return MZ_DATABASE_ENTRY;
      }
      if (n === 'price')
      {
        return 'number';
      }
      return null;

    case 'Window_ShopNumber':
      if (n === 'itemRect')
      {
        return 'Rectangle';
      }
      if (
        n === 'cursorWidth'
        || n === 'cursorX'
        || n === 'itemNameY'
        || n === 'multiplicationSignX'
        || n === 'number'
        || n === 'totalButtonWidth'
        || n === 'totalPriceY'
      )
      {
        return 'number';
      }
      return null;

    case 'Window_Options':
      if (n === 'getConfigValue')
      {
        return CONFIG_MANAGER_OPTION_VALUE;
      }
      if (n === 'statusText' || n === 'volumeStatusText' || n === 'booleanStatusText')
      {
        return 'string';
      }
      return null;

    case 'Input':
      if (n === '_signX' || n === '_signY')
      {
        return 'number';
      }
      return null;

    case 'Window_BattleLog':
      if (n === 'updateWait' || n === 'updateWaitMode')
      {
        return 'boolean';
      }
      if (n === 'makeHpDamageText')
      {
        return 'string';
      }
      return null;

    case 'Window_Base':
      if (n === 'baseTextRect')
      {
        return 'Rectangle';
      }
      if (n === 'calcTextHeight' || n === 'contentsHeight' || n === 'contentsWidth' || n === 'fittingHeight')
      {
        return 'number';
      }
      if (n === 'convertEscapeCharacters')
      {
        return 'string';
      }
      if (n === 'createTextBuffer')
      {
        return 'string';
      }
      if (n === 'createTextState')
      {
        return RMMZ_TEXT_STATE;
      }
      if (n === 'drawTextEx')
      {
        return 'number';
      }
      if (n === 'systemColor' || n === 'changeTextColor' || n === 'changeOutlineColor')
      {
        return 'string';
      }
      if (n === 'textWidth')
      {
        return 'number';
      }
      if (n === 'textSizeEx')
      {
        return RMMZ_TEXT_SIZE;
      }
      if (n === 'itemWidth')
      {
        return 'number';
      }
      return null;

    case 'Window_Selectable':
      if (n === 'contentsHeight' || n === 'itemWidth')
      {
        return 'number';
      }
      if (n === 'cursorAll' || n === 'cursorFixed')
      {
        return 'boolean';
      }
      if (n === 'row' || n === 'topIndex' || n === 'topRow' || n === 'hitIndex')
      {
        return 'number';
      }
      if (n === 'itemRectWithPadding' || n === 'itemLineRect')
      {
        return 'Rectangle';
      }
      if (n === 'processHandling')
      {
        return 'boolean';
      }
      return null;

    case 'Window_StatusBase':
      if (n === 'createInnerSprite')
      {
        return 'Sprite';
      }
      if (n === 'actorSlotName')
      {
        return 'string';
      }
      if (n === 'gaugeLineHeight')
      {
        return 'number';
      }
      return null;

    case 'Window_Command':
      if (n === 'currentData')
      {
        return `${WINDOW_COMMAND_ENTRY} | null`;
      }
      if (n === 'currentSymbol')
      {
        return 'string | null';
      }
      if (n === 'currentExt')
      {
        return `${WINDOW_COMMAND_EXT} | null`;
      }
      if (n === 'commandSymbol' || n === 'commandName')
      {
        return 'string';
      }
      if (n === 'findSymbol' || n === 'findExt')
      {
        return 'number';
      }
      return null;

    case 'Sprite_Character':
      if (
        n === 'characterPatternX'
        || n === 'characterPatternY'
        || n === 'patternWidth'
        || n === 'patternHeight'
      )
      {
        return 'number';
      }
      if (n === 'tilesetBitmap')
      {
        return 'Bitmap';
      }
      return null;

    case 'Spriteset_Base':
      if (n === 'animationShouldMirror')
      {
        return 'boolean';
      }
      if (n === 'makeTargetSprites')
      {
        return 'Sprite[]';
      }
      if (n === 'lastAnimationSprite')
      {
        return 'Sprite | undefined';
      }
      return null;

    case 'Spriteset_Map':
      if (n === 'findTargetSprite')
      {
        return 'Sprite_Character | undefined';
      }
      return null;

    case 'Spriteset_Battle':
      if (n === 'findTargetSprite')
      {
        return 'Sprite | undefined';
      }
      if (n === 'battlerSprites')
      {
        return 'Sprite[]';
      }
      if (n === 'compareEnemySprite')
      {
        return 'number';
      }
      return null;

    case 'Sprite_Animation':
      if (n === 'targetPosition' || n === 'targetSpritePosition')
      {
        return 'Point';
      }
      return null;

    case 'Sprite_AnimationMV':
      if (n === 'absoluteX' || n === 'absoluteY' || n === 'currentFrameIndex')
      {
        return 'number';
      }
      return null;

    case 'Sprite_Clickable':
      if (n === 'hitTest')
      {
        return 'boolean';
      }
      return null;

    case 'Sprite_StateIcon':
      if (n === 'shouldDisplay')
      {
        return 'boolean';
      }
      return null;

    case 'Sprite_Gauge':
      if (n === 'flashingColor1' || n === 'flashingColor2')
      {
        return MZ_SCREEN_RGBA;
      }
      if (n === 'labelColor')
      {
        return 'string';
      }
      return null;

    case 'Sprite_Picture':
      if (n === 'picture')
      {
        return 'Game_Picture | null';
      }
      return null;

    case 'Sprite_Actor':
      if (n === 'damageOffsetX' || n === 'damageOffsetY')
      {
        return 'number';
      }
      if (n === 'mainSprite')
      {
        return 'Sprite';
      }
      if (n === 'shouldStepForward')
      {
        return 'boolean';
      }
      return null;

    case 'Sprite_Enemy':
      if (n === 'damageOffsetX' || n === 'damageOffsetY')
      {
        return 'number';
      }
      return null;

    case 'Sprite_Name':
      if (n === 'fontFace' || n === 'textColor' || n === 'outlineColor')
      {
        return 'string';
      }
      if (n === 'fontSize')
      {
        return 'number';
      }
      return null;

    case 'Sprite_Timer':
      if (n === 'fontFace' || n === 'timerText')
      {
        return 'string';
      }
      if (n === 'fontSize')
      {
        return 'number';
      }
      return null;

    case 'Sprite_Battleback':
      if (n === 'autotileType')
      {
        return 'number';
      }
      if (n === 'battleback1Bitmap' || n === 'battleback2Bitmap')
      {
        return 'Bitmap';
      }
      return null;

    case 'Sprite_Button':
      if (n === 'buttonData')
      {
        return 'object';
      }
      return null;

    case 'Graphics':
      if (n === '_stretchWidth' || n === '_stretchHeight')
      {
        return 'number';
      }
      if (n === '_defaultStretchMode' || n === '_isFullScreen')
      {
        return 'boolean';
      }
      if (n === '_makeErrorHtml')
      {
        return 'string';
      }
      if (n === 'setTickHandler' || n === 'showRetryButton')
      {
        return 'void';
      }
      return null;

    case 'Game_BattlerBase':
      if (
        n === 'actionPlusSet'
        || n === 'addedSkillTypes'
        || n === 'addedSkills'
        || n === 'stateResistSet'
        || n === 'attackElements'
        || n === 'attackStates'
        || n === 'stateIcons'
        || n === 'buffIcons'
      )
      {
        return 'number[]';
      }
      if (n === 'states')
      {
        return 'RPG_State[]';
      }
      if (n === 'allIcons')
      {
        return 'number[]';
      }
      if (n === 'traitObjects')
      {
        return 'RPG_State[]';
      }
      if (n === 'allTraits' || n === 'traits' || n === 'traitsWithId')
      {
        return 'object[]';
      }
      if (n === 'traitsSet')
      {
        return 'number[]';
      }
      if (
        n === 'attackSpeed'
        || n === 'attackStatesRate'
        || n === 'attackTimesAdd'
        || n === 'debuffRate'
        || n === 'elementRate'
        || n === 'hpRate'
        || n === 'tpRate'
        || n === 'param'
        || n === 'paramBasePlus'
        || n === 'paramBuffRate'
        || n === 'paramPlus'
        || n === 'paramRate'
        || n === 'sparam'
        || n === 'xparam'
        || n === 'specialFlag'
        || n === 'stateRate'
        || n === 'traitsPi'
        || n === 'traitsSum'
        || n === 'traitsSumAll'
      )
      {
        return 'number';
      }
      if (
        n === 'buff'
        || n === 'buffLength'
        || n === 'paramMax'
        || n === 'restriction'
      )
      {
        return 'number';
      }
      if (n === 'partyAbility' || n === 'meetsItemConditions' || n === 'meetsUsableItemConditions')
      {
        return 'boolean';
      }
      if (n === 'canAttack' || n === 'canGuard')
      {
        return 'boolean';
      }
      if (n === 'skillMpCost' || n === 'skillTpCost')
      {
        return 'number';
      }
      if (n === 'setTp')
      {
        return 'void';
      }
      return null;

    case 'Game_Actor':
      if (n === 'actor')
      {
        return 'RPG_Actor';
      }
      if (n === 'attackElements')
      {
        return 'number[]';
      }
      if (n === 'armors')
      {
        return 'RPG_Armor[]';
      }
      if (n === 'weapons')
      {
        return 'RPG_Weapon[]';
      }
      if (n === 'equips')
      {
        return MZ_DATABASE_ENTRY_ARRAY;
      }
      if (n === 'equipSlots')
      {
        return 'number[]';
      }
      if (n === 'currentClass')
      {
        return 'RPG_Class';
      }
      if (n === 'skills' || n === 'usableSkills')
      {
        return 'RPG_Skill[]';
      }
      if (n === 'skillTypes')
      {
        return 'number[]';
      }
      if (n === 'profile')
      {
        return 'string';
      }
      if (n === 'nickname')
      {
        return 'string';
      }
      if (n === 'faceIndex')
      {
        return 'number';
      }
      if (
        n === 'currentExp'
        || n === 'currentLevelExp'
        || n === 'nextLevelExp'
        || n === 'nextRequiredExp'
        || n === 'expForLevel'
      )
      {
        return 'number';
      }
      if (n === 'gainExp')
      {
        return 'void';
      }
      if (n === 'makeActionList')
      {
        return 'Game_Action[]';
      }
      if (n === 'findNewSkills')
      {
        return 'RPG_Skill[]';
      }
      if (n === 'displayLevelUp')
      {
        return 'void';
      }
      if (n === 'inputtingAction' || n === 'lastSkill' || n === 'lastBattleSkill' || n === 'lastMenuSkill')
      {
        return MZ_DATABASE_ENTRY;
      }
      if (n === 'lastCommandSymbol')
      {
        return 'string';
      }
      if (n === 'friendsUnit' || n === 'opponentsUnit')
      {
        return 'Game_Unit';
      }
      if (n === 'finalExpRate' || n === 'testEscape')
      {
        return n === 'finalExpRate' ? 'number' : 'boolean';
      }
      if (n === 'paramBase' || n === 'paramPlus')
      {
        return 'number';
      }
      if (n === 'releaseUnequippableItems')
      {
        return 'void';
      }
      if (n === 'tradeItemWithParty')
      {
        return 'boolean';
      }
      if (n === 'traitObjects')
      {
        return 'object[]';
      }
      if (n === 'updateStateSteps')
      {
        return 'void';
      }
      if (n === 'bestEquipItem')
      {
        return 'RPG_Weapon | RPG_Armor | null';
      }
      if (n === 'calcEquipItemPerformance')
      {
        return 'number';
      }
      return null;

    case 'Game_Enemy':
      if (n === 'enemy')
      {
        return 'RPG_Enemy';
      }
      if (n === 'battlerHue' || n === 'exp' || n === 'gold' || n === 'paramBase')
      {
        return 'number';
      }
      if (n === 'friendsUnit')
      {
        return 'Game_Troop';
      }
      if (n === 'opponentsUnit')
      {
        return 'Game_Party';
      }
      if (n === 'makeDropItems')
      {
        return MZ_DATABASE_ENTRY_ARRAY;
      }
      if (n === 'traitObjects')
      {
        return 'object[]';
      }
      if (n === 'meetsStateCondition' || n === 'meetsSwitchCondition')
      {
        return 'boolean';
      }
      if (n === 'selectAction')
      {
        return 'object | null';
      }
      if (n === 'itemObject')
      {
        return MZ_DATABASE_ENTRY;
      }
      return null;

    case 'Game_Player':
      if (n === 'areFollowersGathered' || n === 'areFollowersGathering')
      {
        return 'boolean';
      }
      if (n === 'center')
      {
        return 'void';
      }
      if (n === 'centerX' || n === 'centerY' || n === 'encounterProgressValue' || n === 'fadeType')
      {
        return 'number';
      }
      if (n === 'followers')
      {
        return 'Game_Followers';
      }
      if (n === 'getInputDirection')
      {
        return 'number';
      }
      if (n === 'getOffVehicle' || n === 'getOnVehicle' || n === 'getOnOffVehicle' || n === 'triggerTouchActionD3')
      {
        return 'boolean';
      }
      if (n === 'vehicle')
      {
        return 'Game_Vehicle | null';
      }
      return null;

    case 'Game_Picture':
      if (
        n === 'angle'
        || n === 'origin'
        || n === 'scaleX'
        || n === 'scaleY'
      )
      {
        return 'number';
      }
      if (n === 'tone')
      {
        return `${MZ_SCREEN_RGBA} | null`;
      }
      if (
        n === 'calcEasing'
        || n === 'easeIn'
        || n === 'easeOut'
        || n === 'easeInOut'
      )
      {
        return 'number';
      }
      if (n === 'applyEasing')
      {
        return 'number';
      }
      return null;

    case 'Game_Message':
      if (n === 'allText')
      {
        return 'string';
      }
      if (
        n === 'background'
        || n === 'choiceBackground'
        || n === 'choiceCancelType'
        || n === 'choiceDefaultType'
        || n === 'choicePositionType'
        || n === 'positionType'
      )
      {
        return 'number';
      }
      if (n === 'choices')
      {
        return 'string[]';
      }
      if (n === 'faceIndex')
      {
        return 'number';
      }
      if (n === 'scrollMode' || n === 'scrollNoFast')
      {
        return 'boolean';
      }
      if (n === 'scrollSpeed')
      {
        return 'number';
      }
      return null;

    case 'Game_Screen':
      if (
        n === 'brightness'
        || n === 'shake'
        || n === 'zoomX'
        || n === 'zoomY'
        || n === 'zoomScale'
        || n === 'weatherPower'
      )
      {
        return 'number';
      }
      if (n === 'tone' || n === 'flashColor')
      {
        return MZ_SCREEN_RGBA;
      }
      if (n === 'weatherType')
      {
        return 'string';
      }
      if (n === 'picture')
      {
        return 'Game_Picture | null | undefined';
      }
      return null;

    case 'Game_Temp':
      if (n === 'destinationX' || n === 'destinationY')
      {
        return 'number | null';
      }
      if (n === 'lastActionData')
      {
        return 'number';
      }
      if (n === 'retrieveAnimation' || n === 'retrieveBalloon')
      {
        return 'object | undefined';
      }
      if (n === 'retrieveCommonEvent')
      {
        return 'object | null | undefined';
      }
      if (n === 'touchTarget')
      {
        return 'Game_CharacterBase | null';
      }
      if (n === 'touchState')
      {
        return 'string';
      }
      return null;

    case 'Game_Interpreter':
      if (n === 'currentCommand')
      {
        return `${RMMZ_EVENT_COMMAND} | undefined`;
      }
      if (n === 'character')
      {
        return 'Game_Character | null | undefined';
      }
      if (n === 'operateValue')
      {
        return 'number';
      }
      if (n === 'picturePoint')
      {
        return 'Point';
      }
      if (n === 'updateWait' || n === 'updateWaitMode')
      {
        return 'boolean';
      }
      return null;

    case 'StorageManager':
      if (n === 'fileDirectoryPath' || n === 'filePath' || n === 'forageKey' || n === 'forageTestKey')
      {
        return 'string';
      }
      if (n === 'forageKeysUpdated')
      {
        return 'boolean';
      }
      if (n === 'forageExists' || n === 'localFileExists' || n === 'exists')
      {
        return 'boolean';
      }
      if (n === 'saveObject' || n === 'saveZip' || n === 'saveToForage' || n === 'saveToLocalFile')
      {
        return 'Promise<void>';
      }
      if (n === 'loadZip' || n === 'loadFromLocalFile' || n === 'loadFromForage')
      {
        return 'Promise<string>';
      }
      if (n === 'objectToJson' || n === 'zipToJson')
      {
        return 'Promise<string>';
      }
      if (n === 'jsonToZip')
      {
        return 'Promise<string>';
      }
      if (n === 'jsonToObject' || n === 'loadObject')
      {
        return 'Promise<object>';
      }
      if (n === 'removeForage' || n === 'updateForageKeys')
      {
        return 'Promise<number>';
      }
      if (n === 'remove')
      {
        return 'void | Promise<number>';
      }
      if (n === 'removeLocalFile')
      {
        return 'void';
      }
      if (n === 'fsReadFile')
      {
        return 'string | null';
      }
      return null;

    case 'AudioManager':
      if (n === 'createBuffer')
      {
        return 'WebAudio';
      }
      if (n === 'makeEmptyAudioObject')
      {
        return MZ_AUDIO_NO_PAN;
      }
      if (n === 'saveBgm' || n === 'saveBgs')
      {
        return MZ_AUDIO_WITH_POS;
      }
      return null;

    case 'WebAudio':
      if (n === '_readFourCharacters')
      {
        return 'string';
      }
      if (n === '_readableBuffer')
      {
        return 'ArrayBuffer';
      }
      if (n === '_realUrl')
      {
        return 'string';
      }
      return null;

    case 'BattleManager':
      if (n === 'actor')
      {
        return 'Game_Actor | null';
      }
      if (n === 'allBattleMembers')
      {
        return 'Game_Battler[]';
      }
      if (n === 'canEscape' || n === 'canLose')
      {
        return 'boolean';
      }
      if (n === 'processEscape')
      {
        return 'boolean';
      }
      if (n === 'ratePreemptive' || n === 'rateSurprise')
      {
        return 'number';
      }
      if (n === 'inputtingAction')
      {
        return 'Game_Action | null';
      }
      if (n === 'getNextSubject')
      {
        return 'Game_Battler | null';
      }
      return null;

    case 'DataManager':
      if (n === 'savefileExists')
      {
        return 'boolean';
      }
      if (n === 'savefileInfo')
      {
        return 'object | null';
      }
      if (n === 'makeSavefileInfo')
      {
        return 'object';
      }
      if (n === 'makeSaveContents')
      {
        return 'object';
      }
      if (n === 'saveGame' || n === 'loadGame')
      {
        return 'Promise<number>';
      }
      return null;

    case 'ImageManager':
      if (n === 'getFaceSize' || n === 'getIconSize')
      {
        return 'number';
      }
      if (n.startsWith('load'))
      {
        return 'Bitmap';
      }
      if (n === 'loadBitmap' || n === 'loadBitmapFromUrl')
      {
        return 'Bitmap';
      }
      return null;

    case 'Game_Unit':
      if (n === 'agility' || n === 'tgrSum')
      {
        return 'number';
      }
      if (n === 'inBattle')
      {
        return 'boolean';
      }
      if (n === 'members' || n === 'aliveMembers' || n === 'deadMembers' || n === 'movableMembers')
      {
        return 'Game_Battler[]';
      }
      if (n === 'randomTarget' || n === 'randomDeadTarget')
      {
        return 'Game_Battler | null';
      }
      if (n === 'smoothTarget' || n === 'smoothDeadTarget')
      {
        return 'Game_Battler | undefined';
      }
      if (n === 'substituteBattler')
      {
        return 'Game_Battler | null';
      }
      return null;

    case 'Tilemap':
      if (n === '_compareChildOrder')
      {
        return 'number';
      }
      if (n === '_isHigherTile' || n === '_isTableTile')
      {
        return 'number';
      }
      if (n === 'getAutotileKind' || n === 'getAutotileShape' || n === 'makeAutotileId')
      {
        return 'number';
      }
      if (n === 'isSameKindTile')
      {
        return 'boolean';
      }
      return null;

    case 'PluginManager':
      if (n === 'makeUrl')
      {
        return 'string';
      }
      if (n === 'parameters')
      {
        return 'object';
      }
      return null;

    case 'Tilemap.Layer':
    case 'Tilemap.CombinedLayer':
      if (n === 'size')
      {
        return 'number';
      }
      return null;

    case 'Tilemap.Renderer':
      if (n === 'getShader')
      {
        return 'PIXI.Shader';
      }
      return null;

    case 'Window':
      if (n === '_makeCursorAlpha')
      {
        return 'number';
      }
      return null;

    case 'Array':
      if (n === 'clone' || n === 'remove')
      {
        return 'any[]';
      }
      return null;

    case 'Utils':
      if (n === 'containsArabic')
      {
        return 'boolean';
      }
      return null;

    case 'JsonEx':
      if (n === '_decode' || n === '_encode')
      {
        return 'object';
      }
      return null;

    case 'Bitmap':
      if (n === '_makeFontNameText')
      {
        return 'string';
      }
      return null;

    case 'Sprite':
      if (n === 'getBlendColor' || n === 'getColorTone')
      {
        return MZ_SCREEN_RGBA;
      }
      return null;

    case 'ColorFilter':
      if (n === '_fragmentSrc')
      {
        return 'string';
      }
      return null;

    case 'Game_SelfSwitches':
      if (n === 'value')
      {
        return 'boolean';
      }
      return null;

    case 'Game_Variables':
      if (n === 'value')
      {
        return 'number';
      }
      return null;

    case 'Game_Character':
      if (n === 'deltaXFrom' || n === 'deltaYFrom')
      {
        return 'number';
      }
      return null;

    case 'Game_Timer':
      if (n === 'seconds')
      {
        return 'number';
      }
      return null;

    case 'Game_CommonEvent':
      if (n === 'event')
      {
        return 'object';
      }
      if (n === 'list')
      {
        return RMMZ_EVENT_COMMAND_LIST;
      }
      return null;

    case 'Game_Event':
      if (n === 'event' || n === 'page')
      {
        return 'object';
      }
      if (n === 'list')
      {
        return RMMZ_EVENT_COMMAND_LIST;
      }
      if (n === 'stopCountThreshold')
      {
        return 'number';
      }
      return null;

    case 'Game_Troop':
      if (n === 'enemyNames')
      {
        return 'string[]';
      }
      if (n === 'expTotal' || n === 'goldTotal')
      {
        return 'number';
      }
      if (n === 'letterTable')
      {
        return 'string[][]';
      }
      if (n === 'makeDropItems')
      {
        return 'RPG_Item[]';
      }
      if (n === 'members')
      {
        return 'Game_Enemy[]';
      }
      if (n === 'troop')
      {
        return 'object';
      }
      return null;

    case 'Game_Followers':
      if (n === 'areGathered' || n === 'areGathering' || n === 'areMoving')
      {
        return 'boolean';
      }
      if (n === 'data' || n === 'reverseData')
      {
        return 'Game_Follower[]';
      }
      if (n === 'follower')
      {
        return 'Game_Follower';
      }
      if (n === 'visibleFollowers')
      {
        return 'Game_Follower[]';
      }
      return null;

    case 'Game_Follower':
      if (n === 'actor')
      {
        return 'Game_Actor';
      }
      return null;

    case 'Game_Vehicle':
      if (n === 'shadowOpacity' || n === 'shadowX' || n === 'shadowY')
      {
        return 'number';
      }
      return null;

    case 'Game_ActionResult':
      if (n === 'addedStateObjects' || n === 'removedStateObjects')
      {
        return 'RPG_State[]';
      }
      return null;

    case 'Window_MenuStatus':
      if (n === 'actor')
      {
        return 'Game_Actor | undefined';
      }
      if (n === 'formationMode')
      {
        return 'boolean';
      }
      if (n === 'pendingIndex')
      {
        return 'number';
      }
      return null;

    case 'Window_BattleStatus':
      if (n === 'actor')
      {
        return 'Game_Actor | undefined';
      }
      if (n === 'faceRect')
      {
        return 'Rectangle';
      }
      if (
        n === 'basicGaugesX'
        || n === 'basicGaugesY'
        || n === 'nameX'
        || n === 'nameY'
        || n === 'stateIconX'
        || n === 'stateIconY'
      )
      {
        return 'number';
      }
      return null;

    case 'Window_MenuCommand':
      if (n === 'areMainCommandsEnabled')
      {
        return 'boolean';
      }
      return null;

    case 'Window_Gold':
      if (n === 'currencyUnit')
      {
        return 'string';
      }
      if (n === 'value')
      {
        return 'number';
      }
      return null;

    case 'Window_ScrollText':
      if (n === 'scrollSpeed')
      {
        return 'number';
      }
      return null;

    case 'Window_ChoiceList':
      if (n === 'windowHeight' || n === 'windowWidth' || n === 'windowY')
      {
        return 'number';
      }
      return null;

    case 'Window_Status':
      if (n === 'block2Y')
      {
        return 'number';
      }
      return null;

    case 'Window_NumberInput':
      if (n === 'itemRect')
      {
        return 'Rectangle';
      }
      if (n === 'totalButtonWidth' || n === 'windowHeight' || n === 'windowWidth')
      {
        return 'number';
      }
      return null;

    case 'Window_NameBox':
      if (n === 'windowHeight')
      {
        return 'number';
      }
      return null;

    case 'Window_NameEdit':
      if (n === 'charWidth' || n === 'left')
      {
        return 'number';
      }
      if (n === 'underlineRect')
      {
        return 'Rectangle';
      }
      if (n === 'underlineColor')
      {
        return 'string';
      }
      return null;

    case 'Scene_Status':
      if (n === 'profileHeight' || n === 'statusParamsHeight')
      {
        return 'number';
      }
      return null;

    case 'Scene_ItemBase':
      if (n === 'canUse')
      {
        return 'boolean';
      }
      if (n === 'item')
      {
        return MZ_DATABASE_ENTRY;
      }
      if (n === 'itemTargetActors')
      {
        return 'Game_Actor[]';
      }
      return null;

    case 'Scene_Item':
    case 'Scene_Skill':
      if (n === 'user')
      {
        return 'Game_Actor | undefined';
      }
      return null;

    case 'Scene_Equip':
      if (n === 'itemWindowRect')
      {
        return 'Rectangle';
      }
      return null;

    case 'Scene_Load':
    case 'Scene_Save':
      if (n === 'helpWindowText')
      {
        return 'string';
      }
      return null;

    case 'Window_NameInput':
      if (n === 'itemWidth')
      {
        return 'number';
      }
      if (n === 'table')
      {
        return 'string[][]';
      }
      return null;

    case 'Window_ActorCommand':
      if (n === 'actor')
      {
        return 'Game_Actor | undefined';
      }
      return null;

    case 'Window_BattleEnemy':
      if (n === 'enemy')
      {
        return 'Game_Enemy';
      }
      return null;

    case 'Window_SkillList':
      if (n === 'costWidth')
      {
        return 'number';
      }
      if (n === 'item')
      {
        return MZ_DATABASE_ENTRY;
      }
      return null;

    case 'Window_ItemList':
      if (n === 'item')
      {
        return MZ_DATABASE_ENTRY;
      }
      if (n === 'numberWidth')
      {
        return 'number';
      }
      return null;

    case 'Window_EquipSlot':
      if (n === 'item')
      {
        return MZ_DATABASE_ENTRY;
      }
      return null;

    case 'Window_BattleItem':
      if (n === 'includes')
      {
        return 'boolean';
      }
      return null;

    case 'Window_EquipStatus':
      if (n === 'paramX' || n === 'paramY')
      {
        return 'number';
      }
      return null;

    case 'Window_ShopStatus':
      if (n === 'currentEquippedItem')
      {
        return MZ_DATABASE_ENTRY;
      }
      if (n === 'statusMembers')
      {
        return 'Game_Actor[]';
      }
      return null;

    default:
      return null;
  }
}

/**
 * Getter-style methods that almost always return a scalar number in MZ (HP tiers, slip damage caps, …).
 * Keep conservative: exclude UI verbs like `maximizeWindow` via prefix checks.
 *
 * @param {string} name
 * @returns {boolean}
 */
function looksLikeNumericQuantityReturn(name)
{
  if (NUMERIC_RETURN_METHOD_EXACT.has(name))
  {
    return true;
  }

  if (/Damage$/i.test(name))
  {
    return true;
  }

  if (/^(num|count)[A-Z]/.test(name))
  {
    return true;
  }

  if (/^max[A-Z]/i.test(name) && !/^maximize/i.test(name))
  {
    return true;
  }

  if (/^min[A-Z]/i.test(name) && !/^minimize/i.test(name))
  {
    return true;
  }

  if (/^(motion|battle|weapon|armor|skill|item|damage|sprite|tile|region|terrain|effect)Type$/i.test(name))
  {
    return true;
  }

  if (/^(step|turn|frame|tick|loop)[A-Z]/i.test(name))
  {
    return true;
  }

  // Time-progress battle helpers (`tpbChargeTime`, …) are scalar rates/timers in vanilla MZ.
  if (/^tpb/i.test(name))
  {
    return true;
  }

  return false;
}

/**
 * `performEscape`, `performCollapse`, etc. — side-effect / animation hooks in MZ.
 *
 * @param {string} name
 * @returns {boolean}
 */
function looksLikePerformPrefixedMethodName(name)
{
  return name === 'perform' || /^perform[A-Z][\w$]*$/.test(name);
}

/**
 * `refresh`, `refreshTile`, etc. — almost always void (invalidation / redraw).
 *
 * @param {string} name
 * @returns {boolean}
 */
function looksLikeRefreshPrefixedMethodName(name)
{
  return name === 'refresh' || /^refresh[A-Z][\w$]*$/.test(name);
}

/**
 * Extra naming hints only when body/JSDoc inference left `unknown`.
 * Order matters: context-specific pairs first; then `is`/`has` predicates; void families; `index`;
 * numeric getters (`width`, …); `*Name` strings; `*Id` numbers.
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

  // Body inference often yields only `null` when the real branch used member access the AST did not type.
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

    {
      const engineHit = refineReturnTsByEngineClass(cls, n, currentTs);
      if (engineHit !== null)
      {
        return engineHit;
      }
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

  if (currentTs !== 'unknown' && currentTs !== 'unknown[]')
  {
    return currentTs;
  }

  if (cls === 'Sprite_Gauge')
  {
    if (/^(label|value)FontFace$/i.test(n))
    {
      return 'string';
    }
    if (
      /^gaugeColor\d$/i.test(n)
      || /^gaugeBackColor$/i.test(n)
      || /^flashingColor\d$/i.test(n)
      || /^labelOutlineColor$/i.test(n)
      || /^valueColor$/i.test(n)
      || /^measureLabelWidth$/i.test(n)
      || /^currentValue$/i.test(n)
      || /^labelFontSize$/i.test(n)
      || /^valueFontSize$/i.test(n)
    )
    {
      return 'number';
    }
  }

  if (looksLikeIsPredicateMethodName(n) || looksLikeHasPredicateMethodName(n))
  {
    return 'boolean';
  }

  if (
    looksLikeSetterMethodName(n)
    || looksLikeInitPrefixedMethodName(n)
    || looksLikeClearMethodName(n)
    || looksLikeApplyMethodName(n)
    || n === 'show'
    || n === 'hide'
    || looksLikePerformPrefixedMethodName(n)
    || looksLikeRefreshPrefixedMethodName(n)
  )
  {
    return 'void';
  }

  if (n === 'index')
  {
    return 'number';
  }

  if (looksLikeIdAccessorName(n))
  {
    return 'number';
  }

  if (
    /Name$/i.test(n)
    && !looksLikeIdAccessorName(n)
    && n !== 'gameId'
  )
  {
    return 'string';
  }

  if (
    /^(width|height|x|y|opacity|speed|volume|pitch|pan|duration|tileWidth|tileHeight)$/i.test(n)
    || /^screen[XY]$/.test(n)
  )
  {
    return 'number';
  }

  if (looksLikeNumericSpatialScrollReturn(n))
  {
    return 'number';
  }

  if (looksLikeCharacterMovementReturn(n))
  {
    return 'number';
  }

  if (looksLikeSceneLayoutMetricReturn(n))
  {
    return 'number';
  }

  if (looksLikeNumericQuantityReturn(n))
  {
    return 'number';
  }

  return currentTs;
}

/**
 * Constructor params / DOM-ish names that repeat across `rmmz_*.js` without useful JSDoc.
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
  const n = paramName;

  if (cls === 'Game_Interpreter')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'depth')
    {
      return 'number';
    }
    if (n === 'param')
    {
      return 'number';
    }
    if (n === 'waitMode')
    {
      return 'string';
    }
    if (n === 'target' && m === 'changeHp')
    {
      return 'Game_Battler';
    }
    if (n === 'value' && m === 'changeHp')
    {
      return 'number';
    }
    if (n === 'allowDeath' && m === 'changeHp')
    {
      return 'boolean';
    }
    if (n === 'operation' || n === 'operandType' || n === 'operand')
    {
      return 'number';
    }
    if (n === 'params' && /^command\d+$/.test(m))
    {
      return interpreterCommandParamsTs(m);
    }
    if (n === 'params' && m === 'setupNumInput')
    {
      return 'readonly [number, number]';
    }
    if (n === 'params' && m === 'setupItemChoice')
    {
      return 'readonly [number, number]';
    }
    if (n === 'params' && m === 'setupChoices')
    {
      return 'readonly [readonly string[], number, number, number, number]';
    }
    if (n === 'params' && m === 'picturePoint')
    {
      return RMMZ_EVENT_COMMAND_PARAMETERS;
    }
    if (n === 'list' && (m === 'setup' || m === 'setupChild'))
    {
      return RMMZ_EVENT_COMMAND_LIST;
    }
    if (n === 'list' && m === 'jumpTo')
    {
      return 'number';
    }
    if (n === 'callback' && /^iterate/.test(m))
    {
      return '(battler: Game_Battler) => void';
    }
    if (n === 'param1' || n === 'param2')
    {
      return 'number';
    }
    if (n === 'type' && m === 'gameDataOperand')
    {
      return 'number';
    }
    if (n === 'operationType' && m === 'operateVariable')
    {
      return 'number';
    }
    if (n === 'value' && m === 'operateVariable')
    {
      return 'number';
    }
  }

  if (cls === 'ColorManager')
  {
    if (n === 'actor')
    {
      return 'Game_Actor';
    }
    if (n === 'colorType' || n === 'n' || n === 'change')
    {
      return 'number';
    }
  }

  if (cls === 'Scene_Shop')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'goods' && m === 'prepare')
    {
      return SHOP_GOODS_ROWS;
    }
    if (n === 'purchaseOnly' && m === 'prepare')
    {
      return 'boolean';
    }
    if (n === 'number' && (m === 'doBuy' || m === 'doSell'))
    {
      return 'number';
    }
  }

  if (cls === 'Window_ShopBuy')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'shopGoods' && m === 'setupGoods')
    {
      return SHOP_GOODS_ROWS;
    }
    if (n === 'goods' && m === 'goodsToItem')
    {
      return SHOP_GOODS_ROW;
    }
    if (n === 'money' && m === 'setMoney')
    {
      return 'number';
    }
  }

  if (cls === 'Window_Options')
  {
    const m = inferCtx.methodName ?? '';
    if (
      n === 'symbol'
      && (
        m === 'changeValue'
        || m === 'changeVolume'
        || m === 'getConfigValue'
        || m === 'setConfigValue'
        || m === 'isVolumeSymbol'
      )
    )
    {
      return 'string';
    }
    if (n === 'value' && m === 'booleanStatusText')
    {
      return 'boolean';
    }
    if (n === 'value' && m === 'volumeStatusText')
    {
      return 'number';
    }
    if (n === 'value' && m === 'changeValue')
    {
      return CONFIG_MANAGER_OPTION_VALUE;
    }
    if (n === 'volume' && m === 'setConfigValue')
    {
      return CONFIG_MANAGER_OPTION_VALUE;
    }
    if (m === 'changeVolume' && (n === 'forward' || n === 'wrap'))
    {
      return 'boolean';
    }
  }

  if (cls === 'Window_ShopNumber')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'max' && m === 'setup')
    {
      return 'number';
    }
    if (n === 'price' && m === 'setup')
    {
      return 'number';
    }
    if (n === 'currencyUnit' && m === 'setCurrencyUnit')
    {
      return 'string';
    }
  }

  if (cls === 'DataManager')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'array' && m === 'extractArrayMetadata')
    {
      return 'object[]';
    }
    if (n === 'data' && m === 'extractMetadata')
    {
      return '{ note: string }';
    }
    if (n === 'object' && m === 'onLoad')
    {
      return 'object';
    }
    if (n === 'object' && m === 'isMapObject')
    {
      return 'object';
    }
    if (n === 'item' && (m === 'isItem' || m === 'isWeapon' || m === 'isArmor' || m === 'isSkill'))
    {
      return MZ_DATABASE_ENTRY;
    }
  }

  if (cls === 'Input')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'event' && (m === '_onKeyDown' || m === '_onKeyUp'))
    {
      return 'KeyboardEvent';
    }
    if (n === 'keyCode' && m === '_shouldPreventDefault')
    {
      return 'number';
    }
    if (n === 'gamepad' && m === '_updateGamepadState')
    {
      return 'Gamepad';
    }
  }

  if (cls === 'ConfigManager')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'config' && (m === 'applyData' || m === 'readFlag' || m === 'readVolume'))
    {
      return 'object';
    }
    if (n === 'defaultValue' && m === 'readFlag')
    {
      return 'boolean';
    }
  }

  if (cls === 'TextManager')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'method' && m === 'getter')
    {
      return 'string';
    }
    if (n === 'param' && m === 'getter')
    {
      return 'number | string';
    }
  }

  if (cls === 'FontManager')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'family' && (m === 'load' || m === 'startLoading' || m === 'throwLoadError'))
    {
      return 'string';
    }
    if (n === 'url' && m === 'startLoading')
    {
      return 'string';
    }
  }

  if (cls === 'Scene_Base')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'numLines' && m === 'calcWindowHeight')
    {
      return 'number';
    }
  }

  if (cls === 'Window_Command')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'ext' && (m === 'addCommand' || m === 'findExt' || m === 'selectExt'))
    {
      return WINDOW_COMMAND_EXT;
    }
  }

  if (cls === 'Window')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'srect' || n === 'drect')
    {
      return 'Rectangle';
    }
    if (n === 'm' && m === '_setRectPartsGeometry')
    {
      return 'number';
    }
  }

  if (cls === 'Game_CharacterBase')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'blendMode' && m === 'setBlendMode')
    {
      return 'number';
    }
    if (n === 'moveFrequency' && m === 'setMoveFrequency')
    {
      return 'number';
    }
    if (n === 'moveSpeed' && m === 'setMoveSpeed')
    {
      return 'number';
    }
    if (n === 'priorityType' && m === 'setPriorityType')
    {
      return 'number';
    }
    if (n === 'directionFix' && m === 'setDirectionFix')
    {
      return 'boolean';
    }
    if (n === 'stepAnime' && m === 'setStepAnime')
    {
      return 'boolean';
    }
    if (n === 'walkAnime' && m === 'setWalkAnime')
    {
      return 'boolean';
    }
    if (n === 'through' && m === 'setThrough')
    {
      return 'boolean';
    }
    if (n === 'transparent' && m === 'setTransparent')
    {
      return 'boolean';
    }
    if (n === 'success' && m === 'setMovementSuccess')
    {
      return 'boolean';
    }
  }

  if (cls === 'Game_Character')
  {
    const m = inferCtx.methodName ?? '';
    if ((n === 'goalX' || n === 'goalY') && m === 'findDirectionTo')
    {
      return 'number';
    }
    if ((n === 'moveRoute') && (m === 'setMoveRoute' || m === 'forceMoveRoute'))
    {
      return 'object';
    }
    if (n === 'command' && m === 'processMoveCommand')
    {
      return 'object';
    }
  }

  if (cls === 'Game_Event')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'moveRoute' && m === 'forceMoveRoute')
    {
      return 'object';
    }
    if (n === 'triggers' && m === 'isTriggerIn')
    {
      return 'number[]';
    }
    if (n === 'page' && m === 'meetsConditions')
    {
      return 'object';
    }
  }

  if (cls === 'Game_SelfSwitches')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'key')
    {
      return 'string';
    }
    if (n === 'value' && m === 'setValue')
    {
      return 'boolean';
    }
  }

  if (cls === 'Game_Switches')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'value' && m === 'setValue')
    {
      return 'boolean';
    }
  }

  if (cls === 'Array')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'array' && m === 'equals')
    {
      return 'any[]';
    }
  }

  if (cls === 'Game_Variables')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'value' && m === 'setValue')
    {
      return 'number';
    }
  }

  if (cls === 'Utils')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'str' && m === 'containsArabic')
    {
      return 'string';
    }
  }

  if (cls === 'JsonEx')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'depth' && m === '_encode')
    {
      return 'number';
    }
    if (n === 'value' && (m === '_decode' || m === '_encode'))
    {
      return 'object';
    }
  }

  if (cls === 'Bitmap')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'source' && m === '_createBaseTexture')
    {
      return 'object';
    }
    if ((n === 'tx' || n === 'ty' || n === 'maxWidth') && (m === '_drawTextBody' || m === '_drawTextOutline'))
    {
      return 'number';
    }
    if (n === 'xhr' && m === '_onXhrLoad')
    {
      return 'XMLHttpRequest';
    }
    if (n === 'listner' && m === 'addLoadListener')
    {
      return '() => void';
    }
    if ((n === 'dw' || n === 'dh') && m === 'blt')
    {
      return 'number';
    }
  }

  if (cls === 'Sprite')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'bitmapLoaded' && m === '_onBitmapLoad')
    {
      return 'Bitmap';
    }
    if ((n === 'color' || n === 'tone') && (m === 'setBlendColor' || m === 'setColorTone'))
    {
      return MZ_SCREEN_RGBA;
    }
  }

  if (cls === 'ColorFilter')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'color' && m === 'setBlendColor')
    {
      return MZ_SCREEN_RGBA;
    }
    if (n === 'tone' && m === 'setColorTone')
    {
      return MZ_SCREEN_RGBA;
    }
  }

  if (cls === 'Graphics')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'error' && m === 'printError')
    {
      return 'Error';
    }
    if (n === 'handler' && m === 'setTickHandler')
    {
      return '() => void';
    }
    if (n === 'retry' && m === 'showRetryButton')
    {
      return '() => void';
    }
    if (n === 'element' && m === '_centerElement')
    {
      return 'HTMLElement';
    }
    if (n === 'event' && m === '_onKeyDown')
    {
      return 'KeyboardEvent';
    }
  }

  if (cls === 'Window_Base')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'options' && m === 'destroy')
    {
      return 'object';
    }
  }

  if (cls === 'Window_Scrollable')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'n' && (m === 'smoothScrollDown' || m === 'smoothScrollUp'))
    {
      return 'number';
    }
    if ((n === 'baseX' || n === 'baseY') && m === 'updateScrollBase')
    {
      return 'number';
    }
  }

  if (cls === 'Window_NameInput')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'wrap' && /^cursor/.test(m))
    {
      return 'boolean';
    }
  }

  if (cls === 'Window_NumberInput')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'up' && m === 'changeDigit')
    {
      return 'boolean';
    }
  }

  if (cls === 'Scene_Name')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'maxLength' && m === 'prepare')
    {
      return 'number';
    }
  }

  if (cls === 'Game_Item')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'item' && (m === 'initialize' || m === 'setObject'))
    {
      return MZ_DATABASE_ENTRY;
    }
    if (n === 'isWeapon' && m === 'setEquip')
    {
      return 'boolean';
    }
  }

  if (cls === 'Game_Vehicle')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'type' && m === 'initialize')
    {
      return 'number';
    }
    if (n === 'bgm' && m === 'setBgm')
    {
      return MZ_AUDIO_FILE;
    }
  }

  if (cls === 'Game_Troop')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'page' && m === 'meetsConditions')
    {
      return 'object';
    }
  }

  if (cls === 'Game_Follower')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'character' && m === 'chaseCharacter')
    {
      return 'Game_Character';
    }
  }

  if (cls === 'Window_DebugEdit')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'mode' && m === 'setMode')
    {
      return 'string';
    }
    if (n === 'id' && m === 'setTopId')
    {
      return 'number';
    }
  }

  if (cls === 'Window_ShopCommand')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'purchaseOnly' && m === 'setPurchaseOnly')
    {
      return 'boolean';
    }
  }

  if (cls === 'Window_Help')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'item' && m === 'setItem')
    {
      return MZ_DATABASE_ENTRY;
    }
  }

  if (cls === 'Window_MenuActor')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'item' && m === 'selectForItem')
    {
      return MZ_DATABASE_ENTRY;
    }
  }

  if (WINDOW_SET_ACTOR_MENU_RX.test(cls))
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'actor' && m === 'setActor')
    {
      return 'Game_Actor';
    }
  }

  if (cls === 'Window_EquipStatus')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'actor' && m === 'setActor')
    {
      return 'Game_Actor';
    }
    if (n === 'tempActor' && m === 'setTempActor')
    {
      return 'Game_Actor';
    }
  }

  if (cls === 'Window_ActorCommand')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'actor' && m === 'setup')
    {
      return 'Game_Actor';
    }
  }

  if (cls === 'Window_MenuStatus')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'formationMode' && m === 'setFormationMode')
    {
      return 'boolean';
    }
  }

  if (cls === 'Window_BattleStatus')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'actor' && m === 'selectActor')
    {
      return 'Game_Actor';
    }
  }

  if (cls === 'Window_ShopStatus')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'actor' && (m === 'drawActorEquipInfo' || m === 'drawActorParamChange' || m === 'currentEquippedItem'))
    {
      return 'Game_Actor';
    }
    if (n === 'item1' && m === 'drawActorParamChange')
    {
      return MZ_DATABASE_ENTRY;
    }
  }

  if (cls === 'Window_EventItem')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'item' && m === 'includes')
    {
      return MZ_DATABASE_ENTRY;
    }
  }

  if (cls === 'Window_SkillList')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'skill' && m === 'drawSkillCost')
    {
      return MZ_DATABASE_ENTRY;
    }
    if (n === 'item' && (m === 'includes' || m === 'isEnabled'))
    {
      return MZ_DATABASE_ENTRY;
    }
    if (n === 'actor' && m === 'setActor')
    {
      return 'Game_Actor';
    }
  }

  if (cls === 'Window_EquipItem')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'item' && m === 'includes')
    {
      return MZ_DATABASE_ENTRY;
    }
  }

  if (cls === 'Window_ItemList')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'category' && m === 'setCategory')
    {
      return 'string';
    }
  }

  if (cls === 'Window_NameEdit')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'ch' && m === 'add')
    {
      return 'string';
    }
    if (n === 'actor' && m === 'setup')
    {
      return 'Game_Actor';
    }
    if (n === 'maxLength' && m === 'setup')
    {
      return 'number';
    }
  }

  if (cls === 'Game_Action')
  {
    if (n === 'target' || n === 'subject')
    {
      return 'Game_Battler';
    }
    if (n === 'effect')
    {
      return 'object';
    }
    if (n === 'list')
    {
      return 'number[]';
    }
    if (n === 'unit')
    {
      return 'Game_Unit';
    }
    if (n === 'object' && inferCtx.methodName === 'setItemObject')
    {
      return MZ_DATABASE_ENTRY;
    }
    if (n === 'forcing')
    {
      return 'boolean';
    }
    if (n === 'critical')
    {
      return 'boolean';
    }
    if (n === 'targets')
    {
      return 'Game_Battler[]';
    }
    if (n === 'elements')
    {
      return 'number[]';
    }
    if (n === 'variance')
    {
      return 'number';
    }
  }

  if (cls === 'Window_Base')
  {
    if (n === 'n')
    {
      return 'number';
    }
    if (n === 'textState')
    {
      return 'object';
    }
    if (n === 'color')
    {
      return 'string';
    }
    if (n === 'enabled')
    {
      return 'boolean';
    }
    if (n === 'rtl')
    {
      return 'boolean';
    }
    if (n === 'unit' || n === 'align')
    {
      return 'string';
    }
    if (n === 'value' && inferCtx.methodName === 'drawCurrencyValue')
    {
      return 'number';
    }
    if (n === 'item' && inferCtx.methodName === 'drawItemName')
    {
      return MZ_DATABASE_ENTRY;
    }
    if (n === 'maxWidth' && inferCtx.methodName === 'drawText')
    {
      return 'number';
    }
    if (n === 'numLines' && inferCtx.methodName === 'fittingHeight')
    {
      return 'number';
    }
    if (n === 'line' && inferCtx.methodName === 'maxFontSizeInLine')
    {
      return 'string';
    }
    if (n === 'type' && inferCtx.methodName === 'setBackgroundType')
    {
      return 'number';
    }
  }

  if (cls === 'Window_Selectable')
  {
    if (n === 'wrap' || n === 'smooth' || n === 'trigger')
    {
      return 'boolean';
    }
    if (n === 'cursorAll' || n === 'cursorFixed')
    {
      return 'boolean';
    }
    if (n === 'row')
    {
      return 'number';
    }
    if (n === 'helpWindow')
    {
      return 'Window_Base';
    }
    if (n === 'method')
    {
      return '() => void';
    }
    if (n === 'symbol')
    {
      return 'string';
    }
    if (n === 'item')
    {
      return MZ_DATABASE_ENTRY;
    }
  }

  if (cls === 'Window_StatusBase')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'actor')
    {
      return 'Game_Actor';
    }
    if (n === 'key' && m === 'createInnerSprite')
    {
      return 'string';
    }
    if (n === 'spriteClass' && m === 'createInnerSprite')
    {
      return SPRITE_SUBCLASS_CONSTRUCTOR;
    }
    if ((n === 'type' || n === '_type') && m === 'placeGauge')
    {
      return 'string';
    }
  }

  if (cls === 'Window_Command')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'name' && m === 'addCommand')
    {
      return 'string';
    }
    if (n === 'symbol' && m === 'addCommand')
    {
      return 'string';
    }
    if (n === 'enabled' && m === 'addCommand')
    {
      return 'boolean';
    }
    if (n === 'ext' && m === 'addCommand')
    {
      return 'unknown';
    }
    if (n === 'symbol' && (m === 'findSymbol' || m === 'selectSymbol'))
    {
      return 'string';
    }
    if (n === 'ext' && (m === 'findExt' || m === 'selectExt'))
    {
      return 'unknown';
    }
  }

  if (
    (/^Sprite_/.test(cls) || /^Spriteset_/.test(cls))
    && n === 'options'
    && inferCtx.methodName === 'destroy'
  )
  {
    return 'object';
  }

  if (cls === 'Sprite_Character')
  {
    if (n === 'character')
    {
      return 'Game_Character';
    }
  }

  if (cls === 'Sprite_Actor' || cls === 'Sprite_Enemy')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'battler')
    {
      return 'Game_Battler';
    }
    if (cls === 'Sprite_Enemy' && n === 'hue' && m === 'setHue')
    {
      return 'number';
    }
  }

  if (cls === 'Spriteset_Base')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'request' && m === 'createAnimation')
    {
      return 'object';
    }
    if (n === 'targets' && (m === 'createAnimationSprite' || m === 'makeTargetSprites'))
    {
      return 'Game_Battler[]';
    }
    if (n === 'animation' && m === 'createAnimationSprite')
    {
      return 'object';
    }
    if (n === 'mirror' && m === 'createAnimationSprite')
    {
      return 'boolean';
    }
    if (n === 'delay' && m === 'createAnimationSprite')
    {
      return 'number';
    }
    if (n === 'target' && m === 'animationShouldMirror')
    {
      return 'Game_Battler';
    }
    if (n === 'animation' && (m === 'isAnimationForEach' || m === 'isMVAnimation'))
    {
      return 'object';
    }
  }

  if (cls === 'Spriteset_Map')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'request' && m === 'createBalloon')
    {
      return 'object';
    }
    if (n === 'target' && m === 'findTargetSprite')
    {
      return 'Game_Character';
    }
  }

  if (cls === 'Spriteset_Battle')
  {
    const m = inferCtx.methodName ?? '';
    if ((n === 'a' || n === 'b') && m === 'compareEnemySprite')
    {
      return 'Sprite_Enemy';
    }
  }

  if (cls === 'Sprite_Animation' || cls === 'Sprite_AnimationMV')
  {
    const m = inferCtx.methodName ?? '';
    if (
      n === 'renderer'
      && (
        m === '_render'
        || m === 'setViewport'
        || m === 'resetViewport'
        || m === 'onBeforeRender'
        || m === 'onAfterRender'
        || m === 'targetPosition'
        || m === 'setProjectionMatrix'
      )
    )
    {
      return 'PIXI.Renderer';
    }
    if (n === 'targets' && m === 'setup')
    {
      return 'Sprite[]';
    }
    if (n === 'animation' && m === 'setup')
    {
      return 'object';
    }
    if (n === 'mirror' && m === 'setup')
    {
      return 'boolean';
    }
    if (n === 'delay' && m === 'setup')
    {
      return 'number';
    }
    if (n === 'previous' && cls === 'Sprite_Animation' && m === 'setup')
    {
      return 'Sprite_Animation | null';
    }
    if (n === 'sprite' && m === 'targetSpritePosition')
    {
      return 'Sprite';
    }
    if (n === 'frame' && m === 'updateAllCellSprites')
    {
      return 'number[][]';
    }
    if (n === 'cell' && m === 'updateCellSprite')
    {
      return 'number[]';
    }
    if (n === 'color' && (m === 'startFlash' || m === 'startScreenFlash'))
    {
      return MZ_SCREEN_RGBA;
    }
  }

  if (cls === 'Sprite_Name' || cls === 'Sprite_StateIcon' || cls === 'Sprite_StateOverlay')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'battler' && m === 'setup')
    {
      return 'Game_Battler';
    }
  }

  if (cls === 'Sprite_Gauge')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'battler' && m === 'setup')
    {
      return 'Game_Battler';
    }
  }

  if (cls === 'Sprite_Button')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'buttonType' && m === 'initialize')
    {
      return 'number';
    }
    if (n === 'method' && m === 'setClickHandler')
    {
      return '() => void';
    }
  }

  if (cls === 'Sprite_Battleback')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'type' && m === 'initialize')
    {
      return 'number';
    }
    if ((n === 'type' || n === '_type') && /terrainBattleback/.test(m))
    {
      return 'number';
    }
  }

  if (cls === 'Sprite_Damage')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'value' && m === 'createDigits')
    {
      return 'number';
    }
  }

  if (cls === 'SceneManager')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'sceneClass' && /^(goto|push|run|isNextScene|isPreviousScene)$/.test(m))
    {
      return SCENE_BASE_CONSTRUCTOR;
    }
    if (n === 'event' && m === 'onError')
    {
      return 'ErrorEvent';
    }
    if (n === 'event' && m === 'onKeyDown')
    {
      return 'KeyboardEvent';
    }
    if (n === 'event' && m === 'onReject')
    {
      return 'PromiseRejectionEvent';
    }
    if (n === 'e' && m === 'catchException')
    {
      return 'unknown';
    }
  }

  if (cls === 'TouchInput')
  {
    const m = inferCtx.methodName ?? '';
    if (
      n === 'event'
      && (
        m === '_onMouseDown'
        || m === '_onMouseMove'
        || m === '_onMouseUp'
        || m === '_onLeftButtonDown'
        || m === '_onRightButtonDown'
        || m === '_onWheel'
      )
    )
    {
      return 'MouseEvent';
    }
    if (n === 'event' && (m === '_onTouchEnd' || m === '_onTouchMove' || m === '_onTouchStart'))
    {
      return 'TouchEvent';
    }
  }

  if (cls === 'StorageManager')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'path' || n === 'oldPath' || n === 'newPath')
    {
      return 'string';
    }
    if (n === 'data')
    {
      return 'string';
    }
    if (n === 'zip')
    {
      return 'string';
    }
    if (n === 'json')
    {
      return 'string';
    }
    if (n === 'object' && (m === 'objectToJson' || m === 'saveObject'))
    {
      return 'object';
    }
  }

  if (cls === 'ImageManager')
  {
    if (n === 'folder' || n === 'url')
    {
      return 'string';
    }
    if (n === 'bitmap')
    {
      return 'Bitmap';
    }
  }

  if (cls === 'AudioManager')
  {
    if (n === 'folder')
    {
      return 'string';
    }
    if (n === 'configVolume' || n === 'pos')
    {
      return 'number';
    }
    if (n === 'buffer')
    {
      return 'WebAudio';
    }
    if (n === 'webAudio')
    {
      return 'WebAudio';
    }
    if (n === 'audio' || n === 'bgm' || n === 'bgs' || n === 'me' || n === 'se')
    {
      return 'object';
    }
  }

  if (cls === 'BattleManager')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'forward' && m === 'changeCurrentActor')
    {
      return 'boolean';
    }
    if (n === 'current' && m === 'displayBattlerStatus')
    {
      return 'boolean';
    }
    if (n === 'result' && m === 'endBattle')
    {
      return 'number';
    }
    if (n === 'battleTest' && m === 'setBattleTest')
    {
      return 'boolean';
    }
    if (n === 'callback' && m === 'setEventCallback')
    {
      return '() => void';
    }
    if (n === 'logWindow' && m === 'setLogWindow')
    {
      return 'Window_BattleLog';
    }
    if (n === 'canEscape' && m === 'setup')
    {
      return 'boolean';
    }
    if (n === 'canLose' && m === 'setup')
    {
      return 'boolean';
    }
    if (n === 'timeActive' && /^(update|updatePhase|updateTurn)$/.test(m))
    {
      return 'boolean';
    }
  }

  if (cls === 'DataManager')
  {
    if (n === 'src' || n === 'url')
    {
      return 'string';
    }
    if (n === 'xhr')
    {
      return 'XMLHttpRequest';
    }
    if (n === 'info')
    {
      return 'object';
    }
    if (n === 'contents')
    {
      return 'object';
    }
  }

  if (cls === 'Game_BattlerBase')
  {
    if (n === 'value')
    {
      return 'number';
    }
    if (n === 'buffLevel')
    {
      return 'number';
    }
    if (n === 'code' || n === 'id')
    {
      return 'number';
    }
    if (n === 'skill')
    {
      return 'RPG_Skill';
    }
    if (n === 'tp')
    {
      return 'number';
    }
  }

  if (cls === 'Game_Actor')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'keepExp' || n === 'show' || n === 'forcing')
    {
      return 'boolean';
    }
    if (n === 'exp' || n === 'level')
    {
      return 'number';
    }
    if (n === 'equips')
    {
      return 'number[]';
    }
    if (n === 'lastSkills' || n === 'newSkills')
    {
      return 'RPG_Skill[]';
    }
    if (n === 'weapon')
    {
      return 'RPG_Weapon';
    }
    if (n === 'armor')
    {
      return 'RPG_Armor';
    }
    if (n === 'gameClass')
    {
      return 'RPG_Class';
    }
    if (n === 'skill')
    {
      return 'RPG_Skill';
    }
    if (n === 'profile')
    {
      return 'string';
    }
    if (n === 'symbol' && m === 'setLastCommandSymbol')
    {
      return 'string';
    }
    if (n === '_symbol' && m === 'setLastCommandSymbol')
    {
      return 'string';
    }
    if (n === 'newItem' || n === 'oldItem')
    {
      return MZ_DATABASE_ENTRY;
    }
    if (n === 'state')
    {
      return 'RPG_State';
    }
    if (n === 'action')
    {
      return 'Game_Action';
    }
  }

  if (cls === 'Game_Enemy')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'kind' && m === 'itemObject')
    {
      return 'number';
    }
    if (n === 'action' && (m === 'meetsCondition' || m === 'isActionValid'))
    {
      return 'object';
    }
    if (n === 'action' && (m === 'performAction' || m === 'performActionStart'))
    {
      return 'Game_Action';
    }
    if (n === 'actionList')
    {
      return 'object[]';
    }
    if (n === 'ratingZero')
    {
      return 'number';
    }
    if (n === 'letter')
    {
      return 'string';
    }
    if (n === 'plural')
    {
      return 'boolean';
    }
    if ((n === 'param1' || n === 'param2') && /^meets(Hp|Mp|Turn)Condition$/.test(m))
    {
      return 'number';
    }
    if (n === 'param' && /^(meetsStateCondition|meetsPartyLevelCondition|meetsSwitchCondition)$/.test(m))
    {
      return 'number';
    }
  }

  if (cls === 'Game_Player')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'fadeType' && m === 'reserveTransfer')
    {
      return 'number';
    }
    if (n === 'direction' && m === 'executeMove')
    {
      return 'number';
    }
    if (
      n === 'triggers'
      && (
        m === 'checkEventTriggerHere'
        || m === 'checkEventTriggerThere'
        || m === 'startMapEvent'
      )
    )
    {
      return 'number[]';
    }
    if (n === 'normal' && m === 'startMapEvent')
    {
      return 'boolean';
    }
    if (n === 'encounter' && m === 'meetsEncounterConditions')
    {
      return 'object';
    }
    if (
      (n === 'x1' || n === 'y1' || n === 'x2' || n === 'y2')
      && /^triggerTouchActionD\d$/.test(m)
    )
    {
      return 'number';
    }
    if (n === 'wasMoving' && m === 'updateNonmoving')
    {
      return 'boolean';
    }
    if ((n === 'lastScrolledX' || n === 'lastScrolledY') && m === 'updateScroll')
    {
      return 'number';
    }
  }

  if (cls === 'Game_Message')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'choices' && m === 'setChoices')
    {
      return 'string[]';
    }
    if ((n === 'defaultType' || n === 'cancelType') && m === 'setChoices')
    {
      return 'number';
    }
    if (n === 'background' && (m === 'setBackground' || m === 'setChoiceBackground'))
    {
      return 'number';
    }
    if (n === 'positionType' && (m === 'setPositionType' || m === 'setChoicePositionType'))
    {
      return 'number';
    }
    if (n === 'callback' && m === 'setChoiceCallback')
    {
      return '(n: number) => void';
    }
    if (n === 'n' && m === 'onChoice')
    {
      return 'number';
    }
    if (n === 'itemType' && m === 'setItemChoice')
    {
      return 'number';
    }
    if (n === 'maxDigits' && m === 'setNumberInput')
    {
      return 'number';
    }
    if (n === 'noFast' && m === 'setScroll')
    {
      return 'boolean';
    }
  }

  if (cls === 'Game_Temp')
  {
    const m = inferCtx.methodName ?? '';
    // Engine params named `type` render as `_type` in signatures (`safeParam`); inference sees `type`.
    if ((n === 'type' || n === '_type') && (m === 'lastActionData' || m === 'setLastActionData'))
    {
      return 'number';
    }
    if (n === 'value' && m === 'setLastActionData')
    {
      return 'number';
    }
    if (n === 'targets' && m === 'requestAnimation')
    {
      return 'Game_CharacterBase[]';
    }
    if (n === 'target' && m === 'requestBalloon')
    {
      return 'Game_CharacterBase';
    }
    if (n === 'actorID' || n === 'skillID' || n === 'itemID')
    {
      return 'number';
    }
    if (n === 'target' && m === 'setTouchState')
    {
      return 'Game_CharacterBase | null';
    }
    if (n === 'state' && m === 'setTouchState')
    {
      return 'string';
    }
  }

  if (cls === 'Game_Screen')
  {
    const m = inferCtx.methodName ?? '';
    if ((n === 'type' || n === '_type') && m === 'changeWeather')
    {
      return 'string';
    }
    if (n === 'power' && m === 'changeWeather')
    {
      return 'number';
    }
    if (
      (n === 'origin' || n === 'scaleX' || n === 'scaleY' || n === 'blendMode' || n === 'easingType')
      && /^(showPicture|movePicture)$/.test(m)
    )
    {
      return 'number';
    }
    if (n === 'scale' && /^(setZoom|startZoom)$/.test(m))
    {
      return 'number';
    }
    if (n === 'color' && m === 'startFlash')
    {
      return MZ_SCREEN_RGBA;
    }
    if (n === 'tone' && (m === 'startTint' || m === 'tintPicture'))
    {
      return MZ_SCREEN_RGBA;
    }
    if (n === 'power' && m === 'startShake')
    {
      return 'number';
    }
  }

  if (cls === 'Game_Picture')
  {
    const m = inferCtx.methodName ?? '';
    if (
      (n === 'origin' || n === 'scaleX' || n === 'scaleY' || n === 'blendMode')
      && /^(show|move)$/.test(m)
    )
    {
      return 'number';
    }
    if (n === 'easingType' && m === 'move')
    {
      return 'number';
    }
    if (n === 'tone' && m === 'tint')
    {
      return MZ_SCREEN_RGBA;
    }
    if ((n === 'current' || n === 'target') && m === 'applyEasing')
    {
      return 'number';
    }
    if (n === 't' && m === 'calcEasing')
    {
      return 'number';
    }
    if ((n === 't' || n === 'exponent') && /^ease(In|Out|InOut)$/.test(m))
    {
      return 'number';
    }
  }

  if (cls === 'Game_Map')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'x1' && (m === 'deltaX' || m === 'distance'))
    {
      return 'number';
    }
    if (n === 'x2' && (m === 'deltaX' || m === 'distance'))
    {
      return 'number';
    }
    if (n === 'y1' && (m === 'deltaY' || m === 'distance'))
    {
      return 'number';
    }
    if (n === 'y2' && (m === 'deltaY' || m === 'distance'))
    {
      return 'number';
    }
    if (n === 'direction' && (m === 'doScroll' || m === 'startScroll'))
    {
      return 'number';
    }
    if ((n === 'type' || n === '_type') && m === 'vehicle')
    {
      return 'number | string';
    }
  }

  if (cls === 'Game_Unit')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'activeMember' && m === 'select')
    {
      return 'Game_Battler';
    }
    if (n === 'target' && m === 'substituteBattler')
    {
      return 'Game_Battler';
    }
  }

  const tilemapBitmapsCls =
    cls === 'Tilemap'
    || cls === 'Tilemap.Layer'
    || cls === 'Tilemap.CombinedLayer';

  if (tilemapBitmapsCls)
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'bitmaps' && m === 'setBitmaps')
    {
      return 'Array<Bitmap | null>';
    }
  }

  if (cls === 'Tilemap.Layer' || cls === 'Tilemap.CombinedLayer')
  {
    const m = inferCtx.methodName ?? '';
    if (
      m === 'addRect'
      && (
        n === 'setNumber'
        || n === 'dx'
        || n === 'dy'
        || n === 'w'
        || n === 'h'
      )
    )
    {
      return 'number';
    }
    if (cls === 'Tilemap.Layer' && n === 'renderer' && m === 'render')
    {
      return 'PIXI.Renderer';
    }
  }

  if (cls === 'Tilemap.Renderer')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'renderer' && (m === 'bindTextures' || m === 'initialize' || m === 'updateTextures'))
    {
      return 'PIXI.Renderer';
    }
    if (n === 'images' && m === 'updateTextures')
    {
      return 'TexImageSource[]';
    }
  }

  if (cls === 'Tilemap')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'data' && m === 'setData')
    {
      return 'number[]';
    }
    if (
      (n === 'startX' || n === 'startY')
      && (m === '_addAllSpots' || m === '_addSpot')
    )
    {
      return 'number';
    }
    if (
      (n === 'dx' || n === 'dy')
      && (
        m === '_addAutotile'
        || m === '_addNormalTile'
        || m === '_addTile'
        || m === '_addSpotTile'
        || m === '_addTableEdge'
        || m === '_addShadow'
      )
    )
    {
      return 'number';
    }
    if (n === 'shadowBits' && m === '_addShadow')
    {
      return 'number';
    }
    if ((n === 'a' || n === 'b') && m === '_compareChildOrder')
    {
      return 'object';
    }
    if ((n === 'tileID1' || n === 'tileID2') && m === 'isSameKindTile')
    {
      return 'number';
    }
    if ((n === 'kind' || n === 'shape') && m === 'makeAutotileId')
    {
      return 'number';
    }
  }

  if (cls === 'PluginManager')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'self' && m === 'callCommand')
    {
      return 'object';
    }
    if ((n === 'pluginName' || n === 'commandName') && m === 'callCommand')
    {
      return 'string';
    }
    if (n === 'args' && m === 'callCommand')
    {
      return 'string';
    }
    if ((n === 'pluginName' || n === 'commandName') && m === 'registerCommand')
    {
      return 'string';
    }
    if (n === 'func' && m === 'registerCommand')
    {
      return '(args: string) => void';
    }
    if (n === 'name' && m === 'setParameters')
    {
      return 'string';
    }
    if (n === 'parameters' && m === 'setParameters')
    {
      return 'object';
    }
    if (n === 'name' && m === 'parameters')
    {
      return 'string';
    }
    if (n === 'filename' && m === 'loadScript')
    {
      return 'string';
    }
    if (n === 'plugins' && m === 'setup')
    {
      return 'object[]';
    }
    if (n === 'url' && m === 'throwLoadError')
    {
      return 'string';
    }
    if (n === 'e' && m === 'onError')
    {
      return 'Event';
    }
  }

  if (cls === 'WebAudio')
  {
    const m = inferCtx.methodName ?? '';
    if (n === 'arrayBuffer' && m === '_decodeAudioData')
    {
      return 'ArrayBuffer';
    }
    if (n === 'buffer' && m === '_onDecode')
    {
      return 'AudioBuffer';
    }
    if (n === 'response' && m === '_onFetch')
    {
      return 'Response';
    }
    if (n === 'value' && m === '_onFetchProcess')
    {
      return 'Uint8Array';
    }
    if (n === 'xhr' && m === '_onXhrLoad')
    {
      return 'XMLHttpRequest';
    }
    if (n === 'view' && (m === '_readFourCharacters' || m === '_readMetaData'))
    {
      return 'DataView';
    }
    if (n === 'index' && (m === '_readFourCharacters' || m === '_readMetaData'))
    {
      return 'number';
    }
    if (n === 'size' && m === '_readMetaData')
    {
      return 'number';
    }
    if (n === 'url' && (m === '_startFetching' || m === '_startXhrLoading'))
    {
      return 'string';
    }
    if (n === 'arrayBuffer' && m === '_readLoopComments')
    {
      return 'ArrayBuffer';
    }
    if (n === 'listner' && (m === 'addLoadListener' || m === 'addStopListener'))
    {
      return '() => void';
    }
  }

  if (n === 'rect')
  {
    return 'Rectangle';
  }

  if (n === 'sceneClass')
  {
    return 'new (...args: unknown[]) => Scene_Base';
  }

  if (n === 'deltaTime')
  {
    return 'number';
  }

  if (
    n === 'white'
    || n === 'mirror'
    || n === 'selectable'
    || n === 'includeEquip'
    || n === 'videoVisible'
    || n === 'autosave'
  )
  {
    return 'boolean';
  }

  if (n === 'loopX' || n === 'loopY')
  {
    return 'boolean';
  }

  if (n === 'sx' || n === 'sy' || n === 'index1' || n === 'index2')
  {
    return 'number';
  }

  if (n === 'd' || n === 'horz' || n === 'vert')
  {
    return 'number';
  }

  if (n === 'bit')
  {
    return 'number';
  }

  if (n === 'threshold')
  {
    return 'number';
  }

  if (n === 'xPlus' || n === 'yPlus')
  {
    return 'number';
  }

  if (n === 'sprite' || n === 'targetSprite')
  {
    return 'Sprite';
  }

  if (n === 'graphics')
  {
    return 'object';
  }

  if (n === 'textState')
  {
    return 'object';
  }

  if (n === 'c' && inferCtx.methodName === 'processControlCharacter')
  {
    return 'string';
  }

  if (n === 'code' && inferCtx.methodName === 'processEscapeCharacter')
  {
    return 'string';
  }

  if (n === 'n' && cls === 'SoundManager')
  {
    return 'number';
  }

  if (n === 'url' && cls === 'EffectManager')
  {
    return 'string';
  }

  if (
    (n === 'subject' || n === 'target' || n === 'substitute' || n === 'battler')
    && BATTLE_RELATED_CLASS_RE.test(cls)
  )
  {
    return 'Game_Battler';
  }

  if (
    n === 'targets'
    && /Battle|Battler|BattleManager|Scene_Battle|Window_Battle|Spriteset_Battle/.test(cls)
  )
  {
    return 'Game_Battler[]';
  }

  if (
    n === 'action'
    && /Battle|Battler|Game_Action|Window_Battle|Scene_Battle|Spriteset_Battle|BattleManager/.test(cls)
  )
  {
    return 'Game_Action';
  }

  if (n === 'character' && /^Game_Character/.test(cls))
  {
    return 'Game_Character';
  }

  if (n === 'item' && /^Game_(Party|Actor|Battler)/.test(cls))
  {
    return MZ_DATABASE_ENTRY;
  }

  if (
    (n === 'item' || n === 'weapon' || n === 'armor')
    && cls === 'Game_Enemy'
  )
  {
    return MZ_DATABASE_ENTRY;
  }

  if (n === 'spriteset' && /Battle|Scene_Battle|Window_Battle/.test(cls))
  {
    return 'Spriteset_Battle';
  }

  if (n === 'window' && /^Scene_/.test(cls))
  {
    return 'Window_Base';
  }

  if (/Window$/.test(n) && /^(set|add)/.test(inferCtx.methodName || '') && /^Scene_|^Window_/.test(cls))
  {
    return 'Window_Base';
  }

  if (n === 'messageWindow' || n === 'goldWindow' || n === 'choiceListWindow')
  {
    return 'Window_Base';
  }

  if (n === 'fmt' && cls === 'Window_BattleLog')
  {
    return 'string';
  }

  if (n === 'buffs' && cls === 'Window_BattleLog')
  {
    return 'object[]';
  }

  if (n === 'waitMode' && cls === 'Window_BattleLog')
  {
    return 'string';
  }

  if (n === 'info' && cls === 'Window_SavefileList')
  {
    return 'object';
  }

  if (n === 'mode' && cls === 'Window_SavefileList')
  {
    return 'string';
  }

  if (n === 'e' && cls === 'SceneManager' && /Error|KeyDown|Reject|onKey/.test(inferCtx.methodName || ''))
  {
    return 'Event';
  }

  if (n === 'statusType' && cls === 'Sprite_Gauge')
  {
    return 'string';
  }

  if ((n === 'value' || n === 'maxValue') && cls === 'Sprite_Gauge')
  {
    return 'number';
  }

  if (n === 'item' && /^Window_(Item|Shop|Battle)/.test(cls))
  {
    return MZ_DATABASE_ENTRY;
  }

  return null;
}

/**
 * When JSDoc did not pin a parameter type, tighten `unknown` using naming cues + optional enclosing method context.
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

  const n = paramName;

  // `volume` normally implies a numeric gain (AudioManager, …); options wiring assigns booleans too.
  if (
    inferCtx
    && inferCtx.assigningClassPath === 'Window_Options'
    && inferCtx.methodName === 'setConfigValue'
    && n === 'volume'
  )
  {
    return CONFIG_MANAGER_OPTION_VALUE;
  }

  if (looksLikeIdAccessorName(n))
  {
    return 'number';
  }

  if (/Uuid$/i.test(n))
  {
    return 'string';
  }

  if (looksLikeNumericShapeParamName(n))
  {
    return 'number';
  }

  if (looksLikeTextShapeParamName(n))
  {
    return 'string';
  }

  if (n === 'sceneActive' || n === 'enabled' || n === 'visible' || n === 'advantageous')
  {
    return 'boolean';
  }

  if (n === 'damage' || n === 'hpDamage' || n === 'mpDamage')
  {
    return 'number';
  }

  if (n === 'motionType' || n === 'animationId' || n === 'skillType' || n === 'effectType')
  {
    return 'number';
  }

  // Vanilla battler/state hooks pass duration counts and timing constants as numbers.
  if (n === 'turns' || n === 'timing')
  {
    return 'number';
  }

  if (PARAM_NAME_RATE_STYLE.has(n))
  {
    return 'number';
  }

  if (n === 'variance')
  {
    return 'number';
  }

  if (inferCtx && inferCtx.methodName)
  {
    const m = inferCtx.methodName;
    if (
      (n === 'value' || n === 'amount')
      && (
        /Damage$/i.test(m)
        || /^on[A-Za-z]*Damage$/i.test(m)
        || /gainHp$/i.test(m)
        || /loseHp$/i.test(m)
        || (/^gain/i.test(m) && /(Hp|Mp|Tp)$/i.test(m))
      )
    )
    {
      return 'number';
    }
    if (
      (n === 'hp' || n === 'mp')
      && (/Hp$/i.test(m) || /Mp$/i.test(m) || /Damage$/i.test(m))
    )
    {
      return 'number';
    }
    if (
      n === 'value'
      && (/^setBattleBgm$/i.test(m) || /^setDefeatMe$/i.test(m) || /^setVictoryMe$/i.test(m))
    )
    {
      return MZ_AUDIO_FILE;
    }
    if (n === 'value' && m === 'setWindowTone')
    {
      return '[number, number, number, number]';
    }
    if ((n === 'actor') && /^(setMenuActor|setTargetActor)$/i.test(m))
    {
      return 'Game_Actor';
    }
  }

  if (n === 'troopAgi')
  {
    return 'number';
  }

  if (n === 'actionState')
  {
    return 'string';
  }

  {
    const protoTs = refineParamTsByEnginePrototype(n, inferCtx);
    if (protoTs !== null)
    {
      return protoTs;
    }
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
    case 'LogicalExpression':
      if (
        expr.type === 'BinaryExpression'
        && (expr.operator === '==' || expr.operator === '===' || expr.operator === '!=' || expr.operator === '!=='
          || expr.operator === '<' || expr.operator === '>' || expr.operator === '<=' || expr.operator === '>='
          || expr.operator === 'in' || expr.operator === 'instanceof')
      )
      {
        return 'boolean';
      }
      if (expr.type === 'LogicalExpression')
      {
        if (expr.operator === '||')
        {
          const boolCoerce = inferExprType(expr.right, ctx);
          if (boolCoerce === 'boolean')
          {
            return 'boolean';
          }
        }
        const lt = inferExprType(expr.left, ctx);
        const rt = inferExprType(expr.right, ctx);
        if (lt === 'boolean' && rt === 'boolean')
        {
          return 'boolean';
        }

        // Predicate-shaped returns like `isAllDead() && this.foo.length > 0`: one branch is a comparison
        // (`boolean`), the other is an unconstrained call (`unknown`). Treat as boolean for IntelliSense.
        if (lt === 'boolean' || rt === 'boolean')
        {
          return 'boolean';
        }

        if (lt && rt && lt === rt)
        {
          return lt;
        }
        return null;
      }
      return null;

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

  const docBlock = buildMethodDocStarLines(jd, funcNode);

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
function buildMethodDocStarLines(jd, funcNode)
{
  /** @type {string[]} */
  const starLines = [];

  if (jd.summary && jd.summary.trim().length > 0)
  {
    starLines.push(` * ${escapeDocStarText(jd.summary.trim())}`);
  }

  const names = collectFormalParamNames(funcNode);
  for (const pname of names)
  {
    const prose = jd.paramDescriptions.get(pname);
    if (prose && prose.trim().length > 0)
    {
      starLines.push(` * @param ${safeParam(pname)} ${escapeDocStarText(prose.trim())}`);
    }
  }

  if (starLines.length === 0)
  {
    return '';
  }

  return starLines.join('\n');
}