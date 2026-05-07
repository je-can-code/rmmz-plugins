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
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Window_BattleStatus#initialize}.
   * Written in: {@link Window_BattleStatus#initialize}, {@link Window_BattleStatus#performPartyRefresh}, {@link Window_BattleStatus#preparePartyRefresh}.
   * Read in: {@link Window_BattleStatus#performPartyRefresh}.
   */
  _bitmapsReady: number;
  /**
   * Gets actor.
   * @param index The index parameter.
   * @returns The result.
   */
  actor(index: number): Game_Actor | undefined;
  /**
   * Gets basic gauges x.
   * @param rect The rect parameter.
   * @returns The result.
   */
  basicGaugesX(rect: Rectangle): number;
  /**
   * Gets basic gauges y.
   * @param rect The rect parameter.
   * @returns The result.
   */
  basicGaugesY(rect: Rectangle): number;
  /**
   * Performs draw item.
   * @param index The index parameter.
   */
  drawItem(index: number): void;
  /**
   * Performs draw item image.
   * @param index The index parameter.
   */
  drawItemImage(index: number): void;
  /**
   * Performs draw item status.
   * @param index The index parameter.
   */
  drawItemStatus(index: number): void;
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
  faceRect(index: number): Rectangle;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: Rectangle): void;
  /**
   * Gets item height.
   * @returns The result.
   */
  itemHeight(): number;
  /**
   * Gets max cols.
   * @returns The result.
   */
  maxCols(): number;
  /**
   * Gets max items.
   * @returns The result.
   */
  maxItems(): number;
  /**
   * Gets name x.
   * @param rect The rect parameter.
   * @returns The result.
   */
  nameX(rect: Rectangle): number;
  /**
   * Gets name y.
   * @param rect The rect parameter.
   * @returns The result.
   */
  nameY(rect: Rectangle): number;
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
  selectActor(actor: Game_Actor): void;
  /**
   * Gets state icon x.
   * @param rect The rect parameter.
   * @returns The result.
   */
  stateIconX(rect: Rectangle): number;
  /**
   * Gets state icon y.
   * @param rect The rect parameter.
   * @returns The result.
   */
  stateIconY(rect: Rectangle): number;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates padding.
   */
  updatePadding(): void;
}
