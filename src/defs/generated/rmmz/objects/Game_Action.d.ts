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
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: {@link Game_Action#initialize}.
   * Written in: {@link Game_Action#initialize}.
   * Read in: {@link Game_Action#isValid}, {@link Game_Action#makeTargets}, {@link Game_Action#prepare}.
   */
  _forcing: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `Game_Item`.
   * Initialized in: none.
   * Written in: {@link Game_Action#clear}.
   * Read in: {@link Game_Action#isItem}, {@link Game_Action#isSkill}, {@link Game_Action#item}, {@link Game_Action#setItem}, {@link Game_Action#setItemObject}, {@link Game_Action#setSkill}.
   */
  _item: Game_Item;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Game_Action#initialize}.
   * Written in: {@link Game_Action#initialize}, {@link Game_Action#setSubject}.
   * Read in: {@link Game_Action#subject}.
   */
  _subjectActorId: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Game_Action#initialize}.
   * Written in: {@link Game_Action#initialize}, {@link Game_Action#setSubject}.
   * Read in: {@link Game_Action#subject}.
   */
  _subjectEnemyIndex: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Action#clear}, {@link Game_Action#decideRandomTarget}, {@link Game_Action#evaluate}, {@link Game_Action#setTarget}.
   * Read in: {@link Game_Action#targetsForAlive}, {@link Game_Action#targetsForDead}, {@link Game_Action#targetsForDeadAndAlive}.
   */
  _targetIndex: number;
  /**
   * Performs apply.
   * @param target The target parameter.
   */
  apply(target: Game_Battler): void;
  /**
   * Performs apply critical.
   * @param damage The damage parameter.
   */
  applyCritical(damage: number): void;
  /**
   * Performs apply global.
   */
  applyGlobal(): void;
  /**
   * Performs apply guard.
   * @param damage The damage parameter.
   * @param target The target parameter.
   */
  applyGuard(damage: number, target: Game_Battler): void;
  /**
   * Performs apply item effect.
   * @param target The target parameter.
   * @param effect The effect parameter.
   */
  applyItemEffect(target: Game_Battler, effect: object): void;
  /**
   * Performs apply item user effect.
   */
  applyItemUserEffect(): void;
  /**
   * Performs apply variance.
   * @param damage The damage parameter.
   * @param variance The variance parameter.
   */
  applyVariance(damage: number, variance: number): void;
  /**
   * Gets calc element rate.
   * @param target The target parameter.
   * @returns The result.
   */
  calcElementRate(target: Game_Battler): number;
  /**
   * Gets check damage type.
   * @param list The list parameter.
   * @returns The result.
   */
  checkDamageType(list: number[]): boolean;
  /**
   * Gets check item scope.
   * @param list The list parameter.
   * @returns The result.
   */
  checkItemScope(list: number[]): boolean;
  /**
   * Performs clear.
   */
  clear(): void;
  /**
   * Gets confusion target.
   * @returns The result.
   */
  confusionTarget(): Game_Battler | null;
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
  elementsMaxRate(target: Game_Battler, elements: number[]): number;
  /**
   * Gets eval damage formula.
   * @param target The target parameter.
   * @returns The result.
   */
  evalDamageFormula(target: Game_Battler): number | unknown | number;
  /**
   * Gets evaluate.
   * @returns The result.
   */
  evaluate(): number;
  /**
   * Gets evaluate with target.
   * @param target The target parameter.
   * @returns The result.
   */
  evaluateWithTarget(target: Game_Battler): number;
  /**
   * Performs execute damage.
   * @param target The target parameter.
   * @param value The value parameter.
   */
  executeDamage(target: Game_Battler, value: number): void;
  /**
   * Performs execute hp damage.
   * @param target The target parameter.
   * @param value The value parameter.
   */
  executeHpDamage(target: Game_Battler, value: number): void;
  /**
   * Performs execute mp damage.
   * @param target The target parameter.
   * @param value The value parameter.
   */
  executeMpDamage(target: Game_Battler, value: number): void;
  /**
   * Gets friends unit.
   * @returns The result.
   */
  friendsUnit(): Game_Unit;
  /**
   * Performs gain drained hp.
   * @param value The value parameter.
   */
  gainDrainedHp(value: number): void;
  /**
   * Performs gain drained mp.
   * @param value The value parameter.
   */
  gainDrainedMp(value: number): void;
  /**
   * Determines whether item any valid effects.
   * @param target The target parameter.
   * @returns True if item any valid effects; false otherwise.
   */
  hasItemAnyValidEffects(target: Game_Battler): boolean;
  /**
   * Initializes initialize.
   * @param subject The subject parameter.
   * @param forcing The forcing parameter.
   */
  initialize(subject: Game_Battler, forcing: boolean): void;
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
  item(): RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null;
  /**
   * Gets item cnt.
   * @param target The target parameter.
   * @returns The result.
   */
  itemCnt(target: Game_Battler): number;
  /**
   * Gets item cri.
   * @param target The target parameter.
   * @returns The result.
   */
  itemCri(target: Game_Battler): number;
  /**
   * Performs item effect add attack state.
   * @param target The target parameter.
   * @param effect The effect parameter.
   */
  itemEffectAddAttackState(target: Game_Battler, effect: object): void;
  /**
   * Performs item effect add buff.
   * @param target The target parameter.
   * @param effect The effect parameter.
   */
  itemEffectAddBuff(target: Game_Battler, effect: object): void;
  /**
   * Performs item effect add debuff.
   * @param target The target parameter.
   * @param effect The effect parameter.
   */
  itemEffectAddDebuff(target: Game_Battler, effect: object): void;
  /**
   * Performs item effect add normal state.
   * @param target The target parameter.
   * @param effect The effect parameter.
   */
  itemEffectAddNormalState(target: Game_Battler, effect: object): void;
  /**
   * Performs item effect add state.
   * @param target The target parameter.
   * @param effect The effect parameter.
   */
  itemEffectAddState(target: Game_Battler, effect: object): void;
  /**
   * Performs item effect common event.
   */
  itemEffectCommonEvent(): void;
  /**
   * Performs item effect gain tp.
   * @param target The target parameter.
   * @param effect The effect parameter.
   */
  itemEffectGainTp(target: Game_Battler, effect: object): void;
  /**
   * Performs item effect grow.
   * @param target The target parameter.
   * @param effect The effect parameter.
   */
  itemEffectGrow(target: Game_Battler, effect: object): void;
  /**
   * Performs item effect learn skill.
   * @param target The target parameter.
   * @param effect The effect parameter.
   */
  itemEffectLearnSkill(target: Game_Battler, effect: object): void;
  /**
   * Performs item effect recover hp.
   * @param target The target parameter.
   * @param effect The effect parameter.
   */
  itemEffectRecoverHp(target: Game_Battler, effect: object): void;
  /**
   * Performs item effect recover mp.
   * @param target The target parameter.
   * @param effect The effect parameter.
   */
  itemEffectRecoverMp(target: Game_Battler, effect: object): void;
  /**
   * Performs item effect remove buff.
   * @param target The target parameter.
   * @param effect The effect parameter.
   */
  itemEffectRemoveBuff(target: Game_Battler, effect: object): void;
  /**
   * Performs item effect remove debuff.
   * @param target The target parameter.
   * @param effect The effect parameter.
   */
  itemEffectRemoveDebuff(target: Game_Battler, effect: object): void;
  /**
   * Performs item effect remove state.
   * @param target The target parameter.
   * @param effect The effect parameter.
   */
  itemEffectRemoveState(target: Game_Battler, effect: object): void;
  /**
   * Performs item effect special.
   * @param target The target parameter.
   * @param effect The effect parameter.
   */
  itemEffectSpecial(target: Game_Battler, effect: object): void;
  /**
   * Gets item eva.
   * @param target The target parameter.
   * @returns The result.
   */
  itemEva(target: Game_Battler): number;
  /**
   * Gets item hit.
   * @returns The result.
   */
  itemHit(): number;
  /**
   * Gets item mrf.
   * @param target The target parameter.
   * @returns The result.
   */
  itemMrf(target: Game_Battler): number;
  /**
   * Gets item target candidates.
   * @returns The result.
   */
  itemTargetCandidates(): Game_Battler[];
  /**
   * Gets luk effect rate.
   * @param target The target parameter.
   * @returns The result.
   */
  lukEffectRate(target: Game_Battler): number;
  /**
   * Creates damage value.
   * @param target The target parameter.
   * @param critical The critical parameter.
   * @returns The result.
   */
  makeDamageValue(target: Game_Battler, critical: boolean): number;
  /**
   * Creates success.
   * @param target The target parameter.
   */
  makeSuccess(target: Game_Battler): void;
  /**
   * Creates targets.
   * @returns The result.
   */
  makeTargets(): Game_Battler[];
  /**
   * Gets needs selection.
   * @returns The result.
   */
  needsSelection(): boolean;
  /**
   * Gets num repeats.
   * @returns The result.
   */
  numRepeats(): number;
  /**
   * Gets num targets.
   * @returns The result.
   */
  numTargets(): number;
  /**
   * Gets opponents unit.
   * @returns The result.
   */
  opponentsUnit(): Game_Unit;
  /**
   * Performs prepare.
   */
  prepare(): void;
  /**
   * Gets random targets.
   * @param unit The unit parameter.
   * @returns The result.
   */
  randomTargets(unit: Game_Unit): Game_Battler[];
  /**
   * Gets repeat targets.
   * @param targets The targets parameter.
   * @returns The result.
   */
  repeatTargets(targets: Game_Battler[]): Game_Battler[];
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
  setEnemyAction(action: Game_Action): void;
  /**
   * Sets guard.
   */
  setGuard(): void;
  /**
   * Sets item.
   * @param itemId The itemId parameter.
   */
  setItem(itemId: number): void;
  /**
   * Sets item object.
   * @param object The object parameter.
   */
  setItemObject(object: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): void;
  /**
   * Sets skill.
   * @param skillId The skillId parameter.
   */
  setSkill(skillId: number): void;
  /**
   * Sets subject.
   * @param subject The subject parameter.
   */
  setSubject(subject: Game_Battler): void;
  /**
   * Sets target.
   * @param targetIndex The targetIndex parameter.
   */
  setTarget(targetIndex: number): void;
  /**
   * Gets speed.
   * @returns The result.
   */
  speed(): number;
  /**
   * Gets subject.
   * @returns The result.
   */
  subject(): Game_Battler;
  /**
   * Gets targets for alive.
   * @param unit The unit parameter.
   * @returns The result.
   */
  targetsForAlive(unit: Game_Unit): Game_Battler[];
  /**
   * Gets targets for dead.
   * @param unit The unit parameter.
   * @returns The result.
   */
  targetsForDead(unit: Game_Unit): Game_Battler[];
  /**
   * Gets targets for dead and alive.
   * @param unit The unit parameter.
   * @returns The result.
   */
  targetsForDeadAndAlive(unit: Game_Unit): Game_Battler[];
  /**
   * Gets targets for everyone.
   * @returns The result.
   */
  targetsForEveryone(): Game_Battler[];
  /**
   * Gets targets for friends.
   * @returns The result.
   */
  targetsForFriends(): Game_Battler[];
  /**
   * Gets targets for opponents.
   * @returns The result.
   */
  targetsForOpponents(): Game_Battler[];
  /**
   * Gets test apply.
   * @param target The target parameter.
   * @returns The result.
   */
  testApply(target: Game_Battler): boolean;
  /**
   * Gets test item effect.
   * @param target The target parameter.
   * @param effect The effect parameter.
   * @returns The result.
   */
  testItemEffect(target: Game_Battler, effect: object): boolean;
  /**
   * Gets test life and death.
   * @param target The target parameter.
   * @returns The result.
   */
  testLifeAndDeath(target: Game_Battler): boolean;
  /**
   * Updates last subject.
   */
  updateLastSubject(): void;
  /**
   * Updates last target.
   * @param target The target parameter.
   */
  updateLastTarget(target: Game_Battler): void;
  /**
   * Updates last used.
   */
  updateLastUsed(): void;
}
declare namespace Game_Action
{
  const EFFECT_ADD_BUFF: 31;
  const EFFECT_ADD_DEBUFF: 32;
  const EFFECT_ADD_STATE: 21;
  const EFFECT_COMMON_EVENT: 44;
  const EFFECT_GAIN_TP: 13;
  const EFFECT_GROW: 42;
  const EFFECT_LEARN_SKILL: 43;
  const EFFECT_RECOVER_HP: 11;
  const EFFECT_RECOVER_MP: 12;
  const EFFECT_REMOVE_BUFF: 33;
  const EFFECT_REMOVE_DEBUFF: 34;
  const EFFECT_REMOVE_STATE: 22;
  const EFFECT_SPECIAL: 41;
  const HITTYPE_CERTAIN: 0;
  const HITTYPE_MAGICAL: 2;
  const HITTYPE_PHYSICAL: 1;
  const SPECIAL_EFFECT_ESCAPE: 0;
}
