/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_Status
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_Status
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _actor: null | Game_Actor;
  block1Y(): number;
  block2Y(): number;
  drawBasicInfo(x: number, y: number): void;
  drawBlock1(): void;
  drawBlock2(): void;
  drawExpInfo(x: number, y: number): void;
  expNextValue(): string;
  expTotalValue(): string;
  initialize(rect: Rectangle): void;
  refresh(): void;
  setActor(actor: Game_Actor): void;
}
