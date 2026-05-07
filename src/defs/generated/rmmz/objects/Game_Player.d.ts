/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Player
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Player
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _dashing: boolean;
  _encounterCount: number;
  _fadeType: number;
  _followers: Game_Followers;
  _needsMapReload: boolean;
  _newDirection: number;
  _newMapId: number;
  _newX: number;
  _newY: number;
  _transferring: boolean;
  _vehicleGettingOff: boolean;
  _vehicleGettingOn: boolean;
  _vehicleType: string;
  areFollowersGathered(): boolean;
  areFollowersGathering(): boolean;
  canEncounter(): boolean;
  canMove(): boolean;
  canStartLocalEvents(): boolean;
  center(x: number, y: number): void;
  centerX(): number;
  centerY(): number;
  checkEventTriggerHere(triggers: number[]): void;
  checkEventTriggerThere(triggers: number[]): void;
  checkEventTriggerTouch(x: number, y: number): void;
  clearTransferInfo(): void;
  encounterProgressValue(): number;
  executeEncounter(): boolean;
  executeMove(direction: number): void;
  fadeType(): number;
  followers(): Game_Followers;
  forceMoveForward(): void;
  gatherFollowers(): void;
  getInputDirection(): number;
  getOffVehicle(): boolean;
  getOnOffVehicle(): boolean;
  getOnVehicle(): boolean;
  hideFollowers(): void;
  increaseSteps(): void;
  initMembers(): void;
  initialize(): void;
  isCollided(x: number, y: number): boolean;
  isDashButtonPressed(): boolean;
  isDashing(): boolean;
  isDebugThrough(): boolean;
  isInAirship(): boolean;
  isInBoat(): boolean;
  isInShip(): boolean;
  isInVehicle(): boolean;
  isMapPassable(x: number, y: number, d: number): boolean;
  isNormal(): boolean;
  isOnDamageFloor(): boolean;
  isStopping(): boolean;
  isTransferring(): boolean;
  jump(xPlus: number, yPlus: number): void;
  locate(x: number, y: number): void;
  makeEncounterCount(): void;
  makeEncounterTroopId(): number;
  meetsEncounterConditions(encounter: object): boolean;
  moveByInput(): void;
  moveDiagonally(horz: number, vert: number): void;
  moveStraight(d: number): void;
  newMapId(): number;
  performTransfer(): void;
  refresh(): void;
  requestMapReload(): void;
  reserveTransfer(mapId: number, x: number, y: number, d: number, fadeType: number): void;
  setupForNewGame(): void;
  showFollowers(): void;
  startMapEvent(x: number, y: number, triggers: number[], normal: boolean): void;
  triggerAction(): boolean;
  triggerButtonAction(): boolean;
  triggerTouchAction(): boolean;
  triggerTouchActionD1(x1: number, y1: number): boolean;
  triggerTouchActionD2(x2: number, y2: number): boolean;
  triggerTouchActionD3(x2: number, y2: number): boolean;
  update(sceneActive: boolean): void;
  updateDashing(): void;
  updateEncounterCount(): void;
  updateNonmoving(wasMoving: boolean, sceneActive: boolean): void;
  updateScroll(lastScrolledX: number, lastScrolledY: number): void;
  updateVehicle(): void;
  updateVehicleGetOff(): void;
  updateVehicleGetOn(): void;
  vehicle(): Game_Vehicle | null;
}
