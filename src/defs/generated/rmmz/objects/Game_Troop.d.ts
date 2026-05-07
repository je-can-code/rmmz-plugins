/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Troop
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Troop extends Game_Unit
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Troop#clear}, {@link Game_Troop#setup}.<br/>
   * Read in: {@link Game_Troop#members}, {@link Game_Troop#setup}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `push()`: {@link Game_Troop#setup}.<br/>
   */
  _enemies: unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `object`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Troop#clear}.<br/>
   * Read in: {@link Game_Troop#increaseTurn}, {@link Game_Troop#setupBattleEvent}.<br/>
   */
  _eventFlags: object;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Game_Interpreter`.<br/>
   * Initialized in: {@link Game_Troop#initialize}.<br/>
   * Written in: {@link Game_Troop#initialize}.<br/>
   * Read in: {@link Game_Troop#clear}, {@link Game_Troop#isEventRunning}, {@link Game_Troop#setupBattleEvent}, {@link Game_Troop#updateInterpreter}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `clear()`: {@link Game_Troop#clear}.<br/>
   */
  _interpreter: Game_Interpreter;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `object`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Troop#clear}.<br/>
   * Read in: {@link Game_Troop#makeUniqueNames}, {@link Game_Troop#updatePluralFlags}.<br/>
   */
  _namesCount: object;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Troop#clear}, {@link Game_Troop#setup}.<br/>
   * Read in: {@link Game_Troop#troop}.<br/>
   */
  _troopId: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Troop#clear}, {@link Game_Troop#increaseTurn}.<br/>
   * Read in: {@link Game_Troop#isTpbTurnEnd}, {@link Game_Troop#meetsConditions}, {@link Game_Troop#turnCount}.<br/>
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
  enemyNames(): unknown;
  /**
   * Gets exp total.
   * @returns The result.
   */
  expTotal(): unknown;
  /**
   * Gets gold rate.
   * @returns The result.
   */
  goldRate(): number;
  /**
   * Gets gold total.
   * @returns The result.
   */
  goldTotal(): unknown;
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
  letterTable(): unknown;
  /**
   * Creates drop items.
   * @returns The result.
   */
  makeDropItems(): unknown;
  /**
   * Creates unique names.
   */
  makeUniqueNames(): void;
  /**
   * Gets meets conditions.
   * @param page The page parameter.
   * @returns The result.
   */
  meetsConditions(page: unknown): boolean;
  /**
   * Gets members.
   * @returns The result.
   */
  members(): unknown;
  /**
   * Performs setup.
   * @param troopId The troopId parameter.
   */
  setup(troopId: unknown): void;
  /**
   * Performs setup battle event.
   */
  setupBattleEvent(): void;
  /**
   * Gets troop.
   * @returns The result.
   */
  troop(): unknown;
  /**
   * Gets turn count.
   * @returns The result.
   */
  turnCount(): unknown;
  /**
   * Updates interpreter.
   */
  updateInterpreter(): void;
  /**
   * Updates plural flags.
   */
  updatePluralFlags(): void;
}
