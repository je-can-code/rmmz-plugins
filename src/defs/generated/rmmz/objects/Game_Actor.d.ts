/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Actor
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Actor extends Game_Battler
{
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Actor#clearActions}, {@link Game_Actor#initMembers}, {@link Game_Actor#selectNextCommand}, {@link Game_Actor#selectPreviousCommand}.
   * Read in: {@link Game_Actor#inputtingAction}, {@link Game_Actor#selectNextCommand}, {@link Game_Actor#selectPreviousCommand}.
   */
  _actionInputIndex: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Actor#initMembers}, {@link Game_Actor#setup}.
   * Read in: {@link Game_Actor#actor}, {@link Game_Actor#actorId}.
   */
  _actorId: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `string`.
   * Initialized in: none.
   * Written in: {@link Game_Actor#initImages}, {@link Game_Actor#initMembers}, {@link Game_Actor#setBattlerImage}.
   * Read in: {@link Game_Actor#battlerName}.
   */
  _battlerName: string;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Actor#initImages}, {@link Game_Actor#initMembers}, {@link Game_Actor#setCharacterImage}.
   * Read in: {@link Game_Actor#characterIndex}.
   */
  _characterIndex: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `string`.
   * Initialized in: none.
   * Written in: {@link Game_Actor#initImages}, {@link Game_Actor#initMembers}, {@link Game_Actor#setCharacterImage}.
   * Read in: {@link Game_Actor#characterName}.
   */
  _characterName: string;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Actor#changeClass}, {@link Game_Actor#initMembers}, {@link Game_Actor#setup}.
   * Read in: {@link Game_Actor#changeClass}, {@link Game_Actor#changeExp}, {@link Game_Actor#currentClass}, {@link Game_Actor#currentExp}, {@link Game_Actor#initExp}, {@link Game_Actor#isClass}.
   */
  _classId: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown[]`.
   * Initialized in: none.
   * Written in: {@link Game_Actor#initEquips}, {@link Game_Actor#initMembers}.
   * Read in: {@link Game_Actor#changeEquip}, {@link Game_Actor#discardEquip}, {@link Game_Actor#equips}, {@link Game_Actor#forceChangeEquip}, {@link Game_Actor#initEquips}, {@link Game_Actor#releaseUnequippableItems}.
   */
  _equips: unknown[];
  /**
   * Inferred engine backing field.
   *
   * Type: `object`.
   * Initialized in: none.
   * Written in: {@link Game_Actor#initMembers}.
   * Read in: {@link Game_Actor#changeClass}, {@link Game_Actor#changeExp}, {@link Game_Actor#currentExp}, {@link Game_Actor#initExp}.
   */
  _exp: object;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Actor#initImages}, {@link Game_Actor#initMembers}, {@link Game_Actor#setFaceImage}.
   * Read in: {@link Game_Actor#faceIndex}.
   */
  _faceIndex: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `string`.
   * Initialized in: none.
   * Written in: {@link Game_Actor#initImages}, {@link Game_Actor#initMembers}, {@link Game_Actor#setFaceImage}.
   * Read in: {@link Game_Actor#faceName}.
   */
  _faceName: string;
  /**
   * Inferred engine backing field.
   *
   * Type: `Game_Item`.
   * Initialized in: none.
   * Written in: {@link Game_Actor#initMembers}.
   * Read in: {@link Game_Actor#lastBattleSkill}, {@link Game_Actor#setLastBattleSkill}.
   */
  _lastBattleSkill: Game_Item;
  /**
   * Inferred engine backing field.
   *
   * Type: `string`.
   * Initialized in: none.
   * Written in: {@link Game_Actor#initMembers}, {@link Game_Actor#setLastCommandSymbol}.
   * Read in: {@link Game_Actor#lastCommandSymbol}.
   */
  _lastCommandSymbol: string;
  /**
   * Inferred engine backing field.
   *
   * Type: `Game_Item`.
   * Initialized in: none.
   * Written in: {@link Game_Actor#initMembers}.
   * Read in: {@link Game_Actor#lastMenuSkill}, {@link Game_Actor#setLastMenuSkill}.
   */
  _lastMenuSkill: Game_Item;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Actor#changeClass}, {@link Game_Actor#initMembers}, {@link Game_Actor#levelDown}, {@link Game_Actor#levelUp}, {@link Game_Actor#setup}.
   * Read in: {@link Game_Actor#changeExp}, {@link Game_Actor#currentLevelExp}, {@link Game_Actor#displayLevelUp}, {@link Game_Actor#initSkills}, {@link Game_Actor#isMaxLevel}, {@link Game_Actor#levelUp}, {@link Game_Actor#nextLevelExp}, {@link Game_Actor#paramBase}.
   */
  _level: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `string`.
   * Initialized in: none.
   * Written in: {@link Game_Actor#initMembers}, {@link Game_Actor#setName}, {@link Game_Actor#setup}.
   * Read in: {@link Game_Actor#displayLevelUp}, {@link Game_Actor#name}, {@link Game_Actor#showAddedStates}, {@link Game_Actor#showRemovedStates}.
   */
  _name: string;
  /**
   * Inferred engine backing field.
   *
   * Type: `string`.
   * Initialized in: none.
   * Written in: {@link Game_Actor#initMembers}, {@link Game_Actor#setNickname}, {@link Game_Actor#setup}.
   * Read in: {@link Game_Actor#nickname}.
   */
  _nickname: string;
  /**
   * Inferred engine backing field.
   *
   * Type: `string`.
   * Initialized in: none.
   * Written in: {@link Game_Actor#setProfile}, {@link Game_Actor#setup}.
   * Read in: {@link Game_Actor#profile}.
   */
  _profile: string;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown[]`.
   * Initialized in: none.
   * Written in: {@link Game_Actor#initMembers}, {@link Game_Actor#initSkills}.
   * Read in: {@link Game_Actor#forgetSkill}, {@link Game_Actor#isLearnedSkill}, {@link Game_Actor#learnSkill}, {@link Game_Actor#skills}.
   *
   * Consumed by:
   * - `push()`: {@link Game_Actor#learnSkill}.
   * - `sort()`: {@link Game_Actor#learnSkill}.
   */
  _skills: unknown[];
  /**
   * Inferred engine backing field.
   *
   * Type: `object`.
   * Initialized in: none.
   * Written in: {@link Game_Actor#clearStates}.
   * Read in: {@link Game_Actor#eraseState}, {@link Game_Actor#resetStateCounts}, {@link Game_Actor#updateStateSteps}.
   */
  _stateSteps: object;
  /**
   * Gets actor.
   * @returns The result.
   */
  actor(): RPG_Actor;
  /**
   * Gets actor id.
   * @returns The result.
   */
  actorId(): number;
  /**
   * Gets armors.
   * @returns The result.
   */
  armors(): RPG_Armor[];
  /**
   * Gets attack animation id1.
   * @returns The result.
   */
  attackAnimationId1(): number;
  /**
   * Gets attack animation id2.
   * @returns The result.
   */
  attackAnimationId2(): number;
  /**
   * Gets attack elements.
   * @returns The result.
   */
  attackElements(): number[];
  /**
   * Gets bare hands animation id.
   * @returns The result.
   */
  bareHandsAnimationId(): number;
  /**
   * Gets bare hands element id.
   * @returns The result.
   */
  bareHandsElementId(): number;
  /**
   * Gets basic floor damage.
   * @returns The result.
   */
  basicFloorDamage(): number;
  /**
   * Gets battler name.
   * @returns The result.
   */
  battlerName(): string;
  /**
   * Gets bench members exp rate.
   * @returns The result.
   */
  benchMembersExpRate(): number;
  /**
   * Gets best equip item.
   * @param slotId The slotId parameter.
   * @returns The result.
   */
  bestEquipItem(slotId: number): RPG_Weapon | RPG_Armor | null;
  /**
   * Gets calc equip item performance.
   * @param item The item parameter.
   * @returns The result.
   */
  calcEquipItemPerformance(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): number;
  /**
   * Performs change class.
   * @param classId The classId parameter.
   * @param keepExp The keepExp parameter.
   */
  changeClass(classId: number, keepExp: boolean): void;
  /**
   * Performs change equip.
   * @param slotId The slotId parameter.
   * @param item The item parameter.
   */
  changeEquip(slotId: number, item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): void;
  /**
   * Performs change equip by id.
   * @param etypeId The etypeId parameter.
   * @param itemId The itemId parameter.
   */
  changeEquipById(etypeId: number, itemId: number): void;
  /**
   * Performs change exp.
   * @param exp The exp parameter.
   * @param show The show parameter.
   */
  changeExp(exp: number, show: boolean): void;
  /**
   * Performs change level.
   * @param level The level parameter.
   * @param show The show parameter.
   */
  changeLevel(level: number, show: boolean): void;
  /**
   * Gets character index.
   * @returns The result.
   */
  characterIndex(): number;
  /**
   * Gets character name.
   * @returns The result.
   */
  characterName(): string;
  /**
   * Performs check floor effect.
   */
  checkFloorEffect(): void;
  /**
   * Clears actions.
   */
  clearActions(): void;
  /**
   * Clears equipments.
   */
  clearEquipments(): void;
  /**
   * Clears states.
   */
  clearStates(): void;
  /**
   * Gets current class.
   * @returns The result.
   */
  currentClass(): RPG_Class;
  /**
   * Gets current exp.
   * @returns The result.
   */
  currentExp(): number;
  /**
   * Gets current level exp.
   * @returns The result.
   */
  currentLevelExp(): number;
  /**
   * Performs discard equip.
   * @param item The item parameter.
   */
  discardEquip(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): void;
  /**
   * Performs display level up.
   * @param newSkills The newSkills parameter.
   */
  displayLevelUp(newSkills: RPG_Skill[]): void;
  /**
   * Gets equip slots.
   * @returns The result.
   */
  equipSlots(): number[];
  /**
   * Gets equips.
   * @returns The result.
   */
  equips(): Array<RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null>;
  /**
   * Performs erase state.
   * @param stateId The stateId parameter.
   */
  eraseState(stateId: number): void;
  /**
   * Performs execute floor damage.
   */
  executeFloorDamage(): void;
  /**
   * Gets exp for level.
   * @param level The level parameter.
   * @returns The result.
   */
  expForLevel(level: number): number;
  /**
   * Gets face index.
   * @returns The result.
   */
  faceIndex(): number;
  /**
   * Gets face name.
   * @returns The result.
   */
  faceName(): string;
  /**
   * Gets final exp rate.
   * @returns The result.
   */
  finalExpRate(): number;
  /**
   * Gets find new skills.
   * @param lastSkills The lastSkills parameter.
   * @returns The result.
   */
  findNewSkills(lastSkills: RPG_Skill[]): RPG_Skill[];
  /**
   * Performs force change equip.
   * @param slotId The slotId parameter.
   * @param item The item parameter.
   */
  forceChangeEquip(slotId: number, item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): void;
  /**
   * Performs forget skill.
   * @param skillId The skillId parameter.
   */
  forgetSkill(skillId: number): void;
  /**
   * Gets friends unit.
   * @returns The result.
   */
  friendsUnit(): Game_Unit;
  /**
   * Performs gain exp.
   * @param exp The exp parameter.
   */
  gainExp(exp: number): void;
  /**
   * Determines whether armor.
   * @param armor The armor parameter.
   * @returns True if armor; false otherwise.
   */
  hasArmor(armor: RPG_Armor): boolean;
  /**
   * Determines whether no weapons.
   * @returns True if no weapons; false otherwise.
   */
  hasNoWeapons(): boolean;
  /**
   * Determines whether skill.
   * @param skillId The skillId parameter.
   * @returns True if skill; false otherwise.
   */
  hasSkill(skillId: number): boolean;
  /**
   * Determines whether weapon.
   * @param weapon The weapon parameter.
   * @returns True if weapon; false otherwise.
   */
  hasWeapon(weapon: RPG_Weapon): boolean;
  /**
   * Performs hide.
   */
  hide(): void;
  /**
   * Gets index.
   * @returns The result.
   */
  index(): number;
  /**
   * Initializes equips.
   * @param equips The equips parameter.
   */
  initEquips(equips: number[]): void;
  /**
   * Initializes exp.
   */
  initExp(): void;
  /**
   * Initializes images.
   */
  initImages(): void;
  /**
   * Initializes members.
   */
  initMembers(): void;
  /**
   * Initializes skills.
   */
  initSkills(): void;
  /**
   * Initializes initialize.
   * @param actorId The actorId parameter.
   */
  initialize(actorId: number): void;
  /**
   * Gets inputting action.
   * @returns The result.
   */
  inputtingAction(): RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null;
  /**
   * Determines whether actor.
   * @returns True if actor; false otherwise.
   */
  isActor(): boolean;
  /**
   * Determines whether battle member.
   * @returns True if battle member; false otherwise.
   */
  isBattleMember(): boolean;
  /**
   * Determines whether class.
   * @param gameClass The gameClass parameter.
   * @returns True if class; false otherwise.
   */
  isClass(gameClass: RPG_Class): boolean;
  /**
   * Determines whether equip change ok.
   * @param slotId The slotId parameter.
   * @returns True if equip change ok; false otherwise.
   */
  isEquipChangeOk(slotId: number): boolean;
  /**
   * Determines whether equipped.
   * @param item The item parameter.
   * @returns True if equipped; false otherwise.
   */
  isEquipped(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  /**
   * Determines whether formation change ok.
   * @returns True if formation change ok; false otherwise.
   */
  isFormationChangeOk(): boolean;
  /**
   * Determines whether learned skill.
   * @param skillId The skillId parameter.
   * @returns True if learned skill; false otherwise.
   */
  isLearnedSkill(skillId: number): boolean;
  /**
   * Determines whether max level.
   * @returns True if max level; false otherwise.
   */
  isMaxLevel(): boolean;
  /**
   * Determines whether skill wtype ok.
   * @param skill The skill parameter.
   * @returns True if skill wtype ok; false otherwise.
   */
  isSkillWtypeOk(skill: RPG_Skill): boolean;
  /**
   * Determines whether sprite visible.
   * @returns True if sprite visible; false otherwise.
   */
  isSpriteVisible(): boolean;
  /**
   * Determines whether wtype equipped.
   * @param wtypeId The wtypeId parameter.
   * @returns True if wtype equipped; false otherwise.
   */
  isWtypeEquipped(wtypeId: number): boolean;
  /**
   * Gets last battle skill.
   * @returns The result.
   */
  lastBattleSkill(): RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null;
  /**
   * Gets last command symbol.
   * @returns The result.
   */
  lastCommandSymbol(): string;
  /**
   * Gets last menu skill.
   * @returns The result.
   */
  lastMenuSkill(): RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null;
  /**
   * Gets last skill.
   * @returns The result.
   */
  lastSkill(): RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null;
  /**
   * Performs learn skill.
   * @param skillId The skillId parameter.
   */
  learnSkill(skillId: number): void;
  /**
   * Performs level down.
   */
  levelDown(): void;
  /**
   * Performs level up.
   */
  levelUp(): void;
  /**
   * Creates action list.
   * @returns The result.
   */
  makeActionList(): Game_Action[];
  /**
   * Creates actions.
   */
  makeActions(): void;
  /**
   * Creates auto battle actions.
   */
  makeAutoBattleActions(): void;
  /**
   * Creates confusion actions.
   */
  makeConfusionActions(): void;
  /**
   * Gets max floor damage.
   * @returns The result.
   */
  maxFloorDamage(): number;
  /**
   * Gets max level.
   * @returns The result.
   */
  maxLevel(): number;
  /**
   * Gets meets usable item conditions.
   * @param item The item parameter.
   * @returns The result.
   */
  meetsUsableItemConditions(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  /**
   * Gets name.
   * @returns The result.
   */
  name(): string;
  /**
   * Gets next level exp.
   * @returns The result.
   */
  nextLevelExp(): number;
  /**
   * Gets next required exp.
   * @returns The result.
   */
  nextRequiredExp(): number;
  /**
   * Gets nickname.
   * @returns The result.
   */
  nickname(): string;
  /**
   * Performs on escape failure.
   */
  onEscapeFailure(): void;
  /**
   * Performs on player walk.
   */
  onPlayerWalk(): void;
  /**
   * Gets opponents unit.
   * @returns The result.
   */
  opponentsUnit(): Game_Unit;
  /**
   * Performs optimize equipments.
   */
  optimizeEquipments(): void;
  /**
   * Gets param base.
   * @param paramId The paramId parameter.
   * @returns The result.
   */
  paramBase(paramId: number): number;
  /**
   * Gets param plus.
   * @param paramId The paramId parameter.
   * @returns The result.
   */
  paramPlus(paramId: number): number;
  /**
   * Performs perform action.
   * @param action The action parameter.
   */
  performAction(action: Game_Action): void;
  /**
   * Performs perform action end.
   */
  performActionEnd(): void;
  /**
   * Performs perform action start.
   * @param action The action parameter.
   */
  performActionStart(action: Game_Action): void;
  /**
   * Performs perform attack.
   */
  performAttack(): void;
  /**
   * Performs perform collapse.
   */
  performCollapse(): void;
  /**
   * Performs perform counter.
   */
  performCounter(): void;
  /**
   * Performs perform damage.
   */
  performDamage(): void;
  /**
   * Performs perform escape.
   */
  performEscape(): void;
  /**
   * Performs perform evasion.
   */
  performEvasion(): void;
  /**
   * Performs perform magic evasion.
   */
  performMagicEvasion(): void;
  /**
   * Performs perform map damage.
   */
  performMapDamage(): void;
  /**
   * Performs perform victory.
   */
  performVictory(): void;
  /**
   * Gets profile.
   * @returns The result.
   */
  profile(): string;
  /**
   * Performs refresh.
   */
  refresh(): void;
  /**
   * Performs release unequippable items.
   * @param forcing The forcing parameter.
   */
  releaseUnequippableItems(forcing: boolean): void;
  /**
   * Clears state counts.
   * @param stateId The stateId parameter.
   */
  resetStateCounts(stateId: number): void;
  /**
   * Gets select next command.
   * @returns The result.
   */
  selectNextCommand(): boolean;
  /**
   * Gets select previous command.
   * @returns The result.
   */
  selectPreviousCommand(): boolean;
  /**
   * Sets battler image.
   * @param battlerName The battlerName parameter.
   */
  setBattlerImage(battlerName: string): void;
  /**
   * Sets character image.
   * @param characterName The characterName parameter.
   * @param characterIndex The characterIndex parameter.
   */
  setCharacterImage(characterName: string, characterIndex: number): void;
  /**
   * Sets face image.
   * @param faceName The faceName parameter.
   * @param faceIndex The faceIndex parameter.
   */
  setFaceImage(faceName: string, faceIndex: number): void;
  /**
   * Sets last battle skill.
   * @param skill The skill parameter.
   */
  setLastBattleSkill(skill: RPG_Skill): void;
  /**
   * Sets last command symbol.
   * @param _symbol The symbol parameter.
   */
  setLastCommandSymbol(_symbol: string): void;
  /**
   * Sets last menu skill.
   * @param skill The skill parameter.
   */
  setLastMenuSkill(skill: RPG_Skill): void;
  /**
   * Sets name.
   * @param name The name parameter.
   */
  setName(name: string): void;
  /**
   * Sets nickname.
   * @param nickname The nickname parameter.
   */
  setNickname(nickname: string): void;
  /**
   * Sets profile.
   * @param profile The profile parameter.
   */
  setProfile(profile: string): void;
  /**
   * Performs setup.
   * @param actorId The actorId parameter.
   */
  setup(actorId: number): void;
  /**
   * Gets should display level up.
   * @returns The result.
   */
  shouldDisplayLevelUp(): boolean;
  /**
   * Performs show added states.
   */
  showAddedStates(): void;
  /**
   * Performs show removed states.
   */
  showRemovedStates(): void;
  /**
   * Gets skill types.
   * @returns The result.
   */
  skillTypes(): number[];
  /**
   * Gets skills.
   * @returns The result.
   */
  skills(): RPG_Skill[];
  /**
   * Gets steps for turn.
   * @returns The result.
   */
  stepsForTurn(): number;
  /**
   * Gets test escape.
   * @param item The item parameter.
   * @returns The result.
   */
  testEscape(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  /**
   * Gets trade item with party.
   * @param newItem The newItem parameter.
   * @param oldItem The oldItem parameter.
   * @returns The result.
   */
  tradeItemWithParty(newItem: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null, oldItem: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  /**
   * Gets trait objects.
   * @returns The result.
   */
  traitObjects(): object[];
  /**
   * Performs turn end on map.
   */
  turnEndOnMap(): void;
  /**
   * Updates state steps.
   * @param state The state parameter.
   */
  updateStateSteps(state: RPG_State): void;
  /**
   * Gets usable skills.
   * @returns The result.
   */
  usableSkills(): RPG_Skill[];
  /**
   * Gets weapons.
   * @returns The result.
   */
  weapons(): RPG_Weapon[];
}
