/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_ActorCommand
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_ActorCommand
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _actor: null | Game_Actor;
  actor(): Game_Actor | undefined;
  addAttackCommand(): void;
  addGuardCommand(): void;
  addItemCommand(): void;
  addSkillCommands(): void;
  initialize(rect: Rectangle): void;
  makeCommandList(): void;
  processOk(): void;
  selectLast(): void;
  setup(actor: Game_Actor): void;
}
