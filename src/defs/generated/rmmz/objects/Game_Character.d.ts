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
   * Inferred engine backing field.
   *
   * Type: `null | object`.
   * Initialized in: none.
   * Written in: {@link Game_Character#forceMoveRoute}, {@link Game_Character#initMembers}, {@link Game_Character#restoreMoveRoute}, {@link Game_Character#setMoveRoute}.
   * Read in: {@link Game_Character#advanceMoveRouteIndex}, {@link Game_Character#memorizeMoveRoute}, {@link Game_Character#processRouteEnd}, {@link Game_Character#updateRoutineMove}.
   */
  _moveRoute: null | object;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link Game_Character#forceMoveRoute}, {@link Game_Character#initMembers}, {@link Game_Character#processRouteEnd}.
   * Read in: {@link Game_Character#isMoveRouteForcing}, {@link Game_Character#processRouteEnd}, {@link Game_Character#setMoveRoute}, {@link Game_Character#updateStop}.
   */
  _moveRouteForcing: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Character#advanceMoveRouteIndex}, {@link Game_Character#forceMoveRoute}, {@link Game_Character#initMembers}, {@link Game_Character#processRouteEnd}, {@link Game_Character#restoreMoveRoute}, {@link Game_Character#setMoveRoute}.
   * Read in: {@link Game_Character#advanceMoveRouteIndex}, {@link Game_Character#memorizeMoveRoute}, {@link Game_Character#updateRoutineMove}.
   */
  _moveRouteIndex: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `null | object`.
   * Initialized in: none.
   * Written in: {@link Game_Character#initMembers}, {@link Game_Character#memorizeMoveRoute}, {@link Game_Character#restoreMoveRoute}, {@link Game_Character#setMoveRoute}.
   * Read in: {@link Game_Character#forceMoveRoute}, {@link Game_Character#restoreMoveRoute}.
   */
  _originalMoveRoute: null | object;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Character#initMembers}, {@link Game_Character#memorizeMoveRoute}, {@link Game_Character#setMoveRoute}.
   * Read in: {@link Game_Character#restoreMoveRoute}.
   */
  _originalMoveRouteIndex: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Character#forceMoveRoute}, {@link Game_Character#initMembers}, {@link Game_Character#processMoveCommand}, {@link Game_Character#updateRoutineMove}.
   * Read in: {@link Game_Character#updateRoutineMove}.
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
  deltaXFrom(x: number): number;
  /**
   * Gets delta yfrom.
   * @param y The y parameter.
   * @returns The result.
   */
  deltaYFrom(y: number): number;
  /**
   * Gets find direction to.
   * @param goalX The goalX parameter.
   * @param goalY The goalY parameter.
   * @returns The result.
   */
  findDirectionTo(goalX: number, goalY: number): number;
  /**
   * Performs force move route.
   * @param moveRoute The moveRoute parameter.
   */
  forceMoveRoute(moveRoute: object): void;
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
  moveAwayFromCharacter(character: Game_Character): void;
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
  moveTowardCharacter(character: Game_Character): void;
  /**
   * Performs move toward player.
   */
  moveTowardPlayer(): void;
  /**
   * Performs process move command.
   * @param command The command parameter.
   */
  processMoveCommand(command: object): void;
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
  setMoveRoute(moveRoute: object): void;
  /**
   * Performs swap.
   * @param character The character parameter.
   */
  swap(character: Game_Character): void;
  /**
   * Performs turn180.
   */
  turn180(): void;
  /**
   * Performs turn away from character.
   * @param character The character parameter.
   */
  turnAwayFromCharacter(character: Game_Character): void;
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
  turnTowardCharacter(character: Game_Character): void;
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
