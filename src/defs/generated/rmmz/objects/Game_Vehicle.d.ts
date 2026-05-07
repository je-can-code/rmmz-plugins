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
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Vehicle#initMembers}, {@link Game_Vehicle#updateAirshipAltitude}.
   * Read in: {@link Game_Vehicle#isHighest}, {@link Game_Vehicle#isLowest}, {@link Game_Vehicle#screenY}, {@link Game_Vehicle#shadowOpacity}, {@link Game_Vehicle#shadowY}.
   */
  _altitude: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `null | { name: string; pan: number; pitch: number; volume: number }`.
   * Initialized in: none.
   * Written in: {@link Game_Vehicle#initMembers}, {@link Game_Vehicle#setBgm}.
   * Read in: {@link Game_Vehicle#playBgm}.
   */
  _bgm: null | { name: string; pan: number; pitch: number; volume: number };
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link Game_Vehicle#getOff}, {@link Game_Vehicle#getOn}, {@link Game_Vehicle#initMembers}.
   * Read in: {@link Game_Vehicle#refresh}, {@link Game_Vehicle#updateAirshipAltitude}.
   */
  _driving: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Vehicle#initMembers}, {@link Game_Vehicle#loadSystemSettings}, {@link Game_Vehicle#refresh}, {@link Game_Vehicle#setLocation}.
   * Read in: {@link Game_Vehicle#pos}, {@link Game_Vehicle#refresh}.
   */
  _mapId: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number | string`.
   * Initialized in: {@link Game_Vehicle#initialize}.
   * Written in: {@link Game_Vehicle#initMembers}, {@link Game_Vehicle#initialize}.
   * Read in: {@link Game_Vehicle#isAirship}, {@link Game_Vehicle#isBoat}, {@link Game_Vehicle#isShip}.
   */
  _type: number | string;
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
  initialize(_type: number): void;
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
  isLandOk(x: number, y: number, d: number): boolean;
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
  isMapPassable(x: number, y: number, d: number): boolean;
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
  pos(x: number, y: number): boolean;
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
  screenY(): number;
  /**
   * Sets bgm.
   * @param bgm The bgm parameter.
   */
  setBgm(bgm: { name: string; pan: number; pitch: number; volume: number }): void;
  /**
   * Sets location.
   * @param mapId The mapId parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  setLocation(mapId: number, x: number, y: number): void;
  /**
   * Gets shadow opacity.
   * @returns The result.
   */
  shadowOpacity(): number;
  /**
   * Gets shadow x.
   * @returns The result.
   */
  shadowX(): number;
  /**
   * Gets shadow y.
   * @returns The result.
   */
  shadowY(): number;
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
