/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_Animation
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_Animation extends Sprite
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Animation#initMembers}, {@link Sprite_Animation#setup}.<br/>
   * Read in: {@link Sprite_Animation#processFlashTimings}, {@link Sprite_Animation#processSoundTimings}, {@link Sprite_Animation#setViewport}, {@link Sprite_Animation#targetPosition}, {@link Sprite_Animation#targetSpritePosition}, {@link Sprite_Animation#updateEffectGeometry}.<br/>
   */
  _animation: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Animation#initMembers}, {@link Sprite_Animation#setup}, {@link Sprite_Animation#update}.<br/>
   * Read in: {@link Sprite_Animation#update}.<br/>
   */
  _delay: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Animation#destroy}, {@link Sprite_Animation#initMembers}, {@link Sprite_Animation#setup}.<br/>
   * Read in: {@link Sprite_Animation#update}.<br/>
   */
  _effect: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number[]`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Animation#initMembers}, {@link Sprite_Animation#processFlashTimings}.<br/>
   * Read in: {@link Sprite_Animation#updateFlash}.<br/>
   */
  _flashColor: number[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Animation#initMembers}, {@link Sprite_Animation#processFlashTimings}, {@link Sprite_Animation#updateFlash}.<br/>
   * Read in: {@link Sprite_Animation#checkEnd}, {@link Sprite_Animation#updateFlash}.<br/>
   */
  _flashDuration: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Animation#initMembers}, {@link Sprite_Animation#updateMain}.<br/>
   * Read in: {@link Sprite_Animation#checkEnd}, {@link Sprite_Animation#processFlashTimings}, {@link Sprite_Animation#processSoundTimings}.<br/>
   */
  _frameIndex: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Animation#destroy}, {@link Sprite_Animation#initMembers}, {@link Sprite_Animation#update}.<br/>
   * Read in: {@link Sprite_Animation#_render}, {@link Sprite_Animation#checkEnd}, {@link Sprite_Animation#destroy}, {@link Sprite_Animation#setRotation}, {@link Sprite_Animation#updateEffectGeometry}.<br/>
   */
  _handle: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Animation#initMembers}, {@link Sprite_Animation#setup}.<br/>
   * Read in: {@link Sprite_Animation#checkEnd}, {@link Sprite_Animation#setup}.<br/>
   */
  _maxTimingFrames: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Animation#initMembers}, {@link Sprite_Animation#setup}.<br/>
   * Read in: {@link Sprite_Animation#setProjectionMatrix}.<br/>
   */
  _mirror: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Animation#checkEnd}, {@link Sprite_Animation#destroy}, {@link Sprite_Animation#initMembers}, {@link Sprite_Animation#setup}.<br/>
   * Read in: {@link Sprite_Animation#isPlaying}, {@link Sprite_Animation#update}.<br/>
   */
  _playing: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Animation#initMembers}, {@link Sprite_Animation#setup}.<br/>
   * Read in: {@link Sprite_Animation#canStart}.<br/>
   */
  _previous: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Animation#destroy}, {@link Sprite_Animation#initMembers}, {@link Sprite_Animation#update}.<br/>
   * Read in: {@link Sprite_Animation#update}.<br/>
   */
  _started: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Animation#initMembers}, {@link Sprite_Animation#setup}.<br/>
   * Read in: {@link Sprite_Animation#_render}, {@link Sprite_Animation#targetPosition}, {@link Sprite_Animation#updateFlash}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `.length`: {@link Sprite_Animation#_render}, {@link Sprite_Animation#targetPosition}.<br/>
   */
  _targets: unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Animation#initMembers}.<br/>
   * Read in: {@link Sprite_Animation#setProjectionMatrix}, {@link Sprite_Animation#setViewport}.<br/>
   */
  _viewportSize: number;
  /**
   * Performs render.
   * @param renderer The renderer parameter.
   */
  _render(renderer: unknown): void;
  /**
   * Determines whether start.
   * @returns True if start; false otherwise.
   */
  canStart(): boolean;
  /**
   * Performs check end.
   */
  checkEnd(): void;
  /**
   * Performs destroy.
   * @param options The options parameter.
   */
  destroy(options: unknown): void;
  /**
   * Initializes members.
   */
  initMembers(): void;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Determines whether playing.
   * @returns True if playing; false otherwise.
   */
  isPlaying(): boolean;
  /**
   * Performs on after render.
   * @param renderer The renderer parameter.
   */
  onAfterRender(renderer: unknown): void;
  /**
   * Performs on before render.
   * @param renderer The renderer parameter.
   */
  onBeforeRender(renderer: unknown): void;
  /**
   * Performs process flash timings.
   */
  processFlashTimings(): void;
  /**
   * Performs process sound timings.
   */
  processSoundTimings(): void;
  /**
   * Clears viewport.
   * @param renderer The renderer parameter.
   */
  resetViewport(renderer: unknown): void;
  /**
   * Sets camera matrix.
   */
  setCameraMatrix(): void;
  /**
   * Sets projection matrix.
   * @param renderer The renderer parameter.
   */
  setProjectionMatrix(renderer: unknown): void;
  /**
   * Sets rotation.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param z The z parameter.
   */
  setRotation(x: unknown, y: unknown, z: unknown): void;
  /**
   * Sets viewport.
   * @param renderer The renderer parameter.
   */
  setViewport(renderer: unknown): void;
  /**
   * Performs setup.
   * @param targets The targets parameter.
   * @param animation The animation parameter.
   * @param mirror The mirror parameter.
   * @param delay The delay parameter.
   * @param previous The previous parameter.
   */
  setup(targets: unknown, animation: unknown, mirror: unknown, delay: unknown, previous: unknown): void;
  /**
   * Gets should wait for previous.
   * @returns The result.
   */
  shouldWaitForPrevious(): boolean;
  /**
   * Gets target position.
   * @param renderer The renderer parameter.
   * @returns The result.
   */
  targetPosition(renderer: unknown): unknown;
  /**
   * Gets target sprite position.
   * @param sprite The sprite parameter.
   * @returns The result.
   */
  targetSpritePosition(sprite: unknown): unknown;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates effect geometry.
   */
  updateEffectGeometry(): void;
  /**
   * Updates flash.
   */
  updateFlash(): void;
  /**
   * Updates main.
   */
  updateMain(): void;
}
