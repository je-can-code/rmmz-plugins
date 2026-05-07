/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Vehicle
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Vehicle
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _altitude: number;
  _bgm: null | { name: string; pan: number; pitch: number; volume: number };
  _driving: boolean;
  _mapId: number;
  _type: number | string;
  canMove(): boolean;
  getOff(): void;
  getOn(): void;
  initMembers(): void;
  initMoveSpeed(): void;
  initialize(_type: number): void;
  isAirship(): boolean;
  isBoat(): boolean;
  isHighest(): boolean;
  isLandOk(x: number, y: number, d: number): boolean;
  isLowest(): boolean;
  isMapPassable(x: number, y: number, d: number): boolean;
  isShip(): boolean;
  isTakeoffOk(): boolean;
  loadSystemSettings(): void;
  maxAltitude(): number;
  playBgm(): void;
  pos(x: number, y: number): boolean;
  refresh(): void;
  resetDirection(): void;
  screenY(): number;
  setBgm(bgm: { name: string; pan: number; pitch: number; volume: number }): void;
  setLocation(mapId: number, x: number, y: number): void;
  shadowOpacity(): number;
  shadowX(): number;
  shadowY(): number;
  syncWithPlayer(): void;
  update(): void;
  updateAirship(): void;
  updateAirshipAltitude(): void;
  vehicle(): null;
}
