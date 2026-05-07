/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_StatusParams
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_StatusParams
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _actor: null | Game_Actor;
  drawItem(index: number): void;
  drawItemBackground(): void;
  initialize(rect: Rectangle): void;
  itemHeight(): number;
  maxItems(): number;
  setActor(actor: Game_Actor): void;
}
