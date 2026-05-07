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
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link Game_Player#initMembers}, {@link Game_Player#updateDashing}.
   * Read in: {@link Game_Player#isDashing}.
   */
  _dashing: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Player#initMembers}, {@link Game_Player#makeEncounterCount}, {@link Game_Player#updateEncounterCount}.
   * Read in: {@link Game_Player#executeEncounter}.
   */
  _encounterCount: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Player#initMembers}, {@link Game_Player#reserveTransfer}.
   * Read in: {@link Game_Player#fadeType}.
   */
  _fadeType: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `Game_Followers`.
   * Initialized in: none.
   * Written in: {@link Game_Player#initMembers}.
   * Read in: {@link Game_Player#areFollowersGathered}, {@link Game_Player#areFollowersGathering}, {@link Game_Player#followers}, {@link Game_Player#gatherFollowers}, {@link Game_Player#getOffVehicle}, {@link Game_Player#hideFollowers}, {@link Game_Player#isCollided}, {@link Game_Player#jump}, {@link Game_Player#locate}, {@link Game_Player#moveDiagonally}, {@link Game_Player#moveStraight}, {@link Game_Player#refresh}, {@link Game_Player#showFollowers}, {@link Game_Player#update}.
   */
  _followers: Game_Followers;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link Game_Player#initMembers}, {@link Game_Player#performTransfer}, {@link Game_Player#requestMapReload}.
   * Read in: {@link Game_Player#performTransfer}.
   */
  _needsMapReload: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Player#clearTransferInfo}, {@link Game_Player#initMembers}, {@link Game_Player#reserveTransfer}.
   * Read in: {@link Game_Player#performTransfer}.
   */
  _newDirection: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Player#clearTransferInfo}, {@link Game_Player#initMembers}, {@link Game_Player#reserveTransfer}.
   * Read in: {@link Game_Player#newMapId}, {@link Game_Player#performTransfer}.
   */
  _newMapId: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Player#clearTransferInfo}, {@link Game_Player#initMembers}, {@link Game_Player#reserveTransfer}.
   * Read in: {@link Game_Player#performTransfer}.
   */
  _newX: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Player#clearTransferInfo}, {@link Game_Player#initMembers}, {@link Game_Player#reserveTransfer}.
   * Read in: {@link Game_Player#performTransfer}.
   */
  _newY: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link Game_Player#clearTransferInfo}, {@link Game_Player#initMembers}, {@link Game_Player#reserveTransfer}.
   * Read in: {@link Game_Player#isTransferring}.
   */
  _transferring: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link Game_Player#getOffVehicle}, {@link Game_Player#initMembers}, {@link Game_Player#updateVehicleGetOff}.
   * Read in: {@link Game_Player#canMove}, {@link Game_Player#getOffVehicle}, {@link Game_Player#isStopping}, {@link Game_Player#updateVehicle}.
   */
  _vehicleGettingOff: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link Game_Player#getOnVehicle}, {@link Game_Player#initMembers}, {@link Game_Player#updateVehicleGetOn}.
   * Read in: {@link Game_Player#canMove}, {@link Game_Player#getOnVehicle}, {@link Game_Player#isStopping}, {@link Game_Player#updateVehicle}.
   */
  _vehicleGettingOn: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `string`.
   * Initialized in: none.
   * Written in: {@link Game_Player#getOnVehicle}, {@link Game_Player#initMembers}, {@link Game_Player#updateVehicleGetOff}.
   * Read in: {@link Game_Player#isInAirship}, {@link Game_Player#isInBoat}, {@link Game_Player#isInShip}, {@link Game_Player#isNormal}, {@link Game_Player#vehicle}.
   */
  _vehicleType: string;
  /**
   * Gets are followers gathered.
   * @returns The result.
   */
  areFollowersGathered(): boolean;
  /**
   * Gets are followers gathering.
   * @returns The result.
   */
  areFollowersGathering(): boolean;
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
   * Performs center.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  center(x: number, y: number): void;
  /**
   * Gets center x.
   * @returns The result.
   */
  centerX(): number;
  /**
   * Gets center y.
   * @returns The result.
   */
  centerY(): number;
  /**
   * Performs check event trigger here.
   * @param triggers The triggers parameter.
   */
  checkEventTriggerHere(triggers: number[]): void;
  /**
   * Performs check event trigger there.
   * @param triggers The triggers parameter.
   */
  checkEventTriggerThere(triggers: number[]): void;
  /**
   * Performs check event trigger touch.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  checkEventTriggerTouch(x: number, y: number): void;
  /**
   * Clears transfer info.
   */
  clearTransferInfo(): void;
  /**
   * Gets encounter progress value.
   * @returns The result.
   */
  encounterProgressValue(): number;
  /**
   * Gets execute encounter.
   * @returns The result.
   */
  executeEncounter(): boolean;
  /**
   * Performs execute move.
   * @param direction The direction parameter.
   */
  executeMove(direction: number): void;
  /**
   * Gets fade type.
   * @returns The result.
   */
  fadeType(): number;
  /**
   * Gets followers.
   * @returns The result.
   */
  followers(): Game_Followers;
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
  getInputDirection(): number;
  /**
   * Gets off vehicle.
   * @returns The result.
   */
  getOffVehicle(): boolean;
  /**
   * Gets on off vehicle.
   * @returns The result.
   */
  getOnOffVehicle(): boolean;
  /**
   * Gets on vehicle.
   * @returns The result.
   */
  getOnVehicle(): boolean;
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
  isCollided(x: number, y: number): boolean;
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
  isMapPassable(x: number, y: number, d: number): boolean;
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
  jump(xPlus: number, yPlus: number): void;
  /**
   * Performs locate.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  locate(x: number, y: number): void;
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
  meetsEncounterConditions(encounter: object): boolean;
  /**
   * Performs move by input.
   */
  moveByInput(): void;
  /**
   * Performs move diagonally.
   * @param horz The horz parameter.
   * @param vert The vert parameter.
   */
  moveDiagonally(horz: number, vert: number): void;
  /**
   * Performs move straight.
   * @param d The d parameter.
   */
  moveStraight(d: number): void;
  /**
   * Gets new map id.
   * @returns The result.
   */
  newMapId(): number;
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
  reserveTransfer(mapId: number, x: number, y: number, d: number, fadeType: number): void;
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
  startMapEvent(x: number, y: number, triggers: number[], normal: boolean): void;
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
  triggerTouchActionD1(x1: number, y1: number): boolean;
  /**
   * Gets trigger touch action d2.
   * @param x2 The x2 parameter.
   * @param y2 The y2 parameter.
   * @returns The result.
   */
  triggerTouchActionD2(x2: number, y2: number): boolean;
  /**
   * Gets trigger touch action d3.
   * @param x2 The x2 parameter.
   * @param y2 The y2 parameter.
   * @returns The result.
   */
  triggerTouchActionD3(x2: number, y2: number): boolean;
  /**
   * Performs update.
   * @param sceneActive The sceneActive parameter.
   */
  update(sceneActive: boolean): void;
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
  updateNonmoving(wasMoving: boolean, sceneActive: boolean): void;
  /**
   * Updates scroll.
   * @param lastScrolledX The lastScrolledX parameter.
   * @param lastScrolledY The lastScrolledY parameter.
   */
  updateScroll(lastScrolledX: number, lastScrolledY: number): void;
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
  vehicle(): Game_Vehicle | null;
}
