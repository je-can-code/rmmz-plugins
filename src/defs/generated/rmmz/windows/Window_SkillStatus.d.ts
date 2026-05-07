/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_SkillStatus
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_SkillStatus
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _actor: null | Game_Actor;
  initialize(rect: Rectangle): void;
  refresh(): void;
  setActor(actor: Game_Actor): void;
}
