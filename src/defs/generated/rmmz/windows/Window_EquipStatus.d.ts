/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_EquipStatus
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_EquipStatus extends Window_StatusBase
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: {@link Window_EquipStatus#initialize}.<br/>
   * Written in: {@link Window_EquipStatus#initialize}, {@link Window_EquipStatus#setActor}.<br/>
   * Read in: {@link Window_EquipStatus#drawCurrentParam}, {@link Window_EquipStatus#drawItem}, {@link Window_EquipStatus#drawNewParam}, {@link Window_EquipStatus#refresh}, {@link Window_EquipStatus#setActor}.<br/>
   */
  _actor: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: {@link Window_EquipStatus#initialize}.<br/>
   * Written in: {@link Window_EquipStatus#initialize}, {@link Window_EquipStatus#setTempActor}.<br/>
   * Read in: {@link Window_EquipStatus#drawItem}, {@link Window_EquipStatus#drawNewParam}, {@link Window_EquipStatus#setTempActor}.<br/>
   */
  _tempActor: null;
  /**
   * Gets col spacing.
   * @returns The result.
   */
  colSpacing(): number;
  /**
   * Performs draw all params.
   */
  drawAllParams(): void;
  /**
   * Performs draw current param.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param paramId The paramId parameter.
   */
  drawCurrentParam(x: unknown, y: unknown, paramId: unknown): void;
  /**
   * Performs draw item.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param paramId The paramId parameter.
   */
  drawItem(x: unknown, y: unknown, paramId: unknown): void;
  /**
   * Performs draw new param.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param paramId The paramId parameter.
   */
  drawNewParam(x: unknown, y: unknown, paramId: unknown): void;
  /**
   * Performs draw param name.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param paramId The paramId parameter.
   */
  drawParamName(x: unknown, y: unknown, paramId: unknown): void;
  /**
   * Performs draw right arrow.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  drawRightArrow(x: unknown, y: unknown): void;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: unknown): void;
  /**
   * Gets param width.
   * @returns The result.
   */
  paramWidth(): number;
  /**
   * Gets param x.
   * @returns The result.
   */
  paramX(): unknown;
  /**
   * Gets param y.
   * @param index The index parameter.
   * @returns The result.
   */
  paramY(index: unknown): unknown;
  /**
   * Performs refresh.
   */
  refresh(): void;
  /**
   * Gets right arrow width.
   * @returns The result.
   */
  rightArrowWidth(): number;
  /**
   * Sets actor.
   * @param actor The actor parameter.
   */
  setActor(actor: unknown): void;
  /**
   * Sets temp actor.
   * @param tempActor The tempActor parameter.
   */
  setTempActor(tempActor: unknown): void;
}
