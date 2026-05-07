/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_Status
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_Status extends Window_StatusBase
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: {@link Window_Status#initialize}.<br/>
   * Written in: {@link Window_Status#initialize}, {@link Window_Status#setActor}.<br/>
   * Read in: {@link Window_Status#drawBasicInfo}, {@link Window_Status#drawBlock1}, {@link Window_Status#drawBlock2}, {@link Window_Status#expNextValue}, {@link Window_Status#expTotalValue}, {@link Window_Status#refresh}, {@link Window_Status#setActor}.<br/>
   */
  _actor: null;
  /**
   * Gets block1 y.
   * @returns The result.
   */
  block1Y(): number;
  /**
   * Gets block2 y.
   * @returns The result.
   */
  block2Y(): unknown;
  /**
   * Performs draw basic info.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  drawBasicInfo(x: unknown, y: unknown): void;
  /**
   * Performs draw block1.
   */
  drawBlock1(): void;
  /**
   * Performs draw block2.
   */
  drawBlock2(): void;
  /**
   * Performs draw exp info.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  drawExpInfo(x: unknown, y: unknown): void;
  /**
   * Gets exp next value.
   * @returns The result.
   */
  expNextValue(): string;
  /**
   * Gets exp total value.
   * @returns The result.
   */
  expTotalValue(): string;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: unknown): void;
  /**
   * Performs refresh.
   */
  refresh(): void;
  /**
   * Sets actor.
   * @param actor The actor parameter.
   */
  setActor(actor: unknown): void;
}
