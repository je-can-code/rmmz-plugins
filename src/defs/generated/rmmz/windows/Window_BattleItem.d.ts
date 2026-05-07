/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_BattleItem
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_BattleItem
{
  /**
   * Performs hide.
   */
  hide(): void;
  /**
   * Gets includes.
   * @param item The item parameter.
   * @returns The result.
   */
  includes(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: Rectangle): void;
  /**
   * Performs show.
   */
  show(): void;
}
