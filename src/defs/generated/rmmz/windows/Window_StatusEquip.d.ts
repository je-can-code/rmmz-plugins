/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_StatusEquip
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_StatusEquip
{
  /**
   * Inferred engine backing field.
   *
   * Type: `null | Game_Actor`.
   * Initialized in: {@link Window_StatusEquip#initialize}.
   * Written in: {@link Window_StatusEquip#initialize}, {@link Window_StatusEquip#setActor}.
   * Read in: {@link Window_StatusEquip#drawItem}, {@link Window_StatusEquip#maxItems}, {@link Window_StatusEquip#setActor}.
   */
  _actor: null | Game_Actor;
  /**
   * Performs draw item.
   * @param index The index parameter.
   */
  drawItem(index: number): void;
  /**
   * Performs draw item background.
   */
  drawItemBackground(): void;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: Rectangle): void;
  /**
   * Gets item height.
   * @returns The result.
   */
  itemHeight(): number;
  /**
   * Gets max items.
   * @returns The result.
   */
  maxItems(): number;
  /**
   * Sets actor.
   * @param actor The actor parameter.
   */
  setActor(actor: Game_Actor): void;
}
