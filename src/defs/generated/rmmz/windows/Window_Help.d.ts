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
   * Inferred engine backing field.
   *
   * Type: `string`.
   * Initialized in: {@link Window_Help#initialize}.
   * Written in: {@link Window_Help#initialize}, {@link Window_Help#setText}.
   * Read in: {@link Window_Help#refresh}, {@link Window_Help#setText}.
   */
  _text: string;
  /**
   * Performs clear.
   */
  clear(): void;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: Rectangle): void;
  /**
   * Performs refresh.
   */
  refresh(): void;
  /**
   * Sets item.
   * @param item The item parameter.
   */
  setItem(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): void;
  /**
   * Sets text.
   * @param text The text parameter.
   */
  setText(text: string): void;
}
