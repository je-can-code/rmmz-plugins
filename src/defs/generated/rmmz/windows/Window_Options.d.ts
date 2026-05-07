/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_Options
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_Options extends Window_Command
{
  /**
   * Adds general options.
   */
  addGeneralOptions(): void;
  /**
   * Adds volume options.
   */
  addVolumeOptions(): void;
  /**
   * Gets boolean status text.
   * @param value The value parameter.
   * @returns The result.
   */
  booleanStatusText(value: unknown): string;
  /**
   * Performs change value.
   * @param _symbol The symbol parameter.
   * @param value The value parameter.
   */
  changeValue(_symbol: unknown, value: unknown): void;
  /**
   * Performs change volume.
   * @param _symbol The symbol parameter.
   * @param forward The forward parameter.
   * @param wrap The wrap parameter.
   */
  changeVolume(_symbol: unknown, forward: unknown, wrap: unknown): void;
  /**
   * Performs cursor left.
   */
  cursorLeft(): void;
  /**
   * Performs cursor right.
   */
  cursorRight(): void;
  /**
   * Performs draw item.
   * @param index The index parameter.
   */
  drawItem(index: unknown): void;
  /**
   * Gets config value.
   * @param _symbol The symbol parameter.
   * @returns The result.
   */
  getConfigValue(_symbol: unknown): unknown;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: unknown): void;
  /**
   * Determines whether volume symbol.
   * @param _symbol The symbol parameter.
   * @returns True if volume symbol; false otherwise.
   */
  isVolumeSymbol(_symbol: unknown): boolean;
  /**
   * Creates command list.
   */
  makeCommandList(): void;
  /**
   * Performs process ok.
   */
  processOk(): void;
  /**
   * Sets config value.
   * @param _symbol The symbol parameter.
   * @param volume The volume parameter.
   */
  setConfigValue(_symbol: unknown, volume: unknown): void;
  /**
   * Gets status text.
   * @param index The index parameter.
   * @returns The result.
   */
  statusText(index: unknown): unknown;
  /**
   * Gets status width.
   * @returns The result.
   */
  statusWidth(): number;
  /**
   * Gets volume offset.
   * @returns The result.
   */
  volumeOffset(): number;
  /**
   * Gets volume status text.
   * @param value The value parameter.
   * @returns The result.
   */
  volumeStatusText(value: unknown): string;
}
