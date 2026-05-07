/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_SkillType
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_SkillType
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _actor: null | Game_Actor;
  _skillWindow: Window_Base;
  initialize(rect: Rectangle): void;
  makeCommandList(): void;
  selectLast(): void;
  setActor(actor: Game_Actor): void;
  setSkillWindow(skillWindow: Window_Base): void;
  update(): void;
}
