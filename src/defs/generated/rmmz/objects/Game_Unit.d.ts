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
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link Game_Unit#initialize}.<br/>
   * Written in: {@link Game_Unit#initialize}, {@link Game_Unit#onBattleEnd}, {@link Game_Unit#onBattleStart}.<br/>
   * Read in: {@link Game_Unit#inBattle}.<br/>
   */
  _inBattle: boolean;
  /**
   * Gets agility.
   * @returns The result.
   */
  agility(): unknown;
  /**
   * Gets alive members.
   * @returns The result.
   */
  aliveMembers(): unknown;
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
  deadMembers(): unknown;
  /**
   * Gets in battle.
   * @returns The result.
   */
  inBattle(): unknown;
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
  members(): unknown[];
  /**
   * Gets movable members.
   * @returns The result.
   */
  movableMembers(): unknown;
  /**
   * Performs on battle end.
   */
  onBattleEnd(): void;
  /**
   * Performs on battle start.
   * @param advantageous The advantageous parameter.
   */
  onBattleStart(advantageous: unknown): void;
  /**
   * Gets random dead target.
   * @returns The result.
   */
  randomDeadTarget(): null;
  /**
   * Gets random target.
   * @returns The result.
   */
  randomTarget(): unknown;
  /**
   * Performs select.
   * @param activeMember The activeMember parameter.
   */
  select(activeMember: unknown): void;
  /**
   * Gets smooth dead target.
   * @param index The index parameter.
   * @returns The result.
   */
  smoothDeadTarget(index: unknown): unknown;
  /**
   * Gets smooth target.
   * @param index The index parameter.
   * @returns The result.
   */
  smoothTarget(index: unknown): unknown;
  /**
   * Gets substitute battler.
   * @param target The target parameter.
   * @returns The result.
   */
  substituteBattler(target: unknown): unknown;
  /**
   * Gets tgr sum.
   * @returns The result.
   */
  tgrSum(): unknown;
  /**
   * Gets tpb base speed.
   * @returns The result.
   */
  tpbBaseSpeed(): unknown;
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
