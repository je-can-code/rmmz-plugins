/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_File
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_File extends Scene_MenuBase
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Window_Help`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Scene_File#createHelpWindow}.<br/>
   * Read in: {@link Scene_File#create}, {@link Scene_File#createHelpWindow}, {@link Scene_File#listWindowRect}.<br/>
   */
  _helpWindow: Window_Help;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Window_SavefileList`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Scene_File#createListWindow}.<br/>
   * Read in: {@link Scene_File#activateListWindow}, {@link Scene_File#createListWindow}, {@link Scene_File#isSavefileEnabled}, {@link Scene_File#savefileId}, {@link Scene_File#start}.<br/>
   */
  _listWindow: Window_SavefileList;
  /**
   * Performs activate list window.
   */
  activateListWindow(): void;
  /**
   * Performs create.
   */
  create(): void;
  /**
   * Creates help window.
   */
  createHelpWindow(): void;
  /**
   * Creates list window.
   */
  createListWindow(): void;
  /**
   * Gets first savefile id.
   * @returns The result.
   */
  firstSavefileId(): number;
  /**
   * Gets help area height.
   * @returns The result.
   */
  helpAreaHeight(): number;
  /**
   * Gets help window rect.
   * @returns The result.
   */
  helpWindowRect(): Rectangle;
  /**
   * Gets help window text.
   * @returns The result.
   */
  helpWindowText(): string;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Determines whether savefile enabled.
   * @param savefileId The savefileId parameter.
   * @returns True if savefile enabled; false otherwise.
   */
  isSavefileEnabled(savefileId: number): boolean;
  /**
   * Gets list window rect.
   * @returns The result.
   */
  listWindowRect(): Rectangle;
  /**
   * Gets mode.
   * @returns The result.
   */
  mode(): null;
  /**
   * Gets needs autosave.
   * @returns The result.
   */
  needsAutosave(): boolean;
  /**
   * Performs on savefile ok.
   */
  onSavefileOk(): void;
  /**
   * Gets savefile id.
   * @returns The result.
   */
  savefileId(): number;
  /**
   * Performs start.
   */
  start(): void;
}
