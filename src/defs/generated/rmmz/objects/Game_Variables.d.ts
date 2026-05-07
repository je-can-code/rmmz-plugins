/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Variables
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Variables
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Variables#clear}.<br/>
   * Read in: {@link Game_Variables#setValue}, {@link Game_Variables#value}.<br/>
   */
  _data: unknown[];
  /**
   * Performs clear.
   */
  clear(): void;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Performs on change.
   */
  onChange(): void;
  /**
   * Sets value.
   * @param variableId The variableId parameter.
   * @param value The value parameter.
   */
  setValue(variableId: number, value: number): void;
  /**
   * Gets value.
   * @param variableId The variableId parameter.
   * @returns The result.
   */
  value(variableId: number): number;
}
