/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Character
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Character extends Game_CharacterBase
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Character#forceMoveRoute}, {@link Game_Character#initMembers}, {@link Game_Character#restoreMoveRoute}, {@link Game_Character#setMoveRoute}.<br/>
   * Read in: {@link Game_Character#advanceMoveRouteIndex}, {@link Game_Character#memorizeMoveRoute}, {@link Game_Character#processRouteEnd}, {@link Game_Character#updateRoutineMove}.<br/>
   */
  _moveRoute: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Character#forceMoveRoute}, {@link Game_Character#initMembers}, {@link Game_Character#processRouteEnd}.<br/>
   * Read in: {@link Game_Character#isMoveRouteForcing}, {@link Game_Character#processRouteEnd}, {@link Game_Character#setMoveRoute}, {@link Game_Character#updateStop}.<br/>
   */
  _moveRouteForcing: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Character#advanceMoveRouteIndex}, {@link Game_Character#forceMoveRoute}, {@link Game_Character#initMembers}, {@link Game_Character#processRouteEnd}, {@link Game_Character#restoreMoveRoute}, {@link Game_Character#setMoveRoute}.<br/>
   * Read in: {@link Game_Character#advanceMoveRouteIndex}, {@link Game_Character#memorizeMoveRoute}, {@link Game_Character#updateRoutineMove}.<br/>
   */
  _moveRouteIndex: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Character#initMembers}, {@link Game_Character#memorizeMoveRoute}, {@link Game_Character#restoreMoveRoute}, {@link Game_Character#setMoveRoute}.<br/>
   * Read in: {@link Game_Character#forceMoveRoute}, {@link Game_Character#restoreMoveRoute}.<br/>
   */
  _originalMoveRoute: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Character#initMembers}, {@link Game_Character#memorizeMoveRoute}, {@link Game_Character#setMoveRoute}.<br/>
   * Read in: {@link Game_Character#restoreMoveRoute}.<br/>
   */
  _originalMoveRouteIndex: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Character#forceMoveRoute}, {@link Game_Character#initMembers}, {@link Game_Character#processMoveCommand}, {@link Game_Character#updateRoutineMove}.<br/>
   * Read in: {@link Game_Character#updateRoutineMove}.<br/>
   */
  _waitCount: number;
  /**
   * Performs advance move route index.
   */
  advanceMoveRouteIndex(): void;
  /**
   * Gets delta xfrom.
   * @param x The x parameter.
   * @returns The result.
   */
  deltaXFrom(x: unknown): unknown;
  /**
   * Gets delta yfrom.
   * @param y The y parameter.
   * @returns The result.
   */
  deltaYFrom(y: unknown): unknown;
  /**
   * Gets find direction to.
   * @param goalX The goalX parameter.
   * @param goalY The goalY parameter.
   * @returns The result.
   */
  findDirectionTo(goalX: unknown, goalY: unknown): number;
  /**
   * Performs force move route.
   * @param moveRoute The moveRoute parameter.
   */
  forceMoveRoute(moveRoute: unknown): void;
  /**
   * Initializes members.
   */
  initMembers(): void;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Determines whether move route forcing.
   * @returns True if move route forcing; false otherwise.
   */
  isMoveRouteForcing(): boolean;
  /**
   * Performs memorize move route.
   */
  memorizeMoveRoute(): void;
  /**
   * Performs move away from character.
   * @param character The character parameter.
   */
  moveAwayFromCharacter(character: unknown): void;
  /**
   * Performs move away from player.
   */
  moveAwayFromPlayer(): void;
  /**
   * Performs move backward.
   */
  moveBackward(): void;
  /**
   * Performs move forward.
   */
  moveForward(): void;
  /**
   * Performs move random.
   */
  moveRandom(): void;
  /**
   * Performs move toward character.
   * @param character The character parameter.
   */
  moveTowardCharacter(character: unknown): void;
  /**
   * Performs move toward player.
   */
  moveTowardPlayer(): void;
  /**
   * Performs process move command.
   * @param command The command parameter.
   */
  processMoveCommand(command: unknown): void;
  /**
   * Performs process route end.
   */
  processRouteEnd(): void;
  /**
   * Performs restore move route.
   */
  restoreMoveRoute(): void;
  /**
   * Gets search limit.
   * @returns The result.
   */
  searchLimit(): number;
  /**
   * Sets move route.
   * @param moveRoute The moveRoute parameter.
   */
  setMoveRoute(moveRoute: unknown): void;
  /**
   * Performs swap.
   * @param character The character parameter.
   */
  swap(character: unknown): void;
  /**
   * Performs turn180.
   */
  turn180(): void;
  /**
   * Performs turn away from character.
   * @param character The character parameter.
   */
  turnAwayFromCharacter(character: unknown): void;
  /**
   * Performs turn away from player.
   */
  turnAwayFromPlayer(): void;
  /**
   * Performs turn left90.
   */
  turnLeft90(): void;
  /**
   * Performs turn random.
   */
  turnRandom(): void;
  /**
   * Performs turn right90.
   */
  turnRight90(): void;
  /**
   * Performs turn right or left90.
   */
  turnRightOrLeft90(): void;
  /**
   * Performs turn toward character.
   * @param character The character parameter.
   */
  turnTowardCharacter(character: unknown): void;
  /**
   * Performs turn toward player.
   */
  turnTowardPlayer(): void;
  /**
   * Updates routine move.
   */
  updateRoutineMove(): void;
  /**
   * Updates stop.
   */
  updateStop(): void;
}
declare namespace Game_Character
{
  /**
   * Engine static constant.
   */
  const ROUTE_CHANGE_BLEND_MODE: 43;
  /**
   * Engine static constant.
   */
  const ROUTE_CHANGE_FREQ: 30;
  /**
   * Engine static constant.
   */
  const ROUTE_CHANGE_IMAGE: 41;
  /**
   * Engine static constant.
   */
  const ROUTE_CHANGE_OPACITY: 42;
  /**
   * Engine static constant.
   */
  const ROUTE_CHANGE_SPEED: 29;
  /**
   * Engine static constant.
   */
  const ROUTE_DIR_FIX_OFF: 36;
  /**
   * Engine static constant.
   */
  const ROUTE_DIR_FIX_ON: 35;
  /**
   * Engine static constant.
   */
  const ROUTE_END: 0;
  /**
   * Engine static constant.
   */
  const ROUTE_JUMP: 14;
  /**
   * Engine static constant.
   */
  const ROUTE_MOVE_AWAY: 11;
  /**
   * Engine static constant.
   */
  const ROUTE_MOVE_BACKWARD: 13;
  /**
   * Engine static constant.
   */
  const ROUTE_MOVE_DOWN: 1;
  /**
   * Engine static constant.
   */
  const ROUTE_MOVE_FORWARD: 12;
  /**
   * Engine static constant.
   */
  const ROUTE_MOVE_LEFT: 2;
  /**
   * Engine static constant.
   */
  const ROUTE_MOVE_LOWER_L: 5;
  /**
   * Engine static constant.
   */
  const ROUTE_MOVE_LOWER_R: 6;
  /**
   * Engine static constant.
   */
  const ROUTE_MOVE_RANDOM: 9;
  /**
   * Engine static constant.
   */
  const ROUTE_MOVE_RIGHT: 3;
  /**
   * Engine static constant.
   */
  const ROUTE_MOVE_TOWARD: 10;
  /**
   * Engine static constant.
   */
  const ROUTE_MOVE_UP: 4;
  /**
   * Engine static constant.
   */
  const ROUTE_MOVE_UPPER_L: 7;
  /**
   * Engine static constant.
   */
  const ROUTE_MOVE_UPPER_R: 8;
  /**
   * Engine static constant.
   */
  const ROUTE_PLAY_SE: 44;
  /**
   * Engine static constant.
   */
  const ROUTE_SCRIPT: 45;
  /**
   * Engine static constant.
   */
  const ROUTE_STEP_ANIME_OFF: 34;
  /**
   * Engine static constant.
   */
  const ROUTE_STEP_ANIME_ON: 33;
  /**
   * Engine static constant.
   */
  const ROUTE_SWITCH_OFF: 28;
  /**
   * Engine static constant.
   */
  const ROUTE_SWITCH_ON: 27;
  /**
   * Engine static constant.
   */
  const ROUTE_THROUGH_OFF: 38;
  /**
   * Engine static constant.
   */
  const ROUTE_THROUGH_ON: 37;
  /**
   * Engine static constant.
   */
  const ROUTE_TRANSPARENT_OFF: 40;
  /**
   * Engine static constant.
   */
  const ROUTE_TRANSPARENT_ON: 39;
  /**
   * Engine static constant.
   */
  const ROUTE_TURN_180D: 22;
  /**
   * Engine static constant.
   */
  const ROUTE_TURN_90D_L: 21;
  /**
   * Engine static constant.
   */
  const ROUTE_TURN_90D_R: 20;
  /**
   * Engine static constant.
   */
  const ROUTE_TURN_90D_R_L: 23;
  /**
   * Engine static constant.
   */
  const ROUTE_TURN_AWAY: 26;
  /**
   * Engine static constant.
   */
  const ROUTE_TURN_DOWN: 16;
  /**
   * Engine static constant.
   */
  const ROUTE_TURN_LEFT: 17;
  /**
   * Engine static constant.
   */
  const ROUTE_TURN_RANDOM: 24;
  /**
   * Engine static constant.
   */
  const ROUTE_TURN_RIGHT: 18;
  /**
   * Engine static constant.
   */
  const ROUTE_TURN_TOWARD: 25;
  /**
   * Engine static constant.
   */
  const ROUTE_TURN_UP: 19;
  /**
   * Engine static constant.
   */
  const ROUTE_WAIT: 15;
  /**
   * Engine static constant.
   */
  const ROUTE_WALK_ANIME_OFF: 32;
  /**
   * Engine static constant.
   */
  const ROUTE_WALK_ANIME_ON: 31;
}
