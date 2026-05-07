/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Unit
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Unit
{
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: {@link Game_Unit#initialize}.
   * Written in: {@link Game_Unit#initialize}, {@link Game_Unit#onBattleEnd}, {@link Game_Unit#onBattleStart}.
   * Read in: {@link Game_Unit#inBattle}.
   */
  _inBattle: boolean;
  /**
   * Gets agility.
   * @returns The result.
   */
  agility(): number;
  /**
   * Gets alive members.
   * @returns The result.
   */
  aliveMembers(): Game_Battler[];
  /**
   * Clears actions.
   */
  clearActions(): void;
  /**
   * Clears results.
   */
  clearResults(): void;
  /**
   * Gets dead members.
   * @returns The result.
   */
  deadMembers(): Game_Battler[];
  /**
   * Gets in battle.
   * @returns The result.
   */
  inBattle(): boolean;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Determines whether all dead.
   * @returns True if all dead; false otherwise.
   */
  isAllDead(): boolean;
  /**
   * Creates actions.
   */
  makeActions(): void;
  /**
   * Gets members.
   * @returns The result.
   */
  members(): Game_Battler[];
  /**
   * Gets movable members.
   * @returns The result.
   */
  movableMembers(): Game_Battler[];
  /**
   * Performs on battle end.
   */
  onBattleEnd(): void;
  /**
   * Performs on battle start.
   * @param advantageous The advantageous parameter.
   */
  onBattleStart(advantageous: boolean): void;
  /**
   * Gets random dead target.
   * @returns The result.
   */
  randomDeadTarget(): Game_Battler | null;
  /**
   * Gets random target.
   * @returns The result.
   */
  randomTarget(): Game_Battler | null;
  /**
   * Performs select.
   * @param activeMember The activeMember parameter.
   */
  select(activeMember: Game_Battler): void;
  /**
   * Gets smooth dead target.
   * @param index The index parameter.
   * @returns The result.
   */
  smoothDeadTarget(index: number): Game_Battler | undefined;
  /**
   * Gets smooth target.
   * @param index The index parameter.
   * @returns The result.
   */
  smoothTarget(index: number): Game_Battler | undefined;
  /**
   * Gets substitute battler.
   * @param target The target parameter.
   * @returns The result.
   */
  substituteBattler(target: Game_Battler): Game_Battler | null;
  /**
   * Gets tgr sum.
   * @returns The result.
   */
  tgrSum(): number;
  /**
   * Gets tpb base speed.
   * @returns The result.
   */
  tpbBaseSpeed(): number;
  /**
   * Gets tpb reference time.
   * @returns The result.
   */
  tpbReferenceTime(): number;
  /**
   * Updates tpb.
   */
  updateTpb(): void;
}
