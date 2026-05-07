/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Item
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Item extends Scene_ItemBase
{
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_ItemCategory`.
   * Initialized in: none.
   * Written in: {@link Scene_Item#createCategoryWindow}.
   * Read in: {@link Scene_Item#createCategoryWindow}, {@link Scene_Item#createItemWindow}, {@link Scene_Item#itemWindowRect}, {@link Scene_Item#onItemCancel}.
   */
  _categoryWindow: Window_ItemCategory;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_ItemList`.
   * Initialized in: none.
   * Written in: {@link Scene_Item#createItemWindow}.
   * Read in: {@link Scene_Item#createItemWindow}, {@link Scene_Item#onCategoryOk}, {@link Scene_Item#onItemCancel}, {@link Scene_Item#useItem}.
   */
  _itemWindow: Window_ItemList;
  /**
   * Gets category window rect.
   * @returns The result.
   */
  categoryWindowRect(): Rectangle;
  /**
   * Performs create.
   */
  create(): void;
  /**
   * Creates category window.
   */
  createCategoryWindow(): void;
  /**
   * Creates item window.
   */
  createItemWindow(): void;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Gets item window rect.
   * @returns The result.
   */
  itemWindowRect(): Rectangle;
  /**
   * Performs on category ok.
   */
  onCategoryOk(): void;
  /**
   * Performs on item cancel.
   */
  onItemCancel(): void;
  /**
   * Performs on item ok.
   */
  onItemOk(): void;
  /**
   * Performs play se for item.
   */
  playSeForItem(): void;
  /**
   * Performs use item.
   */
  useItem(): void;
  /**
   * Gets user.
   * @returns The result.
   */
  user(): Game_Actor | undefined;
}
