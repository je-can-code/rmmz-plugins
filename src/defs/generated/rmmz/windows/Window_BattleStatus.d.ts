/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_BattleStatus
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_BattleStatus extends Window_StatusBase
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Window_BattleStatus#initialize}.<br/>
   * Written in: {@link Window_BattleStatus#initialize}, {@link Window_BattleStatus#performPartyRefresh}, {@link Window_BattleStatus#preparePartyRefresh}.<br/>
   * Read in: {@link Window_BattleStatus#performPartyRefresh}.<br/>
   */
  _bitmapsReady: number;
  /**
   * Gets actor.
   * @param index The index parameter.
   * @returns The result.
   */
  actor(index: unknown): unknown;
  /**
   * Gets basic gauges x.
   * @param rect The rect parameter.
   * @returns The result.
   */
  basicGaugesX(rect: unknown): unknown;
  /**
   * Gets basic gauges y.
   * @param rect The rect parameter.
   * @returns The result.
   */
  basicGaugesY(rect: unknown): unknown;
  /**
   * Performs draw item.
   * @param index The index parameter.
   */
  drawItem(index: unknown): void;
  /**
   * Performs draw item image.
   * @param index The index parameter.
   */
  drawItemImage(index: unknown): void;
  /**
   * Performs draw item status.
   * @param index The index parameter.
   */
  drawItemStatus(index: unknown): void;
  /**
   * Gets extra height.
   * @returns The result.
   */
  extraHeight(): number;
  /**
   * Gets face rect.
   * @param index The index parameter.
   * @returns The result.
   */
  faceRect(index: unknown): unknown;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: unknown): void;
  /**
   * Gets item height.
   * @returns The result.
   */
  itemHeight(): unknown;
  /**
   * Gets max cols.
   * @returns The result.
   */
  maxCols(): number;
  /**
   * Gets max items.
   * @returns The result.
   */
  maxItems(): unknown;
  /**
   * Gets name x.
   * @param rect The rect parameter.
   * @returns The result.
   */
  nameX(rect: unknown): unknown;
  /**
   * Gets name y.
   * @param rect The rect parameter.
   * @returns The result.
   */
  nameY(rect: unknown): unknown;
  /**
   * Performs perform party refresh.
   */
  performPartyRefresh(): void;
  /**
   * Performs prepare party refresh.
   */
  preparePartyRefresh(): void;
  /**
   * Gets row spacing.
   * @returns The result.
   */
  rowSpacing(): number;
  /**
   * Performs select actor.
   * @param actor The actor parameter.
   */
  selectActor(actor: unknown): void;
  /**
   * Gets state icon x.
   * @param rect The rect parameter.
   * @returns The result.
   */
  stateIconX(rect: unknown): unknown;
  /**
   * Gets state icon y.
   * @param rect The rect parameter.
   * @returns The result.
   */
  stateIconY(rect: unknown): unknown;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates padding.
   */
  updatePadding(): void;
}
