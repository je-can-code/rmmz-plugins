/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_Command
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_Command extends Window_Selectable
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_Command#clearCommandList}.<br/>
   * Read in: {@link Window_Command#addCommand}, {@link Window_Command#commandName}, {@link Window_Command#commandSymbol}, {@link Window_Command#currentData}, {@link Window_Command#findExt}, {@link Window_Command#findSymbol}, {@link Window_Command#isCommandEnabled}, {@link Window_Command#maxItems}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `.length`: {@link Window_Command#maxItems}.<br/>
   * - `push()`: {@link Window_Command#addCommand}.<br/>
   */
  _list: unknown[];
  /**
   * Adds command.
   * @param name The name parameter.
   * @param _symbol The symbol parameter.
   * @param enabled The enabled parameter.
   * @param ext The ext parameter.
   */
  addCommand(name: unknown, _symbol: unknown, enabled?: unknown, ext?: unknown): void;
  /**
   * Performs call ok handler.
   */
  callOkHandler(): void;
  /**
   * Clears command list.
   */
  clearCommandList(): void;
  /**
   * Gets command name.
   * @param index The index parameter.
   * @returns The result.
   */
  commandName(index: unknown): unknown;
  /**
   * Gets command symbol.
   * @param index The index parameter.
   * @returns The result.
   */
  commandSymbol(index: unknown): unknown;
  /**
   * Gets current data.
   * @returns The result.
   */
  currentData(): null;
  /**
   * Gets current ext.
   * @returns The result.
   */
  currentExt(): null;
  /**
   * Gets current symbol.
   * @returns The result.
   */
  currentSymbol(): null;
  /**
   * Performs draw item.
   * @param index The index parameter.
   */
  drawItem(index: unknown): void;
  /**
   * Gets find ext.
   * @param ext The ext parameter.
   * @returns The result.
   */
  findExt(ext: unknown): unknown;
  /**
   * Gets find symbol.
   * @param _symbol The symbol parameter.
   * @returns The result.
   */
  findSymbol(_symbol: unknown): unknown;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: unknown): void;
  /**
   * Determines whether command enabled.
   * @param index The index parameter.
   * @returns True if command enabled; false otherwise.
   */
  isCommandEnabled(index: unknown): boolean;
  /**
   * Determines whether current item enabled.
   * @returns True if current item enabled; false otherwise.
   */
  isCurrentItemEnabled(): boolean;
  /**
   * Determines whether ok enabled.
   * @returns True if ok enabled; false otherwise.
   */
  isOkEnabled(): boolean;
  /**
   * Gets item text align.
   * @returns The result.
   */
  itemTextAlign(): string;
  /**
   * Creates command list.
   */
  makeCommandList(): void;
  /**
   * Gets max items.
   * @returns The result.
   */
  maxItems(): unknown;
  /**
   * Performs refresh.
   */
  refresh(): void;
  /**
   * Performs select ext.
   * @param ext The ext parameter.
   */
  selectExt(ext: unknown): void;
  /**
   * Performs select symbol.
   * @param _symbol The symbol parameter.
   */
  selectSymbol(_symbol: unknown): void;
}
