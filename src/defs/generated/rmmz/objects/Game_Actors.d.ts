/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Actors
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Actors
{
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown[]`.
   * Initialized in: {@link Game_Actors#initialize}.
   * Written in: {@link Game_Actors#initialize}.
   * Read in: {@link Game_Actors#actor}.
   */
  _data: unknown[];
  /**
   * Gets actor.
   * @param actorId The actorId parameter.
   * @returns The result.
   */
  actor(actorId: number): Game_Actor | null;
  /**
   * Initializes initialize.
   */
  initialize(): void;
}
