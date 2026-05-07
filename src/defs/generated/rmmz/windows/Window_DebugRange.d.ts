/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_DebugRange
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_DebugRange extends Window_Selectable
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Window_Base`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_DebugRange#setEditWindow}.<br/>
   * Read in: {@link Window_DebugRange#update}.<br/>
   */
  _editWindow: Window_Base;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: {@link Window_DebugRange#initialize}.<br/>
   * Written in: {@link Window_DebugRange#initialize}.<br/>
   * Read in: {@link Window_DebugRange#isSwitchMode}, {@link Window_DebugRange#maxItems}, {@link Window_DebugRange#topId}.<br/>
   */
  _maxSwitches: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: {@link Window_DebugRange#initialize}.<br/>
   * Written in: {@link Window_DebugRange#initialize}.<br/>
   * Read in: {@link Window_DebugRange#maxItems}.<br/>
   */
  _maxVariables: unknown;
  /**
   * Performs draw item.
   * @param index The index parameter.
   */
  drawItem(index: number): void;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: Rectangle): void;
  /**
   * Determines whether cancel triggered.
   * @returns True if cancel triggered; false otherwise.
   */
  isCancelTriggered(): boolean;
  /**
   * Determines whether switch mode.
   * @param index The index parameter.
   * @returns True if switch mode; false otherwise.
   */
  isSwitchMode(index: number): boolean;
  /**
   * Gets max items.
   * @returns The result.
   */
  maxItems(): number;
  /**
   * Gets mode.
   * @param index The index parameter.
   * @returns The result.
   */
  mode(index: number): string;
  /**
   * Performs process cancel.
   */
  processCancel(): void;
  /**
   * Sets edit window.
   * @param editWindow The editWindow parameter.
   */
  setEditWindow(editWindow: Window_Base): void;
  /**
   * Gets top id.
   * @param index The index parameter.
   * @returns The result.
   */
  topId(index: number): number;
  /**
   * Performs update.
   */
  update(): void;
}
declare namespace Window_DebugRange
{
  /**
   * Engine static constant.
   */
  const lastIndex: 0;
  /**
   * Engine static constant.
   */
  const lastTopRow: 0;
}
