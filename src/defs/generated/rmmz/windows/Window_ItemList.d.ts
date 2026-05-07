/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_ItemList
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_ItemList
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _category: string;
  _data: unknown[];
  colSpacing(): number;
  drawItem(index: number): void;
  drawItemNumber(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null, x: number, y: number, width: number): void;
  includes(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  initialize(rect: Rectangle): void;
  isCurrentItemEnabled(): boolean;
  isEnabled(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  item(): RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null;
  itemAt(index: number): null;
  makeItemList(): void;
  maxCols(): number;
  maxItems(): number;
  needsNumber(): boolean;
  numberWidth(): number;
  refresh(): void;
  selectLast(): void;
  setCategory(category: string): void;
  updateHelp(): void;
}
