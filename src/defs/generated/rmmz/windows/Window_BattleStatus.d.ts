/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_BattleStatus
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_BattleStatus
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _bitmapsReady: number;
  actor(index: number): Game_Actor | undefined;
  basicGaugesX(rect: Rectangle): number;
  basicGaugesY(rect: Rectangle): number;
  drawItem(index: number): void;
  drawItemImage(index: number): void;
  drawItemStatus(index: number): void;
  extraHeight(): number;
  faceRect(index: number): Rectangle;
  initialize(rect: Rectangle): void;
  itemHeight(): number;
  maxCols(): number;
  maxItems(): number;
  nameX(rect: Rectangle): number;
  nameY(rect: Rectangle): number;
  performPartyRefresh(): void;
  preparePartyRefresh(): void;
  rowSpacing(): number;
  selectActor(actor: Game_Actor): void;
  stateIconX(rect: Rectangle): number;
  stateIconY(rect: Rectangle): number;
  update(): void;
  updatePadding(): void;
}
