/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Item
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Item
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _categoryWindow: Window_ItemCategory;
  _itemWindow: Window_ItemList;
  categoryWindowRect(): Rectangle;
  create(): void;
  createCategoryWindow(): void;
  createItemWindow(): void;
  initialize(): void;
  itemWindowRect(): Rectangle;
  onCategoryOk(): void;
  onItemCancel(): void;
  onItemOk(): void;
  playSeForItem(): void;
  useItem(): void;
  user(): Game_Actor | undefined;
}
