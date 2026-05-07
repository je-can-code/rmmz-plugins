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
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Window_ItemCategory`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Scene_Item#createCategoryWindow}.<br/>
   * Read in: {@link Scene_Item#createCategoryWindow}, {@link Scene_Item#createItemWindow}, {@link Scene_Item#itemWindowRect}, {@link Scene_Item#onItemCancel}.<br/>
   */
  _categoryWindow: Window_ItemCategory;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Window_ItemList`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Scene_Item#createItemWindow}.<br/>
   * Read in: {@link Scene_Item#createItemWindow}, {@link Scene_Item#onCategoryOk}, {@link Scene_Item#onItemCancel}, {@link Scene_Item#useItem}.<br/>
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
