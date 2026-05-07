/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Gameover
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Gameover extends Scene_Base
{
  /**
   * Inferred engine backing field.
   *
   * Type: `Sprite`.
   * Initialized in: none.
   * Written in: {@link Scene_Gameover#createBackground}.
   * Read in: {@link Scene_Gameover#adjustBackground}, {@link Scene_Gameover#createBackground}.
   */
  _backSprite: Sprite;
  /**
   * Performs adjust background.
   */
  adjustBackground(): void;
  /**
   * Performs create.
   */
  create(): void;
  /**
   * Creates background.
   */
  createBackground(): void;
  /**
   * Performs goto title.
   */
  gotoTitle(): void;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Determines whether triggered.
   * @returns True if triggered; false otherwise.
   */
  isTriggered(): boolean;
  /**
   * Performs play gameover music.
   */
  playGameoverMusic(): void;
  /**
   * Performs start.
   */
  start(): void;
  /**
   * Performs stop.
   */
  stop(): void;
  /**
   * Performs terminate.
   */
  terminate(): void;
  /**
   * Performs update.
   */
  update(): void;
}
