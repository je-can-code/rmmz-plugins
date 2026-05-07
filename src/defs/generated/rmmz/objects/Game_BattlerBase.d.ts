/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_BattlerBase
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_BattlerBase
{
  /**
   * Inferred engine backing field.
   *
   * Type: `number[]`.
   * Initialized in: none.
   * Written in: {@link Game_BattlerBase#clearBuffs}.
   * Read in: {@link Game_BattlerBase#eraseBuff}, {@link Game_BattlerBase#isBuffExpired}, {@link Game_BattlerBase#overwriteBuffTurns}, {@link Game_BattlerBase#updateBuffTurns}.
   *
   * Consumed by:
   * - `.length`: {@link Game_BattlerBase#updateBuffTurns}.
   */
  _buffTurns: number[];
  /**
   * Inferred engine backing field.
   *
   * Type: `number[]`.
   * Initialized in: none.
   * Written in: {@link Game_BattlerBase#clearBuffs}.
   * Read in: {@link Game_BattlerBase#buff}, {@link Game_BattlerBase#buffIcons}, {@link Game_BattlerBase#buffLength}, {@link Game_BattlerBase#decreaseBuff}, {@link Game_BattlerBase#eraseBuff}, {@link Game_BattlerBase#increaseBuff}, {@link Game_BattlerBase#isBuffAffected}, {@link Game_BattlerBase#isBuffOrDebuffAffected}, {@link Game_BattlerBase#isDebuffAffected}, {@link Game_BattlerBase#isMaxBuffAffected}, {@link Game_BattlerBase#isMaxDebuffAffected}, {@link Game_BattlerBase#paramBuffRate}.
   *
   * Consumed by:
   * - `.length`: {@link Game_BattlerBase#buffIcons}, {@link Game_BattlerBase#buffLength}.
   */
  _buffs: number[];
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link Game_BattlerBase#appear}, {@link Game_BattlerBase#hide}, {@link Game_BattlerBase#initMembers}.
   * Read in: {@link Game_BattlerBase#isHidden}.
   */
  _hidden: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_BattlerBase#die}, {@link Game_BattlerBase#initMembers}, {@link Game_BattlerBase#recoverAll}, {@link Game_BattlerBase#refresh}, {@link Game_BattlerBase#revive}, {@link Game_BattlerBase#setHp}.
   * Read in: {@link Game_BattlerBase#isDying}, {@link Game_BattlerBase#refresh}, {@link Game_BattlerBase#revive}.
   */
  _hp: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_BattlerBase#initMembers}, {@link Game_BattlerBase#paySkillCost}, {@link Game_BattlerBase#recoverAll}, {@link Game_BattlerBase#refresh}, {@link Game_BattlerBase#setMp}.
   * Read in: {@link Game_BattlerBase#canPaySkillCost}, {@link Game_BattlerBase#refresh}.
   */
  _mp: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number[]`.
   * Initialized in: none.
   * Written in: {@link Game_BattlerBase#clearParamPlus}.
   * Read in: {@link Game_BattlerBase#addParam}, {@link Game_BattlerBase#paramPlus}.
   */
  _paramPlus: number[];
  /**
   * Inferred engine backing field.
   *
   * Type: `object`.
   * Initialized in: none.
   * Written in: {@link Game_BattlerBase#clearStates}.
   * Read in: {@link Game_BattlerBase#eraseState}, {@link Game_BattlerBase#isStateExpired}, {@link Game_BattlerBase#resetStateCounts}, {@link Game_BattlerBase#updateStateTurns}.
   */
  _stateTurns: object;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown[]`.
   * Initialized in: none.
   * Written in: {@link Game_BattlerBase#clearStates}.
   * Read in: {@link Game_BattlerBase#addNewState}, {@link Game_BattlerBase#eraseState}, {@link Game_BattlerBase#isStateAffected}, {@link Game_BattlerBase#sortStates}, {@link Game_BattlerBase#states}, {@link Game_BattlerBase#updateStateTurns}.
   *
   * Consumed by:
   * - `push()`: {@link Game_BattlerBase#addNewState}.
   * - `sort()`: {@link Game_BattlerBase#sortStates}.
   */
  _states: unknown[];
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_BattlerBase#initMembers}, {@link Game_BattlerBase#paySkillCost}, {@link Game_BattlerBase#refresh}, {@link Game_BattlerBase#setTp}.
   * Read in: {@link Game_BattlerBase#canPaySkillCost}, {@link Game_BattlerBase#refresh}.
   */
  _tp: number;
  /**
   * Gets action plus set.
   * @returns The result.
   */
  actionPlusSet(): number[];
  /**
   * Adds new state.
   * @param stateId The stateId parameter.
   */
  addNewState(stateId: number): void;
  /**
   * Adds param.
   * @param paramId The paramId parameter.
   * @param value The value parameter.
   */
  addParam(paramId: number, value: number): void;
  /**
   * Gets added skill types.
   * @returns The result.
   */
  addedSkillTypes(): number[];
  /**
   * Gets added skills.
   * @returns The result.
   */
  addedSkills(): number[];
  /**
   * Gets all icons.
   * @returns The result.
   */
  allIcons(): number[];
  /**
   * Gets all traits.
   * @returns The result.
   */
  allTraits(): object[];
  /**
   * Performs appear.
   */
  appear(): void;
  /**
   * Gets attack elements.
   * @returns The result.
   */
  attackElements(): number[];
  /**
   * Gets attack skill id.
   * @returns The result.
   */
  attackSkillId(): number;
  /**
   * Gets attack speed.
   * @returns The result.
   */
  attackSpeed(): number;
  /**
   * Gets attack states.
   * @returns The result.
   */
  attackStates(): number[];
  /**
   * Gets attack states rate.
   * @param stateId The stateId parameter.
   * @returns The result.
   */
  attackStatesRate(stateId: number): number;
  /**
   * Gets attack times add.
   * @returns The result.
   */
  attackTimesAdd(): number;
  /**
   * Gets buff.
   * @param paramId The paramId parameter.
   * @returns The result.
   */
  buff(paramId: number): number;
  /**
   * Gets buff icon index.
   * @param buffLevel The buffLevel parameter.
   * @param paramId The paramId parameter.
   * @returns The result.
   */
  buffIconIndex(buffLevel: number, paramId: number): number;
  /**
   * Gets buff icons.
   * @returns The result.
   */
  buffIcons(): number[];
  /**
   * Gets buff length.
   * @returns The result.
   */
  buffLength(): number;
  /**
   * Determines whether attack.
   * @returns True if attack; false otherwise.
   */
  canAttack(): boolean;
  /**
   * Determines whether equip.
   * @param item The item parameter.
   * @returns True if equip; false otherwise.
   */
  canEquip(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  /**
   * Determines whether equip armor.
   * @param item The item parameter.
   * @returns True if equip armor; false otherwise.
   */
  canEquipArmor(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  /**
   * Determines whether equip weapon.
   * @param item The item parameter.
   * @returns True if equip weapon; false otherwise.
   */
  canEquipWeapon(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  /**
   * Determines whether guard.
   * @returns True if guard; false otherwise.
   */
  canGuard(): boolean;
  /**
   * Determines whether input.
   * @returns True if input; false otherwise.
   */
  canInput(): boolean;
  /**
   * Determines whether move.
   * @returns True if move; false otherwise.
   */
  canMove(): boolean;
  /**
   * Determines whether pay skill cost.
   * @param skill The skill parameter.
   * @returns True if pay skill cost; false otherwise.
   */
  canPaySkillCost(skill: RPG_Skill): boolean;
  /**
   * Determines whether use.
   * @param item The item parameter.
   * @returns True if use; false otherwise.
   */
  canUse(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  /**
   * Clears buffs.
   */
  clearBuffs(): void;
  /**
   * Clears param plus.
   */
  clearParamPlus(): void;
  /**
   * Clears states.
   */
  clearStates(): void;
  /**
   * Gets collapse type.
   * @returns The result.
   */
  collapseType(): number;
  /**
   * Gets confusion level.
   * @returns The result.
   */
  confusionLevel(): number;
  /**
   * Gets death state id.
   * @returns The result.
   */
  deathStateId(): number;
  /**
   * Gets debuff rate.
   * @param paramId The paramId parameter.
   * @returns The result.
   */
  debuffRate(paramId: number): number;
  /**
   * Performs decrease buff.
   * @param paramId The paramId parameter.
   */
  decreaseBuff(paramId: number): void;
  /**
   * Performs die.
   */
  die(): void;
  /**
   * Gets element rate.
   * @param elementId The elementId parameter.
   * @returns The result.
   */
  elementRate(elementId: number): number;
  /**
   * Performs erase buff.
   * @param paramId The paramId parameter.
   */
  eraseBuff(paramId: number): void;
  /**
   * Performs erase state.
   * @param stateId The stateId parameter.
   */
  eraseState(stateId: number): void;
  /**
   * Gets guard skill id.
   * @returns The result.
   */
  guardSkillId(): number;
  /**
   * Performs hide.
   */
  hide(): void;
  /**
   * Gets hp rate.
   * @returns The result.
   */
  hpRate(): number;
  /**
   * Performs increase buff.
   * @param paramId The paramId parameter.
   */
  increaseBuff(paramId: number): void;
  /**
   * Initializes members.
   */
  initMembers(): void;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Determines whether actor.
   * @returns True if actor; false otherwise.
   */
  isActor(): boolean;
  /**
   * Determines whether alive.
   * @returns True if alive; false otherwise.
   */
  isAlive(): boolean;
  /**
   * Determines whether appeared.
   * @returns True if appeared; false otherwise.
   */
  isAppeared(): boolean;
  /**
   * Determines whether auto battle.
   * @returns True if auto battle; false otherwise.
   */
  isAutoBattle(): boolean;
  /**
   * Determines whether buff affected.
   * @param paramId The paramId parameter.
   * @returns True if buff affected; false otherwise.
   */
  isBuffAffected(paramId: number): boolean;
  /**
   * Determines whether buff expired.
   * @param paramId The paramId parameter.
   * @returns True if buff expired; false otherwise.
   */
  isBuffExpired(paramId: number): boolean;
  /**
   * Determines whether buff or debuff affected.
   * @param paramId The paramId parameter.
   * @returns True if buff or debuff affected; false otherwise.
   */
  isBuffOrDebuffAffected(paramId: number): boolean;
  /**
   * Determines whether confused.
   * @returns True if confused; false otherwise.
   */
  isConfused(): boolean;
  /**
   * Determines whether dead.
   * @returns True if dead; false otherwise.
   */
  isDead(): boolean;
  /**
   * Determines whether death state affected.
   * @returns True if death state affected; false otherwise.
   */
  isDeathStateAffected(): boolean;
  /**
   * Determines whether debuff affected.
   * @param paramId The paramId parameter.
   * @returns True if debuff affected; false otherwise.
   */
  isDebuffAffected(paramId: number): boolean;
  /**
   * Determines whether dual wield.
   * @returns True if dual wield; false otherwise.
   */
  isDualWield(): boolean;
  /**
   * Determines whether dying.
   * @returns True if dying; false otherwise.
   */
  isDying(): boolean;
  /**
   * Determines whether enemy.
   * @returns True if enemy; false otherwise.
   */
  isEnemy(): boolean;
  /**
   * Determines whether equip atype ok.
   * @param atypeId The atypeId parameter.
   * @returns True if equip atype ok; false otherwise.
   */
  isEquipAtypeOk(atypeId: number): boolean;
  /**
   * Determines whether equip type locked.
   * @param etypeId The etypeId parameter.
   * @returns True if equip type locked; false otherwise.
   */
  isEquipTypeLocked(etypeId: number): boolean;
  /**
   * Determines whether equip type sealed.
   * @param etypeId The etypeId parameter.
   * @returns True if equip type sealed; false otherwise.
   */
  isEquipTypeSealed(etypeId: number): boolean;
  /**
   * Determines whether equip wtype ok.
   * @param wtypeId The wtypeId parameter.
   * @returns True if equip wtype ok; false otherwise.
   */
  isEquipWtypeOk(wtypeId: number): boolean;
  /**
   * Determines whether guard.
   * @returns True if guard; false otherwise.
   */
  isGuard(): boolean;
  /**
   * Determines whether hidden.
   * @returns True if hidden; false otherwise.
   */
  isHidden(): boolean;
  /**
   * Determines whether max buff affected.
   * @param paramId The paramId parameter.
   * @returns True if max buff affected; false otherwise.
   */
  isMaxBuffAffected(paramId: number): boolean;
  /**
   * Determines whether max debuff affected.
   * @param paramId The paramId parameter.
   * @returns True if max debuff affected; false otherwise.
   */
  isMaxDebuffAffected(paramId: number): boolean;
  /**
   * Determines whether occasion ok.
   * @param item The item parameter.
   * @returns True if occasion ok; false otherwise.
   */
  isOccasionOk(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  /**
   * Determines whether preserve tp.
   * @returns True if preserve tp; false otherwise.
   */
  isPreserveTp(): boolean;
  /**
   * Determines whether restricted.
   * @returns True if restricted; false otherwise.
   */
  isRestricted(): boolean;
  /**
   * Determines whether skill sealed.
   * @param skillId The skillId parameter.
   * @returns True if skill sealed; false otherwise.
   */
  isSkillSealed(skillId: number): boolean;
  /**
   * Determines whether skill type sealed.
   * @param stypeId The stypeId parameter.
   * @returns True if skill type sealed; false otherwise.
   */
  isSkillTypeSealed(stypeId: number): boolean;
  /**
   * Determines whether skill wtype ok.
   * @returns True if skill wtype ok; false otherwise.
   */
  isSkillWtypeOk(): boolean;
  /**
   * Determines whether state affected.
   * @param stateId The stateId parameter.
   * @returns True if state affected; false otherwise.
   */
  isStateAffected(stateId: number): boolean;
  /**
   * Determines whether state expired.
   * @param stateId The stateId parameter.
   * @returns True if state expired; false otherwise.
   */
  isStateExpired(stateId: number): boolean;
  /**
   * Determines whether state resist.
   * @param stateId The stateId parameter.
   * @returns True if state resist; false otherwise.
   */
  isStateResist(stateId: number): boolean;
  /**
   * Determines whether substitute.
   * @returns True if substitute; false otherwise.
   */
  isSubstitute(): boolean;
  /**
   * Gets max tp.
   * @returns The result.
   */
  maxTp(): number;
  /**
   * Gets meets item conditions.
   * @param item The item parameter.
   * @returns The result.
   */
  meetsItemConditions(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  /**
   * Gets meets skill conditions.
   * @param skill The skill parameter.
   * @returns The result.
   */
  meetsSkillConditions(skill: RPG_Skill): boolean;
  /**
   * Gets meets usable item conditions.
   * @param item The item parameter.
   * @returns The result.
   */
  meetsUsableItemConditions(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  /**
   * Gets most important state text.
   * @returns The result.
   */
  mostImportantStateText(): string;
  /**
   * Gets mp rate.
   * @returns The result.
   */
  mpRate(): number;
  /**
   * Performs on restrict.
   */
  onRestrict(): void;
  /**
   * Performs overwrite buff turns.
   * @param paramId The paramId parameter.
   * @param turns The turns parameter.
   */
  overwriteBuffTurns(paramId: number, turns: number): void;
  /**
   * Gets param.
   * @param paramId The paramId parameter.
   * @returns The result.
   */
  param(paramId: number): number;
  /**
   * Gets param base.
   * @returns The result.
   */
  paramBase(): number;
  /**
   * Gets param base plus.
   * @param paramId The paramId parameter.
   * @returns The result.
   */
  paramBasePlus(paramId: number): number;
  /**
   * Gets param buff rate.
   * @param paramId The paramId parameter.
   * @returns The result.
   */
  paramBuffRate(paramId: number): number;
  /**
   * Gets param max.
   * @returns The result.
   */
  paramMax(): number;
  /**
   * Gets param min.
   * @param paramId The paramId parameter.
   * @returns The result.
   */
  paramMin(paramId: number): number;
  /**
   * Gets param plus.
   * @param paramId The paramId parameter.
   * @returns The result.
   */
  paramPlus(paramId: number): number;
  /**
   * Gets param rate.
   * @param paramId The paramId parameter.
   * @returns The result.
   */
  paramRate(paramId: number): number;
  /**
   * Gets party ability.
   * @param abilityId The abilityId parameter.
   * @returns The result.
   */
  partyAbility(abilityId: number): boolean;
  /**
   * Performs pay skill cost.
   * @param skill The skill parameter.
   */
  paySkillCost(skill: RPG_Skill): void;
  /**
   * Performs recover all.
   */
  recoverAll(): void;
  /**
   * Performs refresh.
   */
  refresh(): void;
  /**
   * Clears state counts.
   * @param stateId The stateId parameter.
   */
  resetStateCounts(stateId: number): void;
  /**
   * Gets restriction.
   * @returns The result.
   */
  restriction(): number;
  /**
   * Performs revive.
   */
  revive(): void;
  /**
   * Sets hp.
   * @param hp The hp parameter.
   */
  setHp(hp: number): void;
  /**
   * Sets mp.
   * @param mp The mp parameter.
   */
  setMp(mp: number): void;
  /**
   * Sets tp.
   * @param tp The tp parameter.
   */
  setTp(tp: number): void;
  /**
   * Gets skill mp cost.
   * @param skill The skill parameter.
   * @returns The result.
   */
  skillMpCost(skill: RPG_Skill): number;
  /**
   * Gets skill tp cost.
   * @param skill The skill parameter.
   * @returns The result.
   */
  skillTpCost(skill: RPG_Skill): number;
  /**
   * Gets slot type.
   * @returns The result.
   */
  slotType(): number;
  /**
   * Performs sort states.
   */
  sortStates(): void;
  /**
   * Gets sparam.
   * @param sparamId The sparamId parameter.
   * @returns The result.
   */
  sparam(sparamId: number): number;
  /**
   * Gets special flag.
   * @param flagId The flagId parameter.
   * @returns The result.
   */
  specialFlag(flagId: number): number;
  /**
   * Gets state icons.
   * @returns The result.
   */
  stateIcons(): number[];
  /**
   * Gets state motion index.
   * @returns The result.
   */
  stateMotionIndex(): number;
  /**
   * Gets state overlay index.
   * @returns The result.
   */
  stateOverlayIndex(): number;
  /**
   * Gets state rate.
   * @param stateId The stateId parameter.
   * @returns The result.
   */
  stateRate(stateId: number): number;
  /**
   * Gets state resist set.
   * @returns The result.
   */
  stateResistSet(): number[];
  /**
   * Gets states.
   * @returns The result.
   */
  states(): RPG_State[];
  /**
   * Gets tp rate.
   * @returns The result.
   */
  tpRate(): number;
  /**
   * Gets trait objects.
   * @returns The result.
   */
  traitObjects(): RPG_State[];
  /**
   * Gets traits.
   * @param code The code parameter.
   * @returns The result.
   */
  traits(code: number): object[];
  /**
   * Gets traits pi.
   * @param code The code parameter.
   * @param id The id parameter.
   * @returns The result.
   */
  traitsPi(code: number, id: number): number;
  /**
   * Gets traits set.
   * @param code The code parameter.
   * @returns The result.
   */
  traitsSet(code: number): number[];
  /**
   * Gets traits sum.
   * @param code The code parameter.
   * @param id The id parameter.
   * @returns The result.
   */
  traitsSum(code: number, id: number): number;
  /**
   * Gets traits sum all.
   * @param code The code parameter.
   * @returns The result.
   */
  traitsSumAll(code: number): number;
  /**
   * Gets traits with id.
   * @param code The code parameter.
   * @param id The id parameter.
   * @returns The result.
   */
  traitsWithId(code: number, id: number): object[];
  /**
   * Updates buff turns.
   */
  updateBuffTurns(): void;
  /**
   * Updates state turns.
   */
  updateStateTurns(): void;
  /**
   * Gets xparam.
   * @param xparamId The xparamId parameter.
   * @returns The result.
   */
  xparam(xparamId: number): number;
}
declare namespace Game_BattlerBase
{
  const FLAG_ID_AUTO_BATTLE: 0;
  const FLAG_ID_GUARD: 1;
  const FLAG_ID_PRESERVE_TP: 3;
  const FLAG_ID_SUBSTITUTE: 2;
  const ICON_BUFF_START: 32;
  const ICON_DEBUFF_START: 48;
  const TRAIT_ACTION_PLUS: 61;
  const TRAIT_ATTACK_ELEMENT: 31;
  const TRAIT_ATTACK_SKILL: 35;
  const TRAIT_ATTACK_SPEED: 33;
  const TRAIT_ATTACK_STATE: 32;
  const TRAIT_ATTACK_TIMES: 34;
  const TRAIT_COLLAPSE_TYPE: 63;
  const TRAIT_DEBUFF_RATE: 12;
  const TRAIT_ELEMENT_RATE: 11;
  const TRAIT_EQUIP_ATYPE: 52;
  const TRAIT_EQUIP_LOCK: 53;
  const TRAIT_EQUIP_SEAL: 54;
  const TRAIT_EQUIP_WTYPE: 51;
  const TRAIT_PARAM: 21;
  const TRAIT_PARTY_ABILITY: 64;
  const TRAIT_SKILL_ADD: 43;
  const TRAIT_SKILL_SEAL: 44;
  const TRAIT_SLOT_TYPE: 55;
  const TRAIT_SPARAM: 23;
  const TRAIT_SPECIAL_FLAG: 62;
  const TRAIT_STATE_RATE: 13;
  const TRAIT_STATE_RESIST: 14;
  const TRAIT_STYPE_ADD: 41;
  const TRAIT_STYPE_SEAL: 42;
  const TRAIT_XPARAM: 22;
}
