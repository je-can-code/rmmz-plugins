/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Event
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Event
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _erased: boolean;
  _eventId: number;
  _interpreter: null | Game_Interpreter;
  _locked: boolean;
  _mapId: number;
  _moveType: number;
  _originalDirection: number;
  _originalPattern: number;
  _pageIndex: number;
  _prelockDirection: number;
  _starting: boolean;
  _trigger: number | null;
  checkEventTriggerAuto(): void;
  checkEventTriggerTouch(x: number, y: number): void;
  clearPageSettings(): void;
  clearStartingFlag(): void;
  erase(): void;
  event(): object;
  eventId(): number;
  findProperPageIndex(): unknown;
  forceMoveRoute(moveRoute: object): void;
  initMembers(): void;
  initialize(mapId: number, eventId: number): void;
  isCollidedWithCharacters(x: number, y: number): boolean;
  isCollidedWithEvents(x: number, y: number): boolean;
  isCollidedWithPlayerCharacters(x: number, y: number): boolean;
  isNearThePlayer(): boolean;
  isOriginalPattern(): boolean;
  isStarting(): boolean;
  isTriggerIn(triggers: number[]): boolean;
  list(): Array<{ code: number; indent: number; parameters: readonly (number | string | boolean | object | null)[] }>;
  locate(x: number, y: number): void;
  lock(): void;
  meetsConditions(page: object): boolean;
  moveTypeCustom(): void;
  moveTypeRandom(): void;
  moveTypeTowardPlayer(): void;
  page(): object;
  refresh(): void;
  resetPattern(): void;
  setupPage(): void;
  setupPageSettings(): void;
  start(): void;
  stopCountThreshold(): number;
  unlock(): void;
  update(): void;
  updateParallel(): void;
  updateSelfMovement(): void;
  updateStop(): void;
}
