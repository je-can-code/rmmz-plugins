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
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _active: boolean;
  _colorFilter: ColorFilter;
  _fadeDuration: number;
  _fadeOpacity: number;
  _fadeSign: number;
  _fadeWhite: number | boolean;
  _started: boolean;
  _windowLayer: WindowLayer;
  addWindow(window: Window_Base): void;
  buttonAreaBottom(): number;
  buttonAreaHeight(): number;
  buttonAreaTop(): number;
  buttonY(): number;
  calcWindowHeight(numLines: number, selectable: boolean): number;
  centerSprite(sprite: Sprite): void;
  checkGameover(): void;
  create(): void;
  createColorFilter(): void;
  createWindowLayer(): void;
  executeAutosave(): void;
  fadeOutAll(): void;
  fadeSpeed(): number;
  initialize(): void;
  isActive(): boolean;
  isAutosaveEnabled(): boolean;
  isBottomButtonMode(): boolean;
  isBottomHelpMode(): boolean;
  isBusy(): boolean;
  isFading(): boolean;
  isReady(): boolean;
  isRightInputMode(): boolean;
  isStarted(): boolean;
  mainCommandWidth(): number;
  onAutosaveFailure(): void;
  onAutosaveSuccess(): void;
  popScene(): void;
  requestAutosave(): void;
  scaleSprite(sprite: Sprite): void;
  slowFadeSpeed(): number;
  start(): void;
  startFadeIn(duration: number, white: boolean): void;
  startFadeOut(duration: number, white: boolean): void;
  stop(): void;
  terminate(): void;
  update(): void;
  updateChildren(): void;
  updateColorFilter(): void;
  updateFade(): void;
}
