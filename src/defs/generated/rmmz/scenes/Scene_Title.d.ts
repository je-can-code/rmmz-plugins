/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Title
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Title
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _backSprite1: Sprite;
  _backSprite2: Sprite;
  _commandWindow: Window_TitleCommand;
  _gameTitleSprite: Sprite;
  adjustBackground(): void;
  commandContinue(): void;
  commandNewGame(): void;
  commandOptions(): void;
  commandWindowRect(): Rectangle;
  create(): void;
  createBackground(): void;
  createCommandWindow(): void;
  createForeground(): void;
  drawGameTitle(): void;
  initialize(): void;
  isBusy(): boolean;
  playTitleMusic(): void;
  start(): void;
  terminate(): void;
  update(): void;
}
