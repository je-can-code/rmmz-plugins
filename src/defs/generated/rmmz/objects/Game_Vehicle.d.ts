/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Vehicle
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Vehicle extends Game_Character
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Vehicle#initMembers}, {@link Game_Vehicle#updateAirshipAltitude}.<br/>
   * Read in: {@link Game_Vehicle#isHighest}, {@link Game_Vehicle#isLowest}, {@link Game_Vehicle#screenY}, {@link Game_Vehicle#shadowOpacity}, {@link Game_Vehicle#shadowY}.<br/>
   */
  _altitude: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Vehicle#initMembers}, {@link Game_Vehicle#setBgm}.<br/>
   * Read in: {@link Game_Vehicle#playBgm}.<br/>
   */
  _bgm: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Vehicle#getOff}, {@link Game_Vehicle#getOn}, {@link Game_Vehicle#initMembers}.<br/>
   * Read in: {@link Game_Vehicle#refresh}, {@link Game_Vehicle#updateAirshipAltitude}.<br/>
   */
  _driving: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Vehicle#initMembers}, {@link Game_Vehicle#loadSystemSettings}, {@link Game_Vehicle#refresh}, {@link Game_Vehicle#setLocation}.<br/>
   * Read in: {@link Game_Vehicle#pos}, {@link Game_Vehicle#refresh}.<br/>
   */
  _mapId: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `string`.<br/>
   * Initialized in: {@link Game_Vehicle#initialize}.<br/>
   * Written in: {@link Game_Vehicle#initMembers}, {@link Game_Vehicle#initialize}.<br/>
   * Read in: {@link Game_Vehicle#isAirship}, {@link Game_Vehicle#isBoat}, {@link Game_Vehicle#isShip}.<br/>
   */
  _type: string;
  /**
   * Determines whether move.
   * @returns True if move; false otherwise.
   */
  canMove(): boolean;
  /**
   * Gets off.
   */
  getOff(): void;
  /**
   * Gets on.
   */
  getOn(): void;
  /**
   * Initializes members.
   */
  initMembers(): void;
  /**
   * Initializes move speed.
   */
  initMoveSpeed(): void;
  /**
   * Initializes initialize.
   * @param _type The type parameter.
   */
  initialize(_type: unknown): void;
  /**
   * Determines whether airship.
   * @returns True if airship; false otherwise.
   */
  isAirship(): boolean;
  /**
   * Determines whether boat.
   * @returns True if boat; false otherwise.
   */
  isBoat(): boolean;
  /**
   * Determines whether highest.
   * @returns True if highest; false otherwise.
   */
  isHighest(): boolean;
  /**
   * Determines whether land ok.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param d The d parameter.
   * @returns True if land ok; false otherwise.
   */
  isLandOk(x: unknown, y: unknown, d: unknown): boolean;
  /**
   * Determines whether lowest.
   * @returns True if lowest; false otherwise.
   */
  isLowest(): boolean;
  /**
   * Determines whether map passable.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param d The d parameter.
   * @returns True if map passable; false otherwise.
   */
  isMapPassable(x: unknown, y: unknown, d: unknown): boolean;
  /**
   * Determines whether ship.
   * @returns True if ship; false otherwise.
   */
  isShip(): boolean;
  /**
   * Determines whether takeoff ok.
   * @returns True if takeoff ok; false otherwise.
   */
  isTakeoffOk(): boolean;
  /**
   * Performs load system settings.
   */
  loadSystemSettings(): void;
  /**
   * Gets max altitude.
   * @returns The result.
   */
  maxAltitude(): number;
  /**
   * Performs play bgm.
   */
  playBgm(): void;
  /**
   * Gets pos.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns The result.
   */
  pos(x: unknown, y: unknown): boolean;
  /**
   * Performs refresh.
   */
  refresh(): void;
  /**
   * Clears direction.
   */
  resetDirection(): void;
  /**
   * Gets screen y.
   * @returns The result.
   */
  screenY(): unknown;
  /**
   * Sets bgm.
   * @param bgm The bgm parameter.
   */
  setBgm(bgm: unknown): void;
  /**
   * Sets location.
   * @param mapId The mapId parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  setLocation(mapId: unknown, x: unknown, y: unknown): void;
  /**
   * Gets shadow opacity.
   * @returns The result.
   */
  shadowOpacity(): unknown;
  /**
   * Gets shadow x.
   * @returns The result.
   */
  shadowX(): unknown;
  /**
   * Gets shadow y.
   * @returns The result.
   */
  shadowY(): unknown;
  /**
   * Performs sync with player.
   */
  syncWithPlayer(): void;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates airship.
   */
  updateAirship(): void;
  /**
   * Updates airship altitude.
   */
  updateAirshipAltitude(): void;
  /**
   * Gets vehicle.
   * @returns The result.
   */
  vehicle(): null;
}
