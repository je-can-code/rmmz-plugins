/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_MenuStatus
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_MenuStatus extends Window_StatusBase
{
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: {@link Window_MenuStatus#initialize}.
   * Written in: {@link Window_MenuStatus#initialize}, {@link Window_MenuStatus#setFormationMode}.
   * Read in: {@link Window_MenuStatus#formationMode}, {@link Window_MenuStatus#isCurrentItemEnabled}.
   */
  _formationMode: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Window_MenuStatus#initialize}.
   * Written in: {@link Window_MenuStatus#initialize}, {@link Window_MenuStatus#setPendingIndex}.
   * Read in: {@link Window_MenuStatus#drawPendingItemBackground}, {@link Window_MenuStatus#pendingIndex}, {@link Window_MenuStatus#setPendingIndex}.
   */
  _pendingIndex: number;
  /**
   * Gets actor.
   * @param index The index parameter.
   * @returns The result.
   */
  actor(index: number): Game_Actor | undefined;
  /**
   * Performs draw item.
   * @param index The index parameter.
   */
  drawItem(index: number): void;
  /**
   * Performs draw item image.
   * @param index The index parameter.
   */
  drawItemImage(index: number): void;
  /**
   * Performs draw item status.
   * @param index The index parameter.
   */
  drawItemStatus(index: number): void;
  /**
   * Performs draw pending item background.
   * @param index The index parameter.
   */
  drawPendingItemBackground(index: number): void;
  /**
   * Gets formation mode.
   * @returns The result.
   */
  formationMode(): boolean;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: Rectangle): void;
  /**
   * Determines whether current item enabled.
   * @returns True if current item enabled; false otherwise.
   */
  isCurrentItemEnabled(): boolean;
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
   * Gets pending index.
   * @returns The result.
   */
  pendingIndex(): number;
  /**
   * Performs process ok.
   */
  processOk(): void;
  /**
   * Performs select last.
   */
  selectLast(): void;
  /**
   * Sets formation mode.
   * @param formationMode The formationMode parameter.
   */
  setFormationMode(formationMode: boolean): void;
  /**
   * Sets pending index.
   * @param index The index parameter.
   */
  setPendingIndex(index: number): void;
}
