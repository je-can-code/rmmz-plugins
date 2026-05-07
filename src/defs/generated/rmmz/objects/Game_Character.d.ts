/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Character
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Character
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _moveRoute: null | object;
  _moveRouteForcing: boolean;
  _moveRouteIndex: number;
  _originalMoveRoute: null | object;
  _originalMoveRouteIndex: number;
  _waitCount: number;
  advanceMoveRouteIndex(): void;
  deltaXFrom(x: number): number;
  deltaYFrom(y: number): number;
  findDirectionTo(goalX: number, goalY: number): number;
  forceMoveRoute(moveRoute: object): void;
  initMembers(): void;
  initialize(): void;
  isMoveRouteForcing(): boolean;
  memorizeMoveRoute(): void;
  moveAwayFromCharacter(character: Game_Character): void;
  moveAwayFromPlayer(): void;
  moveBackward(): void;
  moveForward(): void;
  moveRandom(): void;
  moveTowardCharacter(character: Game_Character): void;
  moveTowardPlayer(): void;
  processMoveCommand(command: object): void;
  processRouteEnd(): void;
  restoreMoveRoute(): void;
  searchLimit(): number;
  setMoveRoute(moveRoute: object): void;
  swap(character: Game_Character): void;
  turn180(): void;
  turnAwayFromCharacter(character: Game_Character): void;
  turnAwayFromPlayer(): void;
  turnLeft90(): void;
  turnRandom(): void;
  turnRight90(): void;
  turnRightOrLeft90(): void;
  turnTowardCharacter(character: Game_Character): void;
  turnTowardPlayer(): void;
  updateRoutineMove(): void;
  updateStop(): void;
}
declare namespace Game_Character
{
  const ROUTE_CHANGE_BLEND_MODE: 43;
  const ROUTE_CHANGE_FREQ: 30;
  const ROUTE_CHANGE_IMAGE: 41;
  const ROUTE_CHANGE_OPACITY: 42;
  const ROUTE_CHANGE_SPEED: 29;
  const ROUTE_DIR_FIX_OFF: 36;
  const ROUTE_DIR_FIX_ON: 35;
  const ROUTE_END: 0;
  const ROUTE_JUMP: 14;
  const ROUTE_MOVE_AWAY: 11;
  const ROUTE_MOVE_BACKWARD: 13;
  const ROUTE_MOVE_DOWN: 1;
  const ROUTE_MOVE_FORWARD: 12;
  const ROUTE_MOVE_LEFT: 2;
  const ROUTE_MOVE_LOWER_L: 5;
  const ROUTE_MOVE_LOWER_R: 6;
  const ROUTE_MOVE_RANDOM: 9;
  const ROUTE_MOVE_RIGHT: 3;
  const ROUTE_MOVE_TOWARD: 10;
  const ROUTE_MOVE_UP: 4;
  const ROUTE_MOVE_UPPER_L: 7;
  const ROUTE_MOVE_UPPER_R: 8;
  const ROUTE_PLAY_SE: 44;
  const ROUTE_SCRIPT: 45;
  const ROUTE_STEP_ANIME_OFF: 34;
  const ROUTE_STEP_ANIME_ON: 33;
  const ROUTE_SWITCH_OFF: 28;
  const ROUTE_SWITCH_ON: 27;
  const ROUTE_THROUGH_OFF: 38;
  const ROUTE_THROUGH_ON: 37;
  const ROUTE_TRANSPARENT_OFF: 40;
  const ROUTE_TRANSPARENT_ON: 39;
  const ROUTE_TURN_180D: 22;
  const ROUTE_TURN_90D_L: 21;
  const ROUTE_TURN_90D_R: 20;
  const ROUTE_TURN_90D_R_L: 23;
  const ROUTE_TURN_AWAY: 26;
  const ROUTE_TURN_DOWN: 16;
  const ROUTE_TURN_LEFT: 17;
  const ROUTE_TURN_RANDOM: 24;
  const ROUTE_TURN_RIGHT: 18;
  const ROUTE_TURN_TOWARD: 25;
  const ROUTE_TURN_UP: 19;
  const ROUTE_WAIT: 15;
  const ROUTE_WALK_ANIME_OFF: 32;
  const ROUTE_WALK_ANIME_ON: 31;
}
