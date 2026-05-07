/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_EquipStatus
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_EquipStatus
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _actor: null | Game_Actor;
  _tempActor: null | Game_Actor;
  colSpacing(): number;
  drawAllParams(): void;
  drawCurrentParam(x: number, y: number, paramId: number): void;
  drawItem(x: number, y: number, paramId: number): void;
  drawNewParam(x: number, y: number, paramId: number): void;
  drawParamName(x: number, y: number, paramId: number): void;
  drawRightArrow(x: number, y: number): void;
  initialize(rect: Rectangle): void;
  paramWidth(): number;
  paramX(): number;
  paramY(index: number): number;
  refresh(): void;
  rightArrowWidth(): number;
  setActor(actor: Game_Actor): void;
  setTempActor(tempActor: Game_Actor): void;
}
