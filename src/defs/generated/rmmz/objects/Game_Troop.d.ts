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
   * Inferred engine backing field.
   *
   * Type: `unknown[]`.
   * Initialized in: none.
   * Written in: {@link Game_Troop#clear}, {@link Game_Troop#setup}.
   * Read in: {@link Game_Troop#members}, {@link Game_Troop#setup}.
   *
   * Consumed by:
   * - `push()`: {@link Game_Troop#setup}.
   */
  _enemies: unknown[];
  /**
   * Inferred engine backing field.
   *
   * Type: `object`.
   * Initialized in: none.
   * Written in: {@link Game_Troop#clear}.
   * Read in: {@link Game_Troop#increaseTurn}, {@link Game_Troop#setupBattleEvent}.
   */
  _eventFlags: object;
  /**
   * Inferred engine backing field.
   *
   * Type: `Game_Interpreter`.
   * Initialized in: {@link Game_Troop#initialize}.
   * Written in: {@link Game_Troop#initialize}.
   * Read in: {@link Game_Troop#clear}, {@link Game_Troop#isEventRunning}, {@link Game_Troop#setupBattleEvent}, {@link Game_Troop#updateInterpreter}.
   *
   * Consumed by:
   * - `clear()`: {@link Game_Troop#clear}.
   */
  _interpreter: Game_Interpreter;
  /**
   * Inferred engine backing field.
   *
   * Type: `object`.
   * Initialized in: none.
   * Written in: {@link Game_Troop#clear}.
   * Read in: {@link Game_Troop#makeUniqueNames}, {@link Game_Troop#updatePluralFlags}.
   */
  _namesCount: object;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Troop#clear}, {@link Game_Troop#setup}.
   * Read in: {@link Game_Troop#troop}.
   */
  _troopId: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Troop#clear}, {@link Game_Troop#increaseTurn}.
   * Read in: {@link Game_Troop#isTpbTurnEnd}, {@link Game_Troop#meetsConditions}, {@link Game_Troop#turnCount}.
   */
  _turnCount: number;
  /**
   * Performs clear.
   */
  clear(): void;
  /**
   * Gets enemy names.
   * @returns The result.
   */
  enemyNames(): string[];
  /**
   * Gets exp total.
   * @returns The result.
   */
  expTotal(): number;
  /**
   * Gets gold rate.
   * @returns The result.
   */
  goldRate(): number;
  /**
   * Gets gold total.
   * @returns The result.
   */
  goldTotal(): number;
  /**
   * Performs increase turn.
   */
  increaseTurn(): void;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Determines whether event running.
   * @returns True if event running; false otherwise.
   */
  isEventRunning(): boolean;
  /**
   * Determines whether tpb turn end.
   * @returns True if tpb turn end; false otherwise.
   */
  isTpbTurnEnd(): boolean;
  /**
   * Gets letter table.
   * @returns The result.
   */
  letterTable(): string[][];
  /**
   * Creates drop items.
   * @returns The result.
   */
  makeDropItems(): RPG_Item[];
  /**
   * Creates unique names.
   */
  makeUniqueNames(): void;
  /**
   * Gets meets conditions.
   * @param page The page parameter.
   * @returns The result.
   */
  meetsConditions(page: object): boolean;
  /**
   * Gets members.
   * @returns The result.
   */
  members(): Game_Enemy[];
  /**
   * Performs setup.
   * @param troopId The troopId parameter.
   */
  setup(troopId: number): void;
  /**
   * Performs setup battle event.
   */
  setupBattleEvent(): void;
  /**
   * Gets troop.
   * @returns The result.
   */
  troop(): object;
  /**
   * Gets turn count.
   * @returns The result.
   */
  turnCount(): number;
  /**
   * Updates interpreter.
   */
  updateInterpreter(): void;
  /**
   * Updates plural flags.
   */
  updatePluralFlags(): void;
}
