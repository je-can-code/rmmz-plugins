/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_MenuBase
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_MenuBase extends Scene_Base
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Scene_MenuBase#updateActor}.<br/>
   * Read in: {@link Scene_MenuBase#actor}.<br/>
   */
  _actor: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `PIXI.filters.BlurFilter`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Scene_MenuBase#createBackground}.<br/>
   * Read in: {@link Scene_MenuBase#createBackground}.<br/>
   */
  _backgroundFilter: PIXI.filters.BlurFilter;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Sprite`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Scene_MenuBase#createBackground}.<br/>
   * Read in: {@link Scene_MenuBase#createBackground}, {@link Scene_MenuBase#setBackgroundOpacity}.<br/>
   */
  _backgroundSprite: Sprite;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Sprite_Button`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Scene_MenuBase#createCancelButton}.<br/>
   * Read in: {@link Scene_MenuBase#createCancelButton}.<br/>
   */
  _cancelButton: Sprite_Button;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Window_Help`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Scene_MenuBase#createHelpWindow}.<br/>
   * Read in: {@link Scene_MenuBase#createHelpWindow}.<br/>
   */
  _helpWindow: Window_Help;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Sprite_Button`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Scene_MenuBase#createPageButtons}.<br/>
   * Read in: {@link Scene_MenuBase#createPageButtons}, {@link Scene_MenuBase#updatePageButtons}.<br/>
   */
  _pagedownButton: Sprite_Button;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Sprite_Button`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Scene_MenuBase#createPageButtons}.<br/>
   * Read in: {@link Scene_MenuBase#createPageButtons}, {@link Scene_MenuBase#updatePageButtons}.<br/>
   */
  _pageupButton: Sprite_Button;
  /**
   * Gets actor.
   * @returns The result.
   */
  actor(): Game_Actor;
  /**
   * Gets are page buttons enabled.
   * @returns The result.
   */
  arePageButtonsEnabled(): boolean;
  /**
   * Performs create.
   */
  create(): void;
  /**
   * Creates background.
   */
  createBackground(): void;
  /**
   * Creates buttons.
   */
  createButtons(): void;
  /**
   * Creates cancel button.
   */
  createCancelButton(): void;
  /**
   * Creates help window.
   */
  createHelpWindow(): void;
  /**
   * Creates page buttons.
   */
  createPageButtons(): void;
  /**
   * Gets help area bottom.
   * @returns The result.
   */
  helpAreaBottom(): number;
  /**
   * Gets help area height.
   * @returns The result.
   */
  helpAreaHeight(): number;
  /**
   * Gets help area top.
   * @returns The result.
   */
  helpAreaTop(): number;
  /**
   * Gets help window rect.
   * @returns The result.
   */
  helpWindowRect(): Rectangle;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Gets main area bottom.
   * @returns The result.
   */
  mainAreaBottom(): number;
  /**
   * Gets main area height.
   * @returns The result.
   */
  mainAreaHeight(): number;
  /**
   * Gets main area top.
   * @returns The result.
   */
  mainAreaTop(): number;
  /**
   * Gets needs cancel button.
   * @returns The result.
   */
  needsCancelButton(): boolean;
  /**
   * Gets needs page buttons.
   * @returns The result.
   */
  needsPageButtons(): boolean;
  /**
   * Performs next actor.
   */
  nextActor(): void;
  /**
   * Performs on actor change.
   */
  onActorChange(): void;
  /**
   * Performs previous actor.
   */
  previousActor(): void;
  /**
   * Sets background opacity.
   * @param opacity The opacity parameter.
   */
  setBackgroundOpacity(opacity: number): void;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates actor.
   */
  updateActor(): void;
  /**
   * Updates page buttons.
   */
  updatePageButtons(): void;
}
