/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_Help
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_Help
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _text: string;
  clear(): void;
  initialize(rect: Rectangle): void;
  refresh(): void;
  setItem(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): void;
  setText(text: string): void;
}
