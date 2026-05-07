/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Troop
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Troop
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _enemies: unknown[];
  _eventFlags: object;
  _interpreter: Game_Interpreter;
  _namesCount: object;
  _troopId: number;
  _turnCount: number;
  clear(): void;
  enemyNames(): string[];
  expTotal(): number;
  goldRate(): number;
  goldTotal(): number;
  increaseTurn(): void;
  initialize(): void;
  isEventRunning(): boolean;
  isTpbTurnEnd(): boolean;
  letterTable(): string[][];
  makeDropItems(): RPG_Item[];
  makeUniqueNames(): void;
  meetsConditions(page: object): boolean;
  members(): Game_Enemy[];
  setup(troopId: number): void;
  setupBattleEvent(): void;
  troop(): object;
  turnCount(): number;
  updateInterpreter(): void;
  updatePluralFlags(): void;
}
