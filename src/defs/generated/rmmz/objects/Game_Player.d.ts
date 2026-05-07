/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Player
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Player extends Game_Character
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Player#initMembers}, {@link Game_Player#updateDashing}.<br/>
   * Read in: {@link Game_Player#isDashing}.<br/>
   */
  _dashing: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Player#initMembers}, {@link Game_Player#makeEncounterCount}, {@link Game_Player#updateEncounterCount}.<br/>
   * Read in: {@link Game_Player#executeEncounter}.<br/>
   */
  _encounterCount: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Player#initMembers}, {@link Game_Player#reserveTransfer}.<br/>
   * Read in: {@link Game_Player#fadeType}.<br/>
   */
  _fadeType: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Game_Followers`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Player#initMembers}.<br/>
   * Read in: {@link Game_Player#areFollowersGathered}, {@link Game_Player#areFollowersGathering}, {@link Game_Player#followers}, {@link Game_Player#gatherFollowers}, {@link Game_Player#getOffVehicle}, {@link Game_Player#hideFollowers}, {@link Game_Player#isCollided}, {@link Game_Player#jump}, {@link Game_Player#locate}, {@link Game_Player#moveDiagonally}, {@link Game_Player#moveStraight}, {@link Game_Player#refresh}, {@link Game_Player#showFollowers}, {@link Game_Player#update}.<br/>
   */
  _followers: Game_Followers;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Player#initMembers}, {@link Game_Player#performTransfer}, {@link Game_Player#requestMapReload}.<br/>
   * Read in: {@link Game_Player#performTransfer}.<br/>
   */
  _needsMapReload: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Player#clearTransferInfo}, {@link Game_Player#initMembers}, {@link Game_Player#reserveTransfer}.<br/>
   * Read in: {@link Game_Player#performTransfer}.<br/>
   */
  _newDirection: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Player#clearTransferInfo}, {@link Game_Player#initMembers}, {@link Game_Player#reserveTransfer}.<br/>
   * Read in: {@link Game_Player#newMapId}, {@link Game_Player#performTransfer}.<br/>
   */
  _newMapId: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Player#clearTransferInfo}, {@link Game_Player#initMembers}, {@link Game_Player#reserveTransfer}.<br/>
   * Read in: {@link Game_Player#performTransfer}.<br/>
   */
  _newX: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Player#clearTransferInfo}, {@link Game_Player#initMembers}, {@link Game_Player#reserveTransfer}.<br/>
   * Read in: {@link Game_Player#performTransfer}.<br/>
   */
  _newY: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Player#clearTransferInfo}, {@link Game_Player#initMembers}, {@link Game_Player#reserveTransfer}.<br/>
   * Read in: {@link Game_Player#isTransferring}.<br/>
   */
  _transferring: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Player#getOffVehicle}, {@link Game_Player#initMembers}, {@link Game_Player#updateVehicleGetOff}.<br/>
   * Read in: {@link Game_Player#canMove}, {@link Game_Player#getOffVehicle}, {@link Game_Player#isStopping}, {@link Game_Player#updateVehicle}.<br/>
   */
  _vehicleGettingOff: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Player#getOnVehicle}, {@link Game_Player#initMembers}, {@link Game_Player#updateVehicleGetOn}.<br/>
   * Read in: {@link Game_Player#canMove}, {@link Game_Player#getOnVehicle}, {@link Game_Player#isStopping}, {@link Game_Player#updateVehicle}.<br/>
   */
  _vehicleGettingOn: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `string`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Player#getOnVehicle}, {@link Game_Player#initMembers}, {@link Game_Player#updateVehicleGetOff}.<br/>
   * Read in: {@link Game_Player#isInAirship}, {@link Game_Player#isInBoat}, {@link Game_Player#isInShip}, {@link Game_Player#isNormal}, {@link Game_Player#vehicle}.<br/>
   */
  _vehicleType: string;
  /**
   * Gets are followers gathered.
   * @returns The result.
   */
  areFollowersGathered(): unknown;
  /**
   * Gets are followers gathering.
   * @returns The result.
   */
  areFollowersGathering(): unknown;
  /**
   * Determines whether encounter.
   * @returns True if encounter; false otherwise.
   */
  canEncounter(): boolean;
  /**
   * Determines whether move.
   * @returns True if move; false otherwise.
   */
  canMove(): boolean;
  /**
   * Determines whether start local events.
   * @returns True if start local events; false otherwise.
   */
  canStartLocalEvents(): boolean;
  /**
   * Gets center.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns The result.
   */
  center(x: unknown, y: unknown): unknown;
  /**
   * Gets center x.
   * @returns The result.
   */
  centerX(): unknown;
  /**
   * Gets center y.
   * @returns The result.
   */
  centerY(): unknown;
  /**
   * Performs check event trigger here.
   * @param triggers The triggers parameter.
   */
  checkEventTriggerHere(triggers: unknown): void;
  /**
   * Performs check event trigger there.
   * @param triggers The triggers parameter.
   */
  checkEventTriggerThere(triggers: unknown): void;
  /**
   * Performs check event trigger touch.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  checkEventTriggerTouch(x: unknown, y: unknown): void;
  /**
   * Clears transfer info.
   */
  clearTransferInfo(): void;
  /**
   * Gets encounter progress value.
   * @returns The result.
   */
  encounterProgressValue(): unknown;
  /**
   * Gets execute encounter.
   * @returns The result.
   */
  executeEncounter(): boolean;
  /**
   * Performs execute move.
   * @param direction The direction parameter.
   */
  executeMove(direction: unknown): void;
  /**
   * Gets fade type.
   * @returns The result.
   */
  fadeType(): unknown;
  /**
   * Gets followers.
   * @returns The result.
   */
  followers(): unknown;
  /**
   * Performs force move forward.
   */
  forceMoveForward(): void;
  /**
   * Performs gather followers.
   */
  gatherFollowers(): void;
  /**
   * Gets input direction.
   * @returns The result.
   */
  getInputDirection(): unknown;
  /**
   * Gets off vehicle.
   * @returns The result.
   */
  getOffVehicle(): unknown;
  /**
   * Gets on off vehicle.
   * @returns The result.
   */
  getOnOffVehicle(): unknown;
  /**
   * Gets on vehicle.
   * @returns The result.
   */
  getOnVehicle(): unknown;
  /**
   * Performs hide followers.
   */
  hideFollowers(): void;
  /**
   * Performs increase steps.
   */
  increaseSteps(): void;
  /**
   * Initializes members.
   */
  initMembers(): void;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Determines whether collided.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns True if collided; false otherwise.
   */
  isCollided(x: unknown, y: unknown): boolean;
  /**
   * Determines whether dash button pressed.
   * @returns True if dash button pressed; false otherwise.
   */
  isDashButtonPressed(): boolean;
  /**
   * Determines whether dashing.
   * @returns True if dashing; false otherwise.
   */
  isDashing(): boolean;
  /**
   * Determines whether debug through.
   * @returns True if debug through; false otherwise.
   */
  isDebugThrough(): boolean;
  /**
   * Determines whether in airship.
   * @returns True if in airship; false otherwise.
   */
  isInAirship(): boolean;
  /**
   * Determines whether in boat.
   * @returns True if in boat; false otherwise.
   */
  isInBoat(): boolean;
  /**
   * Determines whether in ship.
   * @returns True if in ship; false otherwise.
   */
  isInShip(): boolean;
  /**
   * Determines whether in vehicle.
   * @returns True if in vehicle; false otherwise.
   */
  isInVehicle(): boolean;
  /**
   * Determines whether map passable.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param d The d parameter.
   * @returns True if map passable; false otherwise.
   */
  isMapPassable(x: unknown, y: unknown, d: unknown): boolean;
  /**
   * Determines whether normal.
   * @returns True if normal; false otherwise.
   */
  isNormal(): boolean;
  /**
   * Determines whether on damage floor.
   * @returns True if on damage floor; false otherwise.
   */
  isOnDamageFloor(): boolean;
  /**
   * Determines whether stopping.
   * @returns True if stopping; false otherwise.
   */
  isStopping(): boolean;
  /**
   * Determines whether transferring.
   * @returns True if transferring; false otherwise.
   */
  isTransferring(): boolean;
  /**
   * Performs jump.
   * @param xPlus The xPlus parameter.
   * @param yPlus The yPlus parameter.
   */
  jump(xPlus: unknown, yPlus: unknown): void;
  /**
   * Performs locate.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  locate(x: unknown, y: unknown): void;
  /**
   * Creates encounter count.
   */
  makeEncounterCount(): void;
  /**
   * Creates encounter troop id.
   * @returns The result.
   */
  makeEncounterTroopId(): number;
  /**
   * Gets meets encounter conditions.
   * @param encounter The encounter parameter.
   * @returns The result.
   */
  meetsEncounterConditions(encounter: unknown): boolean;
  /**
   * Performs move by input.
   */
  moveByInput(): void;
  /**
   * Performs move diagonally.
   * @param horz The horz parameter.
   * @param vert The vert parameter.
   */
  moveDiagonally(horz: unknown, vert: unknown): void;
  /**
   * Performs move straight.
   * @param d The d parameter.
   */
  moveStraight(d: unknown): void;
  /**
   * Gets new map id.
   * @returns The result.
   */
  newMapId(): unknown;
  /**
   * Performs perform transfer.
   */
  performTransfer(): void;
  /**
   * Performs refresh.
   */
  refresh(): void;
  /**
   * Performs request map reload.
   */
  requestMapReload(): void;
  /**
   * Performs reserve transfer.
   * @param mapId The mapId parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param d The d parameter.
   * @param fadeType The fadeType parameter.
   */
  reserveTransfer(mapId: unknown, x: unknown, y: unknown, d: unknown, fadeType: unknown): void;
  /**
   * Performs setup for new game.
   */
  setupForNewGame(): void;
  /**
   * Performs show followers.
   */
  showFollowers(): void;
  /**
   * Performs start map event.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param triggers The triggers parameter.
   * @param normal The normal parameter.
   */
  startMapEvent(x: unknown, y: unknown, triggers: unknown, normal: unknown): void;
  /**
   * Gets trigger action.
   * @returns The result.
   */
  triggerAction(): boolean;
  /**
   * Gets trigger button action.
   * @returns The result.
   */
  triggerButtonAction(): boolean;
  /**
   * Gets trigger touch action.
   * @returns The result.
   */
  triggerTouchAction(): boolean;
  /**
   * Gets trigger touch action d1.
   * @param x1 The x1 parameter.
   * @param y1 The y1 parameter.
   * @returns The result.
   */
  triggerTouchActionD1(x1: unknown, y1: unknown): boolean;
  /**
   * Gets trigger touch action d2.
   * @param x2 The x2 parameter.
   * @param y2 The y2 parameter.
   * @returns The result.
   */
  triggerTouchActionD2(x2: unknown, y2: unknown): boolean;
  /**
   * Gets trigger touch action d3.
   * @param x2 The x2 parameter.
   * @param y2 The y2 parameter.
   * @returns The result.
   */
  triggerTouchActionD3(x2: unknown, y2: unknown): unknown;
  /**
   * Performs update.
   * @param sceneActive The sceneActive parameter.
   */
  update(sceneActive: unknown): void;
  /**
   * Updates dashing.
   */
  updateDashing(): void;
  /**
   * Updates encounter count.
   */
  updateEncounterCount(): void;
  /**
   * Updates nonmoving.
   * @param wasMoving The wasMoving parameter.
   * @param sceneActive The sceneActive parameter.
   */
  updateNonmoving(wasMoving: unknown, sceneActive: unknown): void;
  /**
   * Updates scroll.
   * @param lastScrolledX The lastScrolledX parameter.
   * @param lastScrolledY The lastScrolledY parameter.
   */
  updateScroll(lastScrolledX: unknown, lastScrolledY: unknown): void;
  /**
   * Updates vehicle.
   */
  updateVehicle(): void;
  /**
   * Updates vehicle get off.
   */
  updateVehicleGetOff(): void;
  /**
   * Updates vehicle get on.
   */
  updateVehicleGetOn(): void;
  /**
   * Gets vehicle.
   * @returns The result.
   */
  vehicle(): unknown;
}
