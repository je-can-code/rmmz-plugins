/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Switches
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Switches
{
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown[]`.
   * Initialized in: none.
   * Written in: {@link Game_Switches#clear}.
   * Read in: {@link Game_Switches#setValue}, {@link Game_Switches#value}.
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
   * @param switchId The switchId parameter.
   * @param value The value parameter.
   */
  setValue(switchId: number, value: boolean): void;
  /**
   * Gets value.
   * @param switchId The switchId parameter.
   * @returns The result.
   */
  value(switchId: number): boolean;
}
