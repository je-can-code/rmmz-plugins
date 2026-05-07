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
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _commonEventId: number;
  _interpreter: Game_Interpreter | null;
  event(): object;
  initialize(commonEventId: number): void;
  isActive(): boolean;
  list(): Array<{ code: number; indent: number; parameters: readonly (number | string | boolean | object | null)[] }>;
  refresh(): void;
  update(): void;
}
