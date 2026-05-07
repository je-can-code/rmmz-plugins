/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Event
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Event extends Game_Character
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Event#erase}, {@link Game_Event#initMembers}.<br/>
   * Read in: {@link Game_Event#refresh}.<br/>
   */
  _erased: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: {@link Game_Event#initialize}.<br/>
   * Written in: {@link Game_Event#initialize}.<br/>
   * Read in: {@link Game_Event#event}, {@link Game_Event#eventId}, {@link Game_Event#meetsConditions}, {@link Game_Event#updateParallel}.<br/>
   */
  _eventId: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | Game_Interpreter`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Event#clearPageSettings}, {@link Game_Event#setupPageSettings}.<br/>
   * Read in: {@link Game_Event#updateParallel}.<br/>
   */
  _interpreter: null | Game_Interpreter;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Event#initMembers}, {@link Game_Event#lock}, {@link Game_Event#unlock}.<br/>
   * Read in: {@link Game_Event#lock}, {@link Game_Event#unlock}, {@link Game_Event#updateSelfMovement}, {@link Game_Event#updateStop}.<br/>
   */
  _locked: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: {@link Game_Event#initialize}.<br/>
   * Written in: {@link Game_Event#initialize}.<br/>
   * Read in: {@link Game_Event#meetsConditions}.<br/>
   */
  _mapId: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Event#clearPageSettings}, {@link Game_Event#initMembers}, {@link Game_Event#setupPageSettings}.<br/>
   * Read in: {@link Game_Event#updateSelfMovement}.<br/>
   */
  _moveType: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Event#initMembers}, {@link Game_Event#setupPageSettings}.<br/>
   * Read in: {@link Game_Event#setupPageSettings}.<br/>
   */
  _originalDirection: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Event#initMembers}, {@link Game_Event#setupPageSettings}.<br/>
   * Read in: {@link Game_Event#isOriginalPattern}, {@link Game_Event#resetPattern}, {@link Game_Event#setupPageSettings}.<br/>
   */
  _originalPattern: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Event#initMembers}, {@link Game_Event#refresh}.<br/>
   * Read in: {@link Game_Event#page}, {@link Game_Event#refresh}, {@link Game_Event#setupPage}.<br/>
   */
  _pageIndex: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Event#forceMoveRoute}, {@link Game_Event#initMembers}, {@link Game_Event#locate}, {@link Game_Event#lock}, {@link Game_Event#setupPageSettings}.<br/>
   * Read in: {@link Game_Event#unlock}.<br/>
   */
  _prelockDirection: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Event#clearStartingFlag}, {@link Game_Event#initMembers}, {@link Game_Event#start}.<br/>
   * Read in: {@link Game_Event#isStarting}.<br/>
   */
  _starting: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number | null`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Event#clearPageSettings}, {@link Game_Event#initMembers}, {@link Game_Event#setupPageSettings}.<br/>
   * Read in: {@link Game_Event#checkEventTriggerAuto}, {@link Game_Event#checkEventTriggerTouch}, {@link Game_Event#isTriggerIn}, {@link Game_Event#setupPageSettings}.<br/>
   */
  _trigger: number | null;
  /**
   * Performs check event trigger auto.
   */
  checkEventTriggerAuto(): void;
  /**
   * Performs check event trigger touch.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  checkEventTriggerTouch(x: unknown, y: unknown): void;
  /**
   * Clears page settings.
   */
  clearPageSettings(): void;
  /**
   * Clears starting flag.
   */
  clearStartingFlag(): void;
  /**
   * Performs erase.
   */
  erase(): void;
  /**
   * Gets event.
   * @returns The result.
   */
  event(): unknown;
  /**
   * Gets event id.
   * @returns The result.
   */
  eventId(): unknown;
  /**
   * Gets find proper page index.
   * @returns The result.
   */
  findProperPageIndex(): unknown;
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
   * @param mapId The mapId parameter.
   * @param eventId The eventId parameter.
   */
  initialize(mapId: unknown, eventId: unknown): void;
  /**
   * Determines whether collided with characters.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns True if collided with characters; false otherwise.
   */
  isCollidedWithCharacters(x: unknown, y: unknown): boolean;
  /**
   * Determines whether collided with events.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns True if collided with events; false otherwise.
   */
  isCollidedWithEvents(x: unknown, y: unknown): boolean;
  /**
   * Determines whether collided with player characters.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns True if collided with player characters; false otherwise.
   */
  isCollidedWithPlayerCharacters(x: unknown, y: unknown): boolean;
  /**
   * Determines whether near the player.
   * @returns True if near the player; false otherwise.
   */
  isNearThePlayer(): boolean;
  /**
   * Determines whether original pattern.
   * @returns True if original pattern; false otherwise.
   */
  isOriginalPattern(): boolean;
  /**
   * Determines whether starting.
   * @returns True if starting; false otherwise.
   */
  isStarting(): boolean;
  /**
   * Determines whether trigger in.
   * @param triggers The triggers parameter.
   * @returns True if trigger in; false otherwise.
   */
  isTriggerIn(triggers: unknown): boolean;
  /**
   * Gets list.
   * @returns The result.
   */
  list(): unknown;
  /**
   * Performs locate.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  locate(x: unknown, y: unknown): void;
  /**
   * Performs lock.
   */
  lock(): void;
  /**
   * Gets meets conditions.
   * @param page The page parameter.
   * @returns The result.
   */
  meetsConditions(page: unknown): boolean;
  /**
   * Performs move type custom.
   */
  moveTypeCustom(): void;
  /**
   * Performs move type random.
   */
  moveTypeRandom(): void;
  /**
   * Performs move type toward player.
   */
  moveTypeTowardPlayer(): void;
  /**
   * Gets page.
   * @returns The result.
   */
  page(): unknown;
  /**
   * Performs refresh.
   */
  refresh(): void;
  /**
   * Clears pattern.
   */
  resetPattern(): void;
  /**
   * Performs setup page.
   */
  setupPage(): void;
  /**
   * Performs setup page settings.
   */
  setupPageSettings(): void;
  /**
   * Performs start.
   */
  start(): void;
  /**
   * Gets stop count threshold.
   * @returns The result.
   */
  stopCountThreshold(): unknown;
  /**
   * Performs unlock.
   */
  unlock(): void;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates parallel.
   */
  updateParallel(): void;
  /**
   * Updates self movement.
   */
  updateSelfMovement(): void;
  /**
   * Updates stop.
   */
  updateStop(): void;
}
