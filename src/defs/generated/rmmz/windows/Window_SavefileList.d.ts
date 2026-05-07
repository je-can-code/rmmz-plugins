/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_SavefileList
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_SavefileList extends Window_Selectable
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link Window_SavefileList#initialize}.<br/>
   * Written in: {@link Window_SavefileList#initialize}, {@link Window_SavefileList#setMode}.<br/>
   * Read in: {@link Window_SavefileList#indexToSavefileId}, {@link Window_SavefileList#maxItems}, {@link Window_SavefileList#savefileIdToIndex}.<br/>
   */
  _autosave: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: {@link Window_SavefileList#initialize}.<br/>
   * Written in: {@link Window_SavefileList#initialize}, {@link Window_SavefileList#setMode}.<br/>
   * Read in: {@link Window_SavefileList#isEnabled}.<br/>
   */
  _mode: null;
  /**
   * Performs draw contents.
   * @param info The info parameter.
   * @param rect The rect parameter.
   */
  drawContents(info: unknown, rect: unknown): void;
  /**
   * Performs draw item.
   * @param index The index parameter.
   */
  drawItem(index: unknown): void;
  /**
   * Performs draw party characters.
   * @param info The info parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  drawPartyCharacters(info: unknown, x: unknown, y: unknown): void;
  /**
   * Performs draw playtime.
   * @param info The info parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param width The width parameter.
   */
  drawPlaytime(info: unknown, x: unknown, y: unknown, width: unknown): void;
  /**
   * Performs draw title.
   * @param savefileId The savefileId parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  drawTitle(savefileId: unknown, x: unknown, y: unknown): void;
  /**
   * Gets index to savefile id.
   * @param index The index parameter.
   * @returns The result.
   */
  indexToSavefileId(index: unknown): unknown;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: unknown): void;
  /**
   * Determines whether enabled.
   * @param savefileId The savefileId parameter.
   * @returns True if enabled; false otherwise.
   */
  isEnabled(savefileId: unknown): boolean;
  /**
   * Gets item height.
   * @returns The result.
   */
  itemHeight(): unknown;
  /**
   * Gets max items.
   * @returns The result.
   */
  maxItems(): unknown;
  /**
   * Gets num visible rows.
   * @returns The result.
   */
  numVisibleRows(): number;
  /**
   * Performs play ok sound.
   */
  playOkSound(): void;
  /**
   * Gets savefile id.
   * @returns The result.
   */
  savefileId(): unknown;
  /**
   * Gets savefile id to index.
   * @param savefileId The savefileId parameter.
   * @returns The result.
   */
  savefileIdToIndex(savefileId: unknown): unknown;
  /**
   * Performs select savefile.
   * @param savefileId The savefileId parameter.
   */
  selectSavefile(savefileId: unknown): void;
  /**
   * Sets mode.
   * @param mode The mode parameter.
   * @param autosave The autosave parameter.
   */
  setMode(mode: unknown, autosave: unknown): void;
}
