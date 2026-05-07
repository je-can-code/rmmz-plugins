/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Skill
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Skill
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _itemWindow: Window_SkillList;
  _skillTypeWindow: Window_SkillType;
  _statusWindow: Window_SkillStatus;
  arePageButtonsEnabled(): boolean;
  commandSkill(): void;
  create(): void;
  createItemWindow(): void;
  createSkillTypeWindow(): void;
  createStatusWindow(): void;
  initialize(): void;
  itemWindowRect(): Rectangle;
  needsPageButtons(): boolean;
  onActorChange(): void;
  onItemCancel(): void;
  onItemOk(): void;
  playSeForItem(): void;
  refreshActor(): void;
  skillTypeWindowRect(): Rectangle;
  start(): void;
  statusWindowRect(): Rectangle;
  useItem(): void;
  user(): Game_Actor | undefined;
}
