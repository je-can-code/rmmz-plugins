/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Timer
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Timer
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Game_Timer#initialize}.<br/>
   * Written in: {@link Game_Timer#initialize}, {@link Game_Timer#start}, {@link Game_Timer#update}.<br/>
   * Read in: {@link Game_Timer#frames}, {@link Game_Timer#seconds}, {@link Game_Timer#update}.<br/>
   */
  _frames: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link Game_Timer#initialize}.<br/>
   * Written in: {@link Game_Timer#initialize}, {@link Game_Timer#start}, {@link Game_Timer#stop}.<br/>
   * Read in: {@link Game_Timer#isWorking}, {@link Game_Timer#update}.<br/>
   */
  _working: boolean;
  /**
   * Gets frames.
   * @returns The result.
   */
  frames(): unknown;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Determines whether working.
   * @returns True if working; false otherwise.
   */
  isWorking(): boolean;
  /**
   * Performs on expire.
   */
  onExpire(): void;
  /**
   * Gets seconds.
   * @returns The result.
   */
  seconds(): unknown;
  /**
   * Performs start.
   * @param count The count parameter.
   */
  start(count: unknown): void;
  /**
   * Performs stop.
   */
  stop(): void;
  /**
   * Performs update.
   * @param sceneActive The sceneActive parameter.
   */
  update(sceneActive: unknown): void;
}
