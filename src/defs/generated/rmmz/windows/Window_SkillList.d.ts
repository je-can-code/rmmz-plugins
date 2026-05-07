/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_SkillList
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_SkillList
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _actor: null | Game_Actor;
  _data: unknown[];
  _stypeId: number;
  colSpacing(): number;
  costWidth(): number;
  drawItem(index: number): void;
  drawSkillCost(skill: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null, x: number, y: number, width: number): void;
  includes(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  initialize(rect: Rectangle): void;
  isCurrentItemEnabled(): boolean;
  isEnabled(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  item(): RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null;
  itemAt(index: number): null;
  makeItemList(): void;
  maxCols(): number;
  maxItems(): number;
  refresh(): void;
  selectLast(): void;
  setActor(actor: Game_Actor): void;
  setStypeId(stypeId: number): void;
  updateHelp(): void;
}
