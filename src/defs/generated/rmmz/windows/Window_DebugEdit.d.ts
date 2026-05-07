/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_DebugEdit
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_DebugEdit extends Window_Selectable
{
  /**
   * Inferred engine backing field.
   *
   * Type: `string`.
   * Initialized in: {@link Window_DebugEdit#initialize}.
   * Written in: {@link Window_DebugEdit#initialize}, {@link Window_DebugEdit#setMode}.
   * Read in: {@link Window_DebugEdit#itemName}, {@link Window_DebugEdit#itemStatus}, {@link Window_DebugEdit#setMode}, {@link Window_DebugEdit#update}.
   */
  _mode: string;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Window_DebugEdit#initialize}.
   * Written in: {@link Window_DebugEdit#initialize}, {@link Window_DebugEdit#setTopId}.
   * Read in: {@link Window_DebugEdit#currentId}, {@link Window_DebugEdit#drawItem}, {@link Window_DebugEdit#setTopId}.
   */
  _topId: number;
  /**
   * Gets current id.
   * @returns The result.
   */
  currentId(): number;
  /**
   * Gets delta for variable.
   * @returns The result.
   */
  deltaForVariable(): number;
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
   * Gets item name.
   * @param dataId The dataId parameter.
   * @returns The result.
   */
  itemName(dataId: number): string;
  /**
   * Gets item status.
   * @param dataId The dataId parameter.
   * @returns The result.
   */
  itemStatus(dataId: number): string;
  /**
   * Gets max items.
   * @returns The result.
   */
  maxItems(): number;
  /**
   * Sets mode.
   * @param mode The mode parameter.
   */
  setMode(mode: string): void;
  /**
   * Sets top id.
   * @param id The id parameter.
   */
  setTopId(id: number): void;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates switch.
   */
  updateSwitch(): void;
  /**
   * Updates variable.
   */
  updateVariable(): void;
}
