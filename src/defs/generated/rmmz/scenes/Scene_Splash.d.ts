/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Splash
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Splash
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _backSprite: Sprite;
  _waitCount: number;
  adjustBackground(): void;
  checkSkip(): void;
  create(): void;
  createBackground(): void;
  gotoTitle(): void;
  initWaitCount(): void;
  initialize(): void;
  isEnabled(): boolean;
  start(): void;
  stop(): void;
  update(): void;
  updateWaitCount(): boolean;
}
