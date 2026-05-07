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
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Game_Timer#initialize}.
   * Written in: {@link Game_Timer#initialize}, {@link Game_Timer#start}, {@link Game_Timer#update}.
   * Read in: {@link Game_Timer#frames}, {@link Game_Timer#seconds}, {@link Game_Timer#update}.
   */
  _frames: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: {@link Game_Timer#initialize}.
   * Written in: {@link Game_Timer#initialize}, {@link Game_Timer#start}, {@link Game_Timer#stop}.
   * Read in: {@link Game_Timer#isWorking}, {@link Game_Timer#update}.
   */
  _working: boolean;
  /**
   * Gets frames.
   * @returns The result.
   */
  frames(): number;
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
  seconds(): number;
  /**
   * Performs start.
   * @param count The count parameter.
   */
  start(count: number): void;
  /**
   * Performs stop.
   */
  stop(): void;
  /**
   * Performs update.
   * @param sceneActive The sceneActive parameter.
   */
  update(sceneActive: boolean): void;
}
