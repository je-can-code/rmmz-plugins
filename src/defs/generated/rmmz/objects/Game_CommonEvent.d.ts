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
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Game_CommonEvent#initialize}.<br/>
   * Written in: {@link Game_CommonEvent#initialize}.<br/>
   * Read in: {@link Game_CommonEvent#event}.<br/>
   */
  _commonEventId: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Game_Interpreter | null`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_CommonEvent#refresh}.<br/>
   * Read in: {@link Game_CommonEvent#refresh}, {@link Game_CommonEvent#update}.<br/>
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
