/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_CommonEvent
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_CommonEvent
{
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Game_CommonEvent#initialize}.
   * Written in: {@link Game_CommonEvent#initialize}.
   * Read in: {@link Game_CommonEvent#event}.
   */
  _commonEventId: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `Game_Interpreter | null`.
   * Initialized in: none.
   * Written in: {@link Game_CommonEvent#refresh}.
   * Read in: {@link Game_CommonEvent#refresh}, {@link Game_CommonEvent#update}.
   */
  _interpreter: Game_Interpreter | null;
  /**
   * Gets event.
   * @returns The result.
   */
  event(): object;
  /**
   * Initializes initialize.
   * @param commonEventId The commonEventId parameter.
   */
  initialize(commonEventId: number): void;
  /**
   * Determines whether active.
   * @returns True if active; false otherwise.
   */
  isActive(): boolean;
  /**
   * Gets list.
   * @returns The result.
   */
  list(): Array<{ code: number; indent: number; parameters: readonly (number | string | boolean | object | null)[] }>;
  /**
   * Performs refresh.
   */
  refresh(): void;
  /**
   * Performs update.
   */
  update(): void;
}
