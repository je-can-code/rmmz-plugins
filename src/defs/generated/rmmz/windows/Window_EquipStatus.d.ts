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
   * Inferred engine backing field.
   *
   * Type: `null | Game_Actor`.
   * Initialized in: {@link Window_EquipStatus#initialize}.
   * Written in: {@link Window_EquipStatus#initialize}, {@link Window_EquipStatus#setActor}.
   * Read in: {@link Window_EquipStatus#drawCurrentParam}, {@link Window_EquipStatus#drawItem}, {@link Window_EquipStatus#drawNewParam}, {@link Window_EquipStatus#refresh}, {@link Window_EquipStatus#setActor}.
   */
  _actor: null | Game_Actor;
  /**
   * Inferred engine backing field.
   *
   * Type: `null | Game_Actor`.
   * Initialized in: {@link Window_EquipStatus#initialize}.
   * Written in: {@link Window_EquipStatus#initialize}, {@link Window_EquipStatus#setTempActor}.
   * Read in: {@link Window_EquipStatus#drawItem}, {@link Window_EquipStatus#drawNewParam}, {@link Window_EquipStatus#setTempActor}.
   */
  _tempActor: null | Game_Actor;
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
  drawCurrentParam(x: number, y: number, paramId: number): void;
  /**
   * Performs draw item.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param paramId The paramId parameter.
   */
  drawItem(x: number, y: number, paramId: number): void;
  /**
   * Performs draw new param.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param paramId The paramId parameter.
   */
  drawNewParam(x: number, y: number, paramId: number): void;
  /**
   * Performs draw param name.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param paramId The paramId parameter.
   */
  drawParamName(x: number, y: number, paramId: number): void;
  /**
   * Performs draw right arrow.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  drawRightArrow(x: number, y: number): void;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: Rectangle): void;
  /**
   * Gets param width.
   * @returns The result.
   */
  paramWidth(): number;
  /**
   * Gets param x.
   * @returns The result.
   */
  paramX(): number;
  /**
   * Gets param y.
   * @param index The index parameter.
   * @returns The result.
   */
  paramY(index: number): number;
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
  setActor(actor: Game_Actor): void;
  /**
   * Sets temp actor.
   * @param tempActor The tempActor parameter.
   */
  setTempActor(tempActor: Game_Actor): void;
}
