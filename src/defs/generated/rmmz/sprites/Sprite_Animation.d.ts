/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_Animation
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_Animation
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _animation: null | object;
  _delay: number;
  _effect: null;
  _flashColor: number[];
  _flashDuration: number;
  _frameIndex: number;
  _handle: null;
  _maxTimingFrames: number;
  _mirror: boolean;
  _playing: boolean;
  _previous: null | Sprite_Animation;
  _started: boolean;
  _targets: unknown[] | Sprite[];
  _viewportSize: number;
  _render(renderer: PIXI.Renderer): void;
  canStart(): boolean;
  checkEnd(): void;
  destroy(options: object): void;
  initMembers(): void;
  initialize(): void;
  isPlaying(): boolean;
  onAfterRender(renderer: PIXI.Renderer): void;
  onBeforeRender(renderer: PIXI.Renderer): void;
  processFlashTimings(): void;
  processSoundTimings(): void;
  resetViewport(renderer: PIXI.Renderer): void;
  setCameraMatrix(): void;
  setProjectionMatrix(renderer: PIXI.Renderer): void;
  setRotation(x: number, y: number, z: number): void;
  setViewport(renderer: PIXI.Renderer): void;
  setup(targets: Sprite[], animation: object, mirror: boolean, delay: number, previous: Sprite_Animation | null): void;
  shouldWaitForPrevious(): boolean;
  targetPosition(renderer: PIXI.Renderer): Point;
  targetSpritePosition(sprite: Sprite): Point;
  update(): void;
  updateEffectGeometry(): void;
  updateFlash(): void;
  updateMain(): void;
}
