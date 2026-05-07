/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Followers
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Followers
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: {@link Game_Followers#initialize}.<br/>
   * Written in: {@link Game_Followers#initialize}, {@link Game_Followers#setup}.<br/>
   * Read in: {@link Game_Followers#data}, {@link Game_Followers#follower}, {@link Game_Followers#jumpAll}, {@link Game_Followers#refresh}, {@link Game_Followers#reverseData}, {@link Game_Followers#setup}, {@link Game_Followers#synchronize}, {@link Game_Followers#update}, {@link Game_Followers#updateMove}, {@link Game_Followers#visibleFollowers}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `.length`: {@link Game_Followers#updateMove}.<br/>
   * - `push()`: {@link Game_Followers#setup}.<br/>
   */
  _data: unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link Game_Followers#initialize}.<br/>
   * Written in: {@link Game_Followers#gather}, {@link Game_Followers#initialize}, {@link Game_Followers#update}.<br/>
   * Read in: {@link Game_Followers#areGathering}.<br/>
   */
  _gathering: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link Game_Followers#initialize}.<br/>
   * Written in: {@link Game_Followers#hide}, {@link Game_Followers#initialize}, {@link Game_Followers#show}.<br/>
   * Read in: {@link Game_Followers#isVisible}.<br/>
   */
  _visible: boolean;
  /**
   * Gets are gathered.
   * @returns The result.
   */
  areGathered(): unknown;
  /**
   * Gets are gathering.
   * @returns The result.
   */
  areGathering(): unknown;
  /**
   * Gets are moving.
   * @returns The result.
   */
  areMoving(): unknown;
  /**
   * Gets data.
   * @returns The result.
   */
  data(): unknown;
  /**
   * Gets follower.
   * @param index The index parameter.
   * @returns The result.
   */
  follower(index: unknown): unknown;
  /**
   * Performs gather.
   */
  gather(): void;
  /**
   * Performs hide.
   */
  hide(): void;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Determines whether someone collided.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns True if someone collided; false otherwise.
   */
  isSomeoneCollided(x: unknown, y: unknown): boolean;
  /**
   * Determines whether visible.
   * @returns True if visible; false otherwise.
   */
  isVisible(): boolean;
  /**
   * Performs jump all.
   */
  jumpAll(): void;
  /**
   * Performs refresh.
   */
  refresh(): void;
  /**
   * Gets reverse data.
   * @returns The result.
   */
  reverseData(): unknown;
  /**
   * Performs setup.
   */
  setup(): void;
  /**
   * Performs show.
   */
  show(): void;
  /**
   * Performs synchronize.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param d The d parameter.
   */
  synchronize(x: unknown, y: unknown, d: unknown): void;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates move.
   */
  updateMove(): void;
  /**
   * Gets visible followers.
   * @returns The result.
   */
  visibleFollowers(): unknown;
}
