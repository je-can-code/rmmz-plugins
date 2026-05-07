/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_SelfSwitches
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_SelfSwitches
{
  /**
   * Inferred engine backing field.
   *
   * Type: `object`.
   * Initialized in: none.
   * Written in: {@link Game_SelfSwitches#clear}.
   * Read in: {@link Game_SelfSwitches#setValue}, {@link Game_SelfSwitches#value}.
   */
  _data: object;
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
   * @param key The key parameter.
   * @param value The value parameter.
   */
  setValue(key: string, value: boolean): void;
  /**
   * Gets value.
   * @param key The key parameter.
   * @returns The result.
   */
  value(key: string): boolean;
}
