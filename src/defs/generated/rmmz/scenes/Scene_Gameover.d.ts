/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Gameover
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Gameover
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _backSprite: Sprite;
  adjustBackground(): void;
  create(): void;
  createBackground(): void;
  gotoTitle(): void;
  initialize(): void;
  isTriggered(): boolean;
  playGameoverMusic(): void;
  start(): void;
  stop(): void;
  terminate(): void;
  update(): void;
}
