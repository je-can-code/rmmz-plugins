/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_MenuCommand
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_MenuCommand extends Window_Command
{
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: {@link Window_MenuCommand#initialize}.
   * Written in: {@link Window_MenuCommand#initialize}.
   * Read in: none.
   */
  _canRepeat: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `null`.
   * Initialized in: module init.
   * Written in: module init, {@link Window_MenuCommand#initCommandPosition}.
   * Read in: none.
   */
  _lastCommandSymbol: null;
  /**
   * Adds formation command.
   */
  addFormationCommand(): void;
  /**
   * Adds game end command.
   */
  addGameEndCommand(): void;
  /**
   * Adds main commands.
   */
  addMainCommands(): void;
  /**
   * Adds options command.
   */
  addOptionsCommand(): void;
  /**
   * Adds original commands.
   */
  addOriginalCommands(): void;
  /**
   * Adds save command.
   */
  addSaveCommand(): void;
  /**
   * Gets are main commands enabled.
   * @returns The result.
   */
  areMainCommandsEnabled(): boolean;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: Rectangle): void;
  /**
   * Determines whether formation enabled.
   * @returns True if formation enabled; false otherwise.
   */
  isFormationEnabled(): boolean;
  /**
   * Determines whether game end enabled.
   * @returns True if game end enabled; false otherwise.
   */
  isGameEndEnabled(): boolean;
  /**
   * Determines whether options enabled.
   * @returns True if options enabled; false otherwise.
   */
  isOptionsEnabled(): boolean;
  /**
   * Determines whether save enabled.
   * @returns True if save enabled; false otherwise.
   */
  isSaveEnabled(): boolean;
  /**
   * Creates command list.
   */
  makeCommandList(): void;
  /**
   * Gets needs command.
   * @param name The name parameter.
   * @returns The result.
   */
  needsCommand(name: string): boolean;
  /**
   * Performs process ok.
   */
  processOk(): void;
  /**
   * Performs select last.
   */
  selectLast(): void;
}
declare namespace Window_MenuCommand
{
  /**
   * Initializes command position.
   */
  function initCommandPosition(): void;
}
