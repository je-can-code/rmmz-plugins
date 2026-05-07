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
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _data: unknown[];
  actor(actorId: number): Game_Actor | null;
  initialize(): void;
}
