/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_ShopSell
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_ShopSell
{
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: Rectangle): void;
  /**
   * Determines whether enabled.
   * @param item The item parameter.
   * @returns True if enabled; false otherwise.
   */
  isEnabled(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
}
