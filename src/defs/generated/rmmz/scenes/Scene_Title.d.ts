/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Title
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Title extends Scene_Base
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Sprite`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Scene_Title#createBackground}.<br/>
   * Read in: {@link Scene_Title#adjustBackground}, {@link Scene_Title#createBackground}.<br/>
   */
  _backSprite1: Sprite;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Sprite`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Scene_Title#createBackground}.<br/>
   * Read in: {@link Scene_Title#adjustBackground}, {@link Scene_Title#createBackground}.<br/>
   */
  _backSprite2: Sprite;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Window_TitleCommand`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Scene_Title#createCommandWindow}.<br/>
   * Read in: {@link Scene_Title#commandContinue}, {@link Scene_Title#commandNewGame}, {@link Scene_Title#commandOptions}, {@link Scene_Title#createCommandWindow}, {@link Scene_Title#isBusy}, {@link Scene_Title#update}.<br/>
   */
  _commandWindow: Window_TitleCommand;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Sprite`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Scene_Title#createForeground}.<br/>
   * Read in: {@link Scene_Title#createForeground}, {@link Scene_Title#drawGameTitle}, {@link Scene_Title#terminate}.<br/>
   */
  _gameTitleSprite: Sprite;
  /**
   * Performs adjust background.
   */
  adjustBackground(): void;
  /**
   * Performs command continue.
   */
  commandContinue(): void;
  /**
   * Performs command new game.
   */
  commandNewGame(): void;
  /**
   * Performs command options.
   */
  commandOptions(): void;
  /**
   * Gets command window rect.
   * @returns The result.
   */
  commandWindowRect(): Rectangle;
  /**
   * Performs create.
   */
  create(): void;
  /**
   * Creates background.
   */
  createBackground(): void;
  /**
   * Creates command window.
   */
  createCommandWindow(): void;
  /**
   * Creates foreground.
   */
  createForeground(): void;
  /**
   * Performs draw game title.
   */
  drawGameTitle(): void;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Determines whether busy.
   * @returns True if busy; false otherwise.
   */
  isBusy(): boolean;
  /**
   * Performs play title music.
   */
  playTitleMusic(): void;
  /**
   * Performs start.
   */
  start(): void;
  /**
   * Performs terminate.
   */
  terminate(): void;
  /**
   * Performs update.
   */
  update(): void;
}
