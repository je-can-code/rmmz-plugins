/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Base
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Base
{
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: {@link Scene_Base#initialize}.
   * Written in: {@link Scene_Base#initialize}, {@link Scene_Base#start}, {@link Scene_Base#stop}.
   * Read in: {@link Scene_Base#isActive}.
   */
  _active: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `ColorFilter`.
   * Initialized in: none.
   * Written in: {@link Scene_Base#createColorFilter}.
   * Read in: {@link Scene_Base#createColorFilter}, {@link Scene_Base#updateColorFilter}.
   */
  _colorFilter: ColorFilter;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Scene_Base#initialize}.
   * Written in: {@link Scene_Base#initialize}, {@link Scene_Base#startFadeIn}, {@link Scene_Base#startFadeOut}, {@link Scene_Base#updateFade}.
   * Read in: {@link Scene_Base#isFading}, {@link Scene_Base#updateFade}.
   */
  _fadeDuration: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Scene_Base#initialize}.
   * Written in: {@link Scene_Base#initialize}, {@link Scene_Base#startFadeIn}, {@link Scene_Base#startFadeOut}, {@link Scene_Base#updateFade}.
   * Read in: {@link Scene_Base#updateColorFilter}, {@link Scene_Base#updateFade}.
   */
  _fadeOpacity: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Scene_Base#initialize}.
   * Written in: {@link Scene_Base#initialize}, {@link Scene_Base#startFadeIn}, {@link Scene_Base#startFadeOut}.
   * Read in: {@link Scene_Base#updateFade}.
   */
  _fadeSign: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number | boolean`.
   * Initialized in: {@link Scene_Base#initialize}.
   * Written in: {@link Scene_Base#initialize}, {@link Scene_Base#startFadeIn}, {@link Scene_Base#startFadeOut}.
   * Read in: {@link Scene_Base#updateColorFilter}.
   */
  _fadeWhite: number | boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: {@link Scene_Base#initialize}.
   * Written in: {@link Scene_Base#initialize}, {@link Scene_Base#start}.
   * Read in: {@link Scene_Base#isStarted}.
   */
  _started: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `WindowLayer`.
   * Initialized in: none.
   * Written in: {@link Scene_Base#createWindowLayer}.
   * Read in: {@link Scene_Base#addWindow}, {@link Scene_Base#createWindowLayer}.
   */
  _windowLayer: WindowLayer;
  /**
   * Adds window.
   * @param window The window parameter.
   */
  addWindow(window: Window_Base): void;
  /**
   * Gets button area bottom.
   * @returns The result.
   */
  buttonAreaBottom(): number;
  /**
   * Gets button area height.
   * @returns The result.
   */
  buttonAreaHeight(): number;
  /**
   * Gets button area top.
   * @returns The result.
   */
  buttonAreaTop(): number;
  /**
   * Gets button y.
   * @returns The result.
   */
  buttonY(): number;
  /**
   * Gets calc window height.
   * @param numLines The numLines parameter.
   * @param selectable The selectable parameter.
   * @returns The result.
   */
  calcWindowHeight(numLines: number, selectable: boolean): number;
  /**
   * Performs center sprite.
   * @param sprite The sprite parameter.
   */
  centerSprite(sprite: Sprite): void;
  /**
   * Performs check gameover.
   */
  checkGameover(): void;
  /**
   * Performs create.
   */
  create(): void;
  /**
   * Creates color filter.
   */
  createColorFilter(): void;
  /**
   * Creates window layer.
   */
  createWindowLayer(): void;
  /**
   * Performs execute autosave.
   */
  executeAutosave(): void;
  /**
   * Performs fade out all.
   */
  fadeOutAll(): void;
  /**
   * Gets fade speed.
   * @returns The result.
   */
  fadeSpeed(): number;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Determines whether active.
   * @returns True if active; false otherwise.
   */
  isActive(): boolean;
  /**
   * Determines whether autosave enabled.
   * @returns True if autosave enabled; false otherwise.
   */
  isAutosaveEnabled(): boolean;
  /**
   * Determines whether bottom button mode.
   * @returns True if bottom button mode; false otherwise.
   */
  isBottomButtonMode(): boolean;
  /**
   * Determines whether bottom help mode.
   * @returns True if bottom help mode; false otherwise.
   */
  isBottomHelpMode(): boolean;
  /**
   * Determines whether busy.
   * @returns True if busy; false otherwise.
   */
  isBusy(): boolean;
  /**
   * Determines whether fading.
   * @returns True if fading; false otherwise.
   */
  isFading(): boolean;
  /**
   * Determines whether ready.
   * @returns True if ready; false otherwise.
   */
  isReady(): boolean;
  /**
   * Determines whether right input mode.
   * @returns True if right input mode; false otherwise.
   */
  isRightInputMode(): boolean;
  /**
   * Determines whether started.
   * @returns True if started; false otherwise.
   */
  isStarted(): boolean;
  /**
   * Gets main command width.
   * @returns The result.
   */
  mainCommandWidth(): number;
  /**
   * Performs on autosave failure.
   */
  onAutosaveFailure(): void;
  /**
   * Performs on autosave success.
   */
  onAutosaveSuccess(): void;
  /**
   * Performs pop scene.
   */
  popScene(): void;
  /**
   * Performs request autosave.
   */
  requestAutosave(): void;
  /**
   * Performs scale sprite.
   * @param sprite The sprite parameter.
   */
  scaleSprite(sprite: Sprite): void;
  /**
   * Gets slow fade speed.
   * @returns The result.
   */
  slowFadeSpeed(): number;
  /**
   * Performs start.
   */
  start(): void;
  /**
   * Performs start fade in.
   * @param duration The duration parameter.
   * @param white The white parameter.
   */
  startFadeIn(duration: number, white: boolean): void;
  /**
   * Performs start fade out.
   * @param duration The duration parameter.
   * @param white The white parameter.
   */
  startFadeOut(duration: number, white: boolean): void;
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
  /**
   * Updates children.
   */
  updateChildren(): void;
  /**
   * Updates color filter.
   */
  updateColorFilter(): void;
  /**
   * Updates fade.
   */
  updateFade(): void;
}
