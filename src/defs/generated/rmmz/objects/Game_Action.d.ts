/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Action
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Action
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: {@link Game_Action#initialize}.<br/>
   * Written in: {@link Game_Action#initialize}.<br/>
   * Read in: {@link Game_Action#isValid}, {@link Game_Action#makeTargets}, {@link Game_Action#prepare}.<br/>
   */
  _forcing: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Game_Item`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Action#clear}.<br/>
   * Read in: {@link Game_Action#isItem}, {@link Game_Action#isSkill}, {@link Game_Action#item}, {@link Game_Action#setItem}, {@link Game_Action#setItemObject}, {@link Game_Action#setSkill}.<br/>
   */
  _item: Game_Item;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Game_Action#initialize}.<br/>
   * Written in: {@link Game_Action#initialize}, {@link Game_Action#setSubject}.<br/>
   * Read in: {@link Game_Action#subject}.<br/>
   */
  _subjectActorId: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Game_Action#initialize}.<br/>
   * Written in: {@link Game_Action#initialize}, {@link Game_Action#setSubject}.<br/>
   * Read in: {@link Game_Action#subject}.<br/>
   */
  _subjectEnemyIndex: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Action#clear}, {@link Game_Action#decideRandomTarget}, {@link Game_Action#evaluate}, {@link Game_Action#setTarget}.<br/>
   * Read in: {@link Game_Action#targetsForAlive}, {@link Game_Action#targetsForDead}, {@link Game_Action#targetsForDeadAndAlive}.<br/>
   */
  _targetIndex: number;
  /**
   * Performs apply.
   * @param target The target parameter.
   */
  apply(target: unknown): void;
  /**
   * Gets apply critical.
   * @param damage The damage parameter.
   * @returns The result.
   */
  applyCritical(damage: unknown): unknown;
  /**
   * Performs apply global.
   */
  applyGlobal(): void;
  /**
   * Gets apply guard.
   * @param damage The damage parameter.
   * @param target The target parameter.
   * @returns The result.
   */
  applyGuard(damage: unknown, target: unknown): unknown;
  /**
   * Performs apply item effect.
   * @param target The target parameter.
   * @param effect The effect parameter.
   */
  applyItemEffect(target: unknown, effect: unknown): void;
  /**
   * Performs apply item user effect.
   */
  applyItemUserEffect(): void;
  /**
   * Gets apply variance.
   * @param damage The damage parameter.
   * @param variance The variance parameter.
   * @returns The result.
   */
  applyVariance(damage: unknown, variance: unknown): unknown;
  /**
   * Gets calc element rate.
   * @param target The target parameter.
   * @returns The result.
   */
  calcElementRate(target: unknown): unknown;
  /**
   * Gets check damage type.
   * @param list The list parameter.
   * @returns The result.
   */
  checkDamageType(list: unknown): unknown;
  /**
   * Gets check item scope.
   * @param list The list parameter.
   * @returns The result.
   */
  checkItemScope(list: unknown): unknown;
  /**
   * Performs clear.
   */
  clear(): void;
  /**
   * Gets confusion target.
   * @returns The result.
   */
  confusionTarget(): unknown;
  /**
   * Performs decide random target.
   */
  decideRandomTarget(): void;
  /**
   * Gets elements max rate.
   * @param target The target parameter.
   * @param elements The elements parameter.
   * @returns The result.
   */
  elementsMaxRate(target: unknown, elements: unknown): number;
  /**
   * Gets eval damage formula.
   * @param target The target parameter.
   * @returns The result.
   */
  evalDamageFormula(target: unknown): number | unknown | number;
  /**
   * Gets evaluate.
   * @returns The result.
   */
  evaluate(): unknown;
  /**
   * Gets evaluate with target.
   * @param target The target parameter.
   * @returns The result.
   */
  evaluateWithTarget(target: unknown): unknown;
  /**
   * Performs execute damage.
   * @param target The target parameter.
   * @param value The value parameter.
   */
  executeDamage(target: unknown, value: unknown): void;
  /**
   * Performs execute hp damage.
   * @param target The target parameter.
   * @param value The value parameter.
   */
  executeHpDamage(target: unknown, value: unknown): void;
  /**
   * Performs execute mp damage.
   * @param target The target parameter.
   * @param value The value parameter.
   */
  executeMpDamage(target: unknown, value: unknown): void;
  /**
   * Gets friends unit.
   * @returns The result.
   */
  friendsUnit(): unknown;
  /**
   * Performs gain drained hp.
   * @param value The value parameter.
   */
  gainDrainedHp(value: unknown): void;
  /**
   * Performs gain drained mp.
   * @param value The value parameter.
   */
  gainDrainedMp(value: unknown): void;
  /**
   * Determines whether item any valid effects.
   * @param target The target parameter.
   * @returns True if item any valid effects; false otherwise.
   */
  hasItemAnyValidEffects(target: unknown): boolean;
  /**
   * Initializes initialize.
   * @param subject The subject parameter.
   * @param forcing The forcing parameter.
   */
  initialize(subject: unknown, forcing: unknown): void;
  /**
   * Determines whether attack.
   * @returns True if attack; false otherwise.
   */
  isAttack(): boolean;
  /**
   * Determines whether certain hit.
   * @returns True if certain hit; false otherwise.
   */
  isCertainHit(): boolean;
  /**
   * Determines whether damage.
   * @returns True if damage; false otherwise.
   */
  isDamage(): boolean;
  /**
   * Determines whether drain.
   * @returns True if drain; false otherwise.
   */
  isDrain(): boolean;
  /**
   * Determines whether for alive friend.
   * @returns True if for alive friend; false otherwise.
   */
  isForAliveFriend(): boolean;
  /**
   * Determines whether for all.
   * @returns True if for all; false otherwise.
   */
  isForAll(): boolean;
  /**
   * Determines whether for dead friend.
   * @returns True if for dead friend; false otherwise.
   */
  isForDeadFriend(): boolean;
  /**
   * Determines whether for everyone.
   * @returns True if for everyone; false otherwise.
   */
  isForEveryone(): boolean;
  /**
   * Determines whether for friend.
   * @returns True if for friend; false otherwise.
   */
  isForFriend(): boolean;
  /**
   * Determines whether for one.
   * @returns True if for one; false otherwise.
   */
  isForOne(): boolean;
  /**
   * Determines whether for opponent.
   * @returns True if for opponent; false otherwise.
   */
  isForOpponent(): boolean;
  /**
   * Determines whether for random.
   * @returns True if for random; false otherwise.
   */
  isForRandom(): boolean;
  /**
   * Determines whether for user.
   * @returns True if for user; false otherwise.
   */
  isForUser(): boolean;
  /**
   * Determines whether guard.
   * @returns True if guard; false otherwise.
   */
  isGuard(): boolean;
  /**
   * Determines whether hp effect.
   * @returns True if hp effect; false otherwise.
   */
  isHpEffect(): boolean;
  /**
   * Determines whether hp recover.
   * @returns True if hp recover; false otherwise.
   */
  isHpRecover(): boolean;
  /**
   * Determines whether item.
   * @returns True if item; false otherwise.
   */
  isItem(): boolean;
  /**
   * Determines whether magic skill.
   * @returns True if magic skill; false otherwise.
   */
  isMagicSkill(): boolean;
  /**
   * Determines whether magical.
   * @returns True if magical; false otherwise.
   */
  isMagical(): boolean;
  /**
   * Determines whether mp effect.
   * @returns True if mp effect; false otherwise.
   */
  isMpEffect(): boolean;
  /**
   * Determines whether mp recover.
   * @returns True if mp recover; false otherwise.
   */
  isMpRecover(): boolean;
  /**
   * Determines whether physical.
   * @returns True if physical; false otherwise.
   */
  isPhysical(): boolean;
  /**
   * Determines whether recover.
   * @returns True if recover; false otherwise.
   */
  isRecover(): boolean;
  /**
   * Determines whether skill.
   * @returns True if skill; false otherwise.
   */
  isSkill(): boolean;
  /**
   * Determines whether valid.
   * @returns True if valid; false otherwise.
   */
  isValid(): boolean;
  /**
   * Gets item.
   * @returns The result.
   */
  item(): unknown;
  /**
   * Gets item cnt.
   * @param target The target parameter.
   * @returns The result.
   */
  itemCnt(target: unknown): number;
  /**
   * Gets item cri.
   * @param target The target parameter.
   * @returns The result.
   */
  itemCri(target: unknown): number;
  /**
   * Performs item effect add attack state.
   * @param target The target parameter.
   * @param effect The effect parameter.
   */
  itemEffectAddAttackState(target: unknown, effect: unknown): void;
  /**
   * Performs item effect add buff.
   * @param target The target parameter.
   * @param effect The effect parameter.
   */
  itemEffectAddBuff(target: unknown, effect: unknown): void;
  /**
   * Performs item effect add debuff.
   * @param target The target parameter.
   * @param effect The effect parameter.
   */
  itemEffectAddDebuff(target: unknown, effect: unknown): void;
  /**
   * Performs item effect add normal state.
   * @param target The target parameter.
   * @param effect The effect parameter.
   */
  itemEffectAddNormalState(target: unknown, effect: unknown): void;
  /**
   * Performs item effect add state.
   * @param target The target parameter.
   * @param effect The effect parameter.
   */
  itemEffectAddState(target: unknown, effect: unknown): void;
  /**
   * Performs item effect common event.
   */
  itemEffectCommonEvent(): void;
  /**
   * Performs item effect gain tp.
   * @param target The target parameter.
   * @param effect The effect parameter.
   */
  itemEffectGainTp(target: unknown, effect: unknown): void;
  /**
   * Performs item effect grow.
   * @param target The target parameter.
   * @param effect The effect parameter.
   */
  itemEffectGrow(target: unknown, effect: unknown): void;
  /**
   * Performs item effect learn skill.
   * @param target The target parameter.
   * @param effect The effect parameter.
   */
  itemEffectLearnSkill(target: unknown, effect: unknown): void;
  /**
   * Performs item effect recover hp.
   * @param target The target parameter.
   * @param effect The effect parameter.
   */
  itemEffectRecoverHp(target: unknown, effect: unknown): void;
  /**
   * Performs item effect recover mp.
   * @param target The target parameter.
   * @param effect The effect parameter.
   */
  itemEffectRecoverMp(target: unknown, effect: unknown): void;
  /**
   * Performs item effect remove buff.
   * @param target The target parameter.
   * @param effect The effect parameter.
   */
  itemEffectRemoveBuff(target: unknown, effect: unknown): void;
  /**
   * Performs item effect remove debuff.
   * @param target The target parameter.
   * @param effect The effect parameter.
   */
  itemEffectRemoveDebuff(target: unknown, effect: unknown): void;
  /**
   * Performs item effect remove state.
   * @param target The target parameter.
   * @param effect The effect parameter.
   */
  itemEffectRemoveState(target: unknown, effect: unknown): void;
  /**
   * Performs item effect special.
   * @param target The target parameter.
   * @param effect The effect parameter.
   */
  itemEffectSpecial(target: unknown, effect: unknown): void;
  /**
   * Gets item eva.
   * @param target The target parameter.
   * @returns The result.
   */
  itemEva(target: unknown): number;
  /**
   * Gets item hit.
   * @returns The result.
   */
  itemHit(): unknown;
  /**
   * Gets item mrf.
   * @param target The target parameter.
   * @returns The result.
   */
  itemMrf(target: unknown): number;
  /**
   * Gets item target candidates.
   * @returns The result.
   */
  itemTargetCandidates(): unknown[];
  /**
   * Gets luk effect rate.
   * @param target The target parameter.
   * @returns The result.
   */
  lukEffectRate(target: unknown): unknown;
  /**
   * Creates damage value.
   * @param target The target parameter.
   * @param critical The critical parameter.
   * @returns The result.
   */
  makeDamageValue(target: unknown, critical: unknown): unknown;
  /**
   * Creates success.
   * @param target The target parameter.
   */
  makeSuccess(target: unknown): void;
  /**
   * Creates targets.
   * @returns The result.
   */
  makeTargets(): unknown;
  /**
   * Gets needs selection.
   * @returns The result.
   */
  needsSelection(): unknown;
  /**
   * Gets num repeats.
   * @returns The result.
   */
  numRepeats(): unknown;
  /**
   * Gets num targets.
   * @returns The result.
   */
  numTargets(): number;
  /**
   * Gets opponents unit.
   * @returns The result.
   */
  opponentsUnit(): unknown;
  /**
   * Performs prepare.
   */
  prepare(): void;
  /**
   * Gets random targets.
   * @param unit The unit parameter.
   * @returns The result.
   */
  randomTargets(unit: unknown): unknown;
  /**
   * Gets repeat targets.
   * @param targets The targets parameter.
   * @returns The result.
   */
  repeatTargets(targets: unknown): unknown;
  /**
   * Sets attack.
   */
  setAttack(): void;
  /**
   * Sets confusion.
   */
  setConfusion(): void;
  /**
   * Sets enemy action.
   * @param action The action parameter.
   */
  setEnemyAction(action: unknown): void;
  /**
   * Sets guard.
   */
  setGuard(): void;
  /**
   * Sets item.
   * @param itemId The itemId parameter.
   */
  setItem(itemId: unknown): void;
  /**
   * Sets item object.
   * @param object The object parameter.
   */
  setItemObject(object: unknown): void;
  /**
   * Sets skill.
   * @param skillId The skillId parameter.
   */
  setSkill(skillId: unknown): void;
  /**
   * Sets subject.
   * @param subject The subject parameter.
   */
  setSubject(subject: unknown): void;
  /**
   * Sets target.
   * @param targetIndex The targetIndex parameter.
   */
  setTarget(targetIndex: unknown): void;
  /**
   * Gets speed.
   * @returns The result.
   */
  speed(): unknown;
  /**
   * Gets subject.
   * @returns The result.
   */
  subject(): unknown;
  /**
   * Gets targets for alive.
   * @param unit The unit parameter.
   * @returns The result.
   */
  targetsForAlive(unit: unknown): unknown[];
  /**
   * Gets targets for dead.
   * @param unit The unit parameter.
   * @returns The result.
   */
  targetsForDead(unit: unknown): unknown[];
  /**
   * Gets targets for dead and alive.
   * @param unit The unit parameter.
   * @returns The result.
   */
  targetsForDeadAndAlive(unit: unknown): unknown[];
  /**
   * Gets targets for everyone.
   * @returns The result.
   */
  targetsForEveryone(): unknown;
  /**
   * Gets targets for friends.
   * @returns The result.
   */
  targetsForFriends(): unknown[];
  /**
   * Gets targets for opponents.
   * @returns The result.
   */
  targetsForOpponents(): unknown;
  /**
   * Gets test apply.
   * @param target The target parameter.
   * @returns The result.
   */
  testApply(target: unknown): boolean;
  /**
   * Gets test item effect.
   * @param target The target parameter.
   * @param effect The effect parameter.
   * @returns The result.
   */
  testItemEffect(target: unknown, effect: unknown): boolean;
  /**
   * Gets test life and death.
   * @param target The target parameter.
   * @returns The result.
   */
  testLifeAndDeath(target: unknown): boolean;
  /**
   * Updates last subject.
   */
  updateLastSubject(): void;
  /**
   * Updates last target.
   * @param target The target parameter.
   */
  updateLastTarget(target: unknown): void;
  /**
   * Updates last used.
   */
  updateLastUsed(): void;
}
declare namespace Game_Action
{
  /**
   * Engine static constant.
   */
  const EFFECT_ADD_BUFF: 31;
  /**
   * Engine static constant.
   */
  const EFFECT_ADD_DEBUFF: 32;
  /**
   * Engine static constant.
   */
  const EFFECT_ADD_STATE: 21;
  /**
   * Engine static constant.
   */
  const EFFECT_COMMON_EVENT: 44;
  /**
   * Engine static constant.
   */
  const EFFECT_GAIN_TP: 13;
  /**
   * Engine static constant.
   */
  const EFFECT_GROW: 42;
  /**
   * Engine static constant.
   */
  const EFFECT_LEARN_SKILL: 43;
  /**
   * Engine static constant.
   */
  const EFFECT_RECOVER_HP: 11;
  /**
   * Engine static constant.
   */
  const EFFECT_RECOVER_MP: 12;
  /**
   * Engine static constant.
   */
  const EFFECT_REMOVE_BUFF: 33;
  /**
   * Engine static constant.
   */
  const EFFECT_REMOVE_DEBUFF: 34;
  /**
   * Engine static constant.
   */
  const EFFECT_REMOVE_STATE: 22;
  /**
   * Engine static constant.
   */
  const EFFECT_SPECIAL: 41;
  /**
   * Engine static constant.
   */
  const HITTYPE_CERTAIN: 0;
  /**
   * Engine static constant.
   */
  const HITTYPE_MAGICAL: 2;
  /**
   * Engine static constant.
   */
  const HITTYPE_PHYSICAL: 1;
  /**
   * Engine static constant.
   */
  const SPECIAL_EFFECT_ESCAPE: 0;
}
