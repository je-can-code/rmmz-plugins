/**
 * Tuple aliases and `$data*` rows that do not have a matching `class RPG_*` under src/plugins.
 * Hydrated rows (`RPG_Actor`, `RPG_Item`, …) are typed only by those classes so Go to Declaration lands on your implementations.
 * Regenerate: `bun run defs:generate`
 */

declare global
{
  /**
   * Editor indices 0–7: max HP, max MP, attack, defense, m.attack, m.defense, agility, luck.
   */
  type RPG_CoreParam8 = readonly [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];

  /**
   * Class experience formula inputs from the database editor (four coefficients).
   */
  type RPG_ExpParams4 = readonly [number, number, number, number];

  /**
   * Eight per-stat level curves; each inner array is indexed by character level.
   */
  type RPG_ClassCurveBundle = readonly [
    number[],
    number[],
    number[],
    number[],
    number[],
    number[],
    number[],
    number[],
  ];

  /**
   * Map tree metadata (`$dataMapInfos` entries) — no J-Base hydrated class for this row shape.
   */
  interface RPG_MapInfo
  {
    id: number;
    expanded: boolean;
    name: string;
    order: number;
    parentId: number;
    scrollX: number;
    scrollY: number;
    quick?: boolean;
  }

  /**
   * Single interpreter list entry ({@link Game_Interpreter} `_list` elements) or an event page / move-route `list` item.
   * Map move-route JSON often omits `indent`; event commands include it.
   */
  type RPG_EventListCommand = {
    code: number;
    indent?: number;
    parameters: readonly (number | string | boolean | object | null)[];
  };

  /**
   * Custom move route on a {@link RPG_MapEventPage}.
   */
  interface RPG_MapEventMoveRoute
  {
    list: RPG_EventListCommand[];
    repeat: boolean;
    skippable: boolean;
    wait: boolean;
  }

  /**
   * One page of a map event (MZ `Map*.json` under `events[*].pages`).
   */
  interface RPG_MapEventPage
  {
    conditions: object;
    directionFix: boolean;
    image: object;
    list: RPG_EventListCommand[];
    moveFrequency: number;
    moveRoute: RPG_MapEventMoveRoute;
    moveSpeed: number;
    moveType: number;
    priorityType: number;
    stepAnime: boolean;
    through: boolean;
    trigger: number;
    walkAnime: boolean;
  }

  /**
   * Map event entry from `$dataMap.events` when present (MZ stores `null` for unused indices).
   */
  interface RPG_MapEvent
  {
    id: number;
    name: string;
    note: string;
    pages: RPG_MapEventPage[];
    x: number;
    y: number;
  }

  /**
   * Rolling bag for {@link Window_Base.prototype.drawTextEx} / escape processing — constructed only by
   * {@link Window_Base.prototype.createTextState} (not a JSON database row; vanilla builds a plain object).
   * Field set matches `project/js/rmmz_windows.js` (`createTextState`, `flushTextState`, `processCharacter`, …).
   */
  interface RPG_TextState
  {
    buffer: string;
    drawing: boolean;
    height: number;
    index: number;
    outputHeight: number;
    outputWidth: number;
    rtl: boolean;
    startX: number;
    startY: number;
    text: string;
    width: number;
    x: number;
    y: number;
  }

  /**
   * Per-indent branch slots on {@link Game_Interpreter} (`this._branch`). Keys mirror
   * {@link Game_Interpreter.prototype._indent}. Values store choice indices (`Show Choices`), conditional
   * branch booleans, battle outcomes `0 | 1 | 2`, or `null` when {@link Game_Interpreter.prototype.jumpTo}
   * clears an outer indent’s slot.
   */
  type RPG_InterpreterBranchMap = {
    [indent: number]: boolean | null | number;
  };

  /**
   * Symbol-driven callbacks on {@link Window_Selectable} (`this._handlers`), e.g. `"ok"` / `"cancel"`.
   */
  type RPG_WindowSelectableHandlers = Record<string, () => void>;

  /**
   * One plugin’s parameter bag as stored in `plugins.js`: every value is a **string** at load time (booleans and
   * numbers are `"true"` / `"42"`, etc.). Struct / array parameters from the Plugin Manager are usually JSON **text**
   * in those strings (sometimes escaped again); plugins parse them after read.
   */
  type RPG_PluginParameterMap = Record<string, string>;

  /**
   * Lowercase plugin basename → bag ({@link PluginManager.setParameters}, {@link PluginManager.parameters}).
   */
  type RPG_PluginParameterRegistry = Record<string, RPG_PluginParameterMap>;

  /**
   * MV/MZ plugin command registry (`PluginName:commandName` keys from {@link PluginManager.registerCommand}).
   */
  type RPG_PluginCommandRegistry = Record<string, (args: unknown) => void>;
}

export {};
