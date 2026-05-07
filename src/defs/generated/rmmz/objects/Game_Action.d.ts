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
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _forcing: boolean;
  _item: Game_Item;
  _subjectActorId: number;
  _subjectEnemyIndex: number;
  _targetIndex: number;
  apply(target: Game_Battler): void;
  applyCritical(damage: number): void;
  applyGlobal(): void;
  applyGuard(damage: number, target: Game_Battler): void;
  applyItemEffect(target: Game_Battler, effect: object): void;
  applyItemUserEffect(): void;
  applyVariance(damage: number, variance: number): void;
  calcElementRate(target: Game_Battler): number;
  checkDamageType(list: number[]): boolean;
  checkItemScope(list: number[]): boolean;
  clear(): void;
  confusionTarget(): Game_Battler | null;
  decideRandomTarget(): void;
  elementsMaxRate(target: Game_Battler, elements: number[]): number;
  evalDamageFormula(target: Game_Battler): number | unknown | number;
  evaluate(): number;
  evaluateWithTarget(target: Game_Battler): number;
  executeDamage(target: Game_Battler, value: number): void;
  executeHpDamage(target: Game_Battler, value: number): void;
  executeMpDamage(target: Game_Battler, value: number): void;
  friendsUnit(): Game_Unit;
  gainDrainedHp(value: number): void;
  gainDrainedMp(value: number): void;
  hasItemAnyValidEffects(target: Game_Battler): boolean;
  initialize(subject: Game_Battler, forcing: boolean): void;
  isAttack(): boolean;
  isCertainHit(): boolean;
  isDamage(): boolean;
  isDrain(): boolean;
  isForAliveFriend(): boolean;
  isForAll(): boolean;
  isForDeadFriend(): boolean;
  isForEveryone(): boolean;
  isForFriend(): boolean;
  isForOne(): boolean;
  isForOpponent(): boolean;
  isForRandom(): boolean;
  isForUser(): boolean;
  isGuard(): boolean;
  isHpEffect(): boolean;
  isHpRecover(): boolean;
  isItem(): boolean;
  isMagicSkill(): boolean;
  isMagical(): boolean;
  isMpEffect(): boolean;
  isMpRecover(): boolean;
  isPhysical(): boolean;
  isRecover(): boolean;
  isSkill(): boolean;
  isValid(): boolean;
  item(): RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null;
  itemCnt(target: Game_Battler): number;
  itemCri(target: Game_Battler): number;
  itemEffectAddAttackState(target: Game_Battler, effect: object): void;
  itemEffectAddBuff(target: Game_Battler, effect: object): void;
  itemEffectAddDebuff(target: Game_Battler, effect: object): void;
  itemEffectAddNormalState(target: Game_Battler, effect: object): void;
  itemEffectAddState(target: Game_Battler, effect: object): void;
  itemEffectCommonEvent(): void;
  itemEffectGainTp(target: Game_Battler, effect: object): void;
  itemEffectGrow(target: Game_Battler, effect: object): void;
  itemEffectLearnSkill(target: Game_Battler, effect: object): void;
  itemEffectRecoverHp(target: Game_Battler, effect: object): void;
  itemEffectRecoverMp(target: Game_Battler, effect: object): void;
  itemEffectRemoveBuff(target: Game_Battler, effect: object): void;
  itemEffectRemoveDebuff(target: Game_Battler, effect: object): void;
  itemEffectRemoveState(target: Game_Battler, effect: object): void;
  itemEffectSpecial(target: Game_Battler, effect: object): void;
  itemEva(target: Game_Battler): number;
  itemHit(): number;
  itemMrf(target: Game_Battler): number;
  itemTargetCandidates(): Game_Battler[];
  lukEffectRate(target: Game_Battler): number;
  makeDamageValue(target: Game_Battler, critical: boolean): number;
  makeSuccess(target: Game_Battler): void;
  makeTargets(): Game_Battler[];
  needsSelection(): boolean;
  numRepeats(): number;
  numTargets(): number;
  opponentsUnit(): Game_Unit;
  prepare(): void;
  randomTargets(unit: Game_Unit): Game_Battler[];
  repeatTargets(targets: Game_Battler[]): Game_Battler[];
  setAttack(): void;
  setConfusion(): void;
  setEnemyAction(action: Game_Action): void;
  setGuard(): void;
  setItem(itemId: number): void;
  setItemObject(object: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): void;
  setSkill(skillId: number): void;
  setSubject(subject: Game_Battler): void;
  setTarget(targetIndex: number): void;
  speed(): number;
  subject(): Game_Battler;
  targetsForAlive(unit: Game_Unit): Game_Battler[];
  targetsForDead(unit: Game_Unit): Game_Battler[];
  targetsForDeadAndAlive(unit: Game_Unit): Game_Battler[];
  targetsForEveryone(): Game_Battler[];
  targetsForFriends(): Game_Battler[];
  targetsForOpponents(): Game_Battler[];
  testApply(target: Game_Battler): boolean;
  testItemEffect(target: Game_Battler, effect: object): boolean;
  testLifeAndDeath(target: Game_Battler): boolean;
  updateLastSubject(): void;
  updateLastTarget(target: Game_Battler): void;
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
