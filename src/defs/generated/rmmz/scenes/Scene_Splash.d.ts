/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Splash
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Splash extends Scene_Base
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Sprite`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Scene_Splash#createBackground}.<br/>
   * Read in: {@link Scene_Splash#adjustBackground}, {@link Scene_Splash#createBackground}.<br/>
   */
  _backSprite: Sprite;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Scene_Splash#checkSkip}, {@link Scene_Splash#initWaitCount}, {@link Scene_Splash#updateWaitCount}.<br/>
   * Read in: {@link Scene_Splash#updateWaitCount}.<br/>
   */
  _waitCount: number;
  /**
   * Performs adjust background.
   */
  adjustBackground(): void;
  /**
   * Performs check skip.
   */
  checkSkip(): void;
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
   * Initializes wait count.
   */
  initWaitCount(): void;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Determines whether enabled.
   * @returns True if enabled; false otherwise.
   */
  isEnabled(): boolean;
  /**
   * Performs start.
   */
  start(): void;
  /**
   * Performs stop.
   */
  stop(): void;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates wait count.
   * @returns The result.
   */
  updateWaitCount(): boolean;
}
