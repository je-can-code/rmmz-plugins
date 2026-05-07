/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Timer
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Timer
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _frames: number;
  _working: boolean;
  frames(): number;
  initialize(): void;
  isWorking(): boolean;
  onExpire(): void;
  seconds(): number;
  start(count: number): void;
  stop(): void;
  update(sceneActive: boolean): void;
}
