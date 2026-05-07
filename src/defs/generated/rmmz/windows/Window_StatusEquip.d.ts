/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_StatusEquip
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_StatusEquip extends Window_StatusBase
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: {@link Window_StatusEquip#initialize}.<br/>
   * Written in: {@link Window_StatusEquip#initialize}, {@link Window_StatusEquip#setActor}.<br/>
   * Read in: {@link Window_StatusEquip#drawItem}, {@link Window_StatusEquip#maxItems}, {@link Window_StatusEquip#setActor}.<br/>
   */
  _actor: null;
  /**
   * Performs draw item.
   * @param index The index parameter.
   */
  drawItem(index: unknown): void;
  /**
   * Performs draw item background.
   */
  drawItemBackground(): void;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: unknown): void;
  /**
   * Gets item height.
   * @returns The result.
   */
  itemHeight(): unknown;
  /**
   * Gets max items.
   * @returns The result.
   */
  maxItems(): number;
  /**
   * Sets actor.
   * @param actor The actor parameter.
   */
  setActor(actor: unknown): void;
}
