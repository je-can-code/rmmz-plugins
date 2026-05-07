/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_MenuActor
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_MenuActor
{
  initialize(rect: Rectangle): void;
  processOk(): void;
  selectForItem(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): void;
  selectLast(): void;
}
