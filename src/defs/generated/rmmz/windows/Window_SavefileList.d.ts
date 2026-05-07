/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_SavefileList
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_SavefileList
{
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: {@link Window_SavefileList#initialize}.
   * Written in: {@link Window_SavefileList#initialize}, {@link Window_SavefileList#setMode}.
   * Read in: {@link Window_SavefileList#indexToSavefileId}, {@link Window_SavefileList#maxItems}, {@link Window_SavefileList#savefileIdToIndex}.
   */
  _autosave: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `null | string`.
   * Initialized in: {@link Window_SavefileList#initialize}.
   * Written in: {@link Window_SavefileList#initialize}, {@link Window_SavefileList#setMode}.
   * Read in: {@link Window_SavefileList#isEnabled}.
   */
  _mode: null | string;
  /**
   * Performs draw contents.
   * @param info The info parameter.
   * @param rect The rect parameter.
   */
  drawContents(info: object, rect: Rectangle): void;
  /**
   * Performs draw item.
   * @param index The index parameter.
   */
  drawItem(index: number): void;
  /**
   * Performs draw party characters.
   * @param info The info parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  drawPartyCharacters(info: object, x: number, y: number): void;
  /**
   * Performs draw playtime.
   * @param info The info parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param width The width parameter.
   */
  drawPlaytime(info: object, x: number, y: number, width: number): void;
  /**
   * Performs draw title.
   * @param savefileId The savefileId parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  drawTitle(savefileId: number, x: number, y: number): void;
  /**
   * Gets index to savefile id.
   * @param index The index parameter.
   * @returns The result.
   */
  indexToSavefileId(index: number): number;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: Rectangle): void;
  /**
   * Determines whether enabled.
   * @param savefileId The savefileId parameter.
   * @returns True if enabled; false otherwise.
   */
  isEnabled(savefileId: number): boolean;
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
  savefileId(): number;
  /**
   * Gets savefile id to index.
   * @param savefileId The savefileId parameter.
   * @returns The result.
   */
  savefileIdToIndex(savefileId: number): number;
  /**
   * Performs select savefile.
   * @param savefileId The savefileId parameter.
   */
  selectSavefile(savefileId: number): void;
  /**
   * Sets mode.
   * @param mode The mode parameter.
   * @param autosave The autosave parameter.
   */
  setMode(mode: string, autosave: boolean): void;
}
