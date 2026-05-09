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
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Actor#clearActions}, {@link Game_Actor#initMembers}, {@link Game_Actor#selectNextCommand}, {@link Game_Actor#selectPreviousCommand}.<br/>
   * Read in: {@link Game_Actor#inputtingAction}, {@link Game_Actor#selectNextCommand}, {@link Game_Actor#selectPreviousCommand}.<br/>
   */
  _actionInputIndex: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Actor#initMembers}, {@link Game_Actor#setup}.<br/>
   * Read in: {@link Game_Actor#actor}, {@link Game_Actor#actorId}.<br/>
   */
  _actorId: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `string`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Actor#initImages}, {@link Game_Actor#initMembers}, {@link Game_Actor#setBattlerImage}.<br/>
   * Read in: {@link Game_Actor#battlerName}.<br/>
   */
  _battlerName: string;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Actor#initImages}, {@link Game_Actor#initMembers}, {@link Game_Actor#setCharacterImage}.<br/>
   * Read in: {@link Game_Actor#characterIndex}.<br/>
   */
  _characterIndex: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `string`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Actor#initImages}, {@link Game_Actor#initMembers}, {@link Game_Actor#setCharacterImage}.<br/>
   * Read in: {@link Game_Actor#characterName}.<br/>
   */
  _characterName: string;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Actor#changeClass}, {@link Game_Actor#initMembers}, {@link Game_Actor#setup}.<br/>
   * Read in: {@link Game_Actor#changeClass}, {@link Game_Actor#changeExp}, {@link Game_Actor#currentClass}, {@link Game_Actor#currentExp}, {@link Game_Actor#initExp}, {@link Game_Actor#isClass}.<br/>
   */
  _classId: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Actor#initEquips}, {@link Game_Actor#initMembers}.<br/>
   * Read in: {@link Game_Actor#changeEquip}, {@link Game_Actor#discardEquip}, {@link Game_Actor#equips}, {@link Game_Actor#forceChangeEquip}, {@link Game_Actor#initEquips}, {@link Game_Actor#releaseUnequippableItems}.<br/>
   */
  _equips: unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `object`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Actor#initMembers}.<br/>
   * Read in: {@link Game_Actor#changeClass}, {@link Game_Actor#changeExp}, {@link Game_Actor#currentExp}, {@link Game_Actor#initExp}.<br/>
   */
  _exp: object;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Actor#initImages}, {@link Game_Actor#initMembers}, {@link Game_Actor#setFaceImage}.<br/>
   * Read in: {@link Game_Actor#faceIndex}.<br/>
   */
  _faceIndex: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `string`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Actor#initImages}, {@link Game_Actor#initMembers}, {@link Game_Actor#setFaceImage}.<br/>
   * Read in: {@link Game_Actor#faceName}.<br/>
   */
  _faceName: string;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Game_Item`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Actor#initMembers}.<br/>
   * Read in: {@link Game_Actor#lastBattleSkill}, {@link Game_Actor#setLastBattleSkill}.<br/>
   */
  _lastBattleSkill: Game_Item;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `string`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Actor#initMembers}, {@link Game_Actor#setLastCommandSymbol}.<br/>
   * Read in: {@link Game_Actor#lastCommandSymbol}.<br/>
   */
  _lastCommandSymbol: string;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Game_Item`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Actor#initMembers}.<br/>
   * Read in: {@link Game_Actor#lastMenuSkill}, {@link Game_Actor#setLastMenuSkill}.<br/>
   */
  _lastMenuSkill: Game_Item;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Actor#changeClass}, {@link Game_Actor#initMembers}, {@link Game_Actor#levelDown}, {@link Game_Actor#levelUp}, {@link Game_Actor#setup}.<br/>
   * Read in: {@link Game_Actor#changeExp}, {@link Game_Actor#currentLevelExp}, {@link Game_Actor#displayLevelUp}, {@link Game_Actor#initSkills}, {@link Game_Actor#isMaxLevel}, {@link Game_Actor#levelUp}, {@link Game_Actor#nextLevelExp}, {@link Game_Actor#paramBase}.<br/>
   */
  _level: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `string`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Actor#initMembers}, {@link Game_Actor#setName}, {@link Game_Actor#setup}.<br/>
   * Read in: {@link Game_Actor#displayLevelUp}, {@link Game_Actor#name}, {@link Game_Actor#showAddedStates}, {@link Game_Actor#showRemovedStates}.<br/>
   */
  _name: string;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `string`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Actor#initMembers}, {@link Game_Actor#setNickname}, {@link Game_Actor#setup}.<br/>
   * Read in: {@link Game_Actor#nickname}.<br/>
   */
  _nickname: string;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Actor#setProfile}, {@link Game_Actor#setup}.<br/>
   * Read in: {@link Game_Actor#profile}.<br/>
   */
  _profile: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Actor#initMembers}, {@link Game_Actor#initSkills}.<br/>
   * Read in: {@link Game_Actor#forgetSkill}, {@link Game_Actor#isLearnedSkill}, {@link Game_Actor#learnSkill}, {@link Game_Actor#skills}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `push()`: {@link Game_Actor#learnSkill}.<br/>
   * - `sort()`: {@link Game_Actor#learnSkill}.<br/>
   */
  _skills: unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `object`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Actor#clearStates}.<br/>
   * Read in: {@link Game_Actor#eraseState}, {@link Game_Actor#resetStateCounts}, {@link Game_Actor#updateStateSteps}.<br/>
   */
  _stateSteps: object;
  /**
   * Gets actor.
   * @returns The result.
   */
  actor(): unknown;
  /**
   * Gets actor id.
   * @returns The result.
   */
  actorId(): unknown;
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
  attackElements(): unknown;
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
  battlerName(): unknown;
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
  bestEquipItem(slotId: unknown): unknown;
  /**
   * Gets calc equip item performance.
   * @param item The item parameter.
   * @returns The result.
   */
  calcEquipItemPerformance(item: unknown): unknown;
  /**
   * Performs change class.
   * @param classId The classId parameter.
   * @param keepExp The keepExp parameter.
   */
  changeClass(classId: unknown, keepExp: unknown): void;
  /**
   * Performs change equip.
   * @param slotId The slotId parameter.
   * @param item The item parameter.
   */
  changeEquip(slotId: unknown, item: unknown): void;
  /**
   * Performs change equip by id.
   * @param etypeId The etypeId parameter.
   * @param itemId The itemId parameter.
   */
  changeEquipById(etypeId: unknown, itemId: unknown): void;
  /**
   * Performs change exp.
   * @param exp The exp parameter.
   * @param show The show parameter.
   */
  changeExp(exp: unknown, show: unknown): void;
  /**
   * Performs change level.
   * @param level The level parameter.
   * @param show The show parameter.
   */
  changeLevel(level: unknown, show: unknown): void;
  /**
   * Gets character index.
   * @returns The result.
   */
  characterIndex(): unknown;
  /**
   * Gets character name.
   * @returns The result.
   */
  characterName(): unknown;
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
  currentClass(): unknown;
  /**
   * Gets current exp.
   * @returns The result.
   */
  currentExp(): unknown;
  /**
   * Gets current level exp.
   * @returns The result.
   */
  currentLevelExp(): unknown;
  /**
   * Performs discard equip.
   * @param item The item parameter.
   */
  discardEquip(item: unknown): void;
  /**
   * Performs display level up.
   * @param newSkills The newSkills parameter.
   */
  displayLevelUp(newSkills: unknown): void;
  /**
   * Gets equip slots.
   * @returns The result.
   */
  equipSlots(): unknown;
  /**
   * Gets equips.
   * @returns The result.
   */
  equips(): (RPG_Weapon | RPG_Armor | null)[];
  /**
   * Performs erase state.
   * @param stateId The stateId parameter.
   */
  eraseState(stateId: unknown): void;
  /**
   * Performs execute floor damage.
   */
  executeFloorDamage(): void;
  /**
   * Gets exp for level.
   * @param level The level parameter.
   * @returns The result.
   */
  expForLevel(level: unknown): unknown;
  /**
   * Gets face index.
   * @returns The result.
   */
  faceIndex(): unknown;
  /**
   * Gets face name.
   * @returns The result.
   */
  faceName(): unknown;
  /**
   * Gets final exp rate.
   * @returns The result.
   */
  finalExpRate(): unknown;
  /**
   * Gets find new skills.
   * @param lastSkills The lastSkills parameter.
   * @returns The result.
   */
  findNewSkills(lastSkills: unknown): unknown;
  /**
   * Performs force change equip.
   * @param slotId The slotId parameter.
   * @param item The item parameter.
   */
  forceChangeEquip(slotId: unknown, item: unknown): void;
  /**
   * Performs forget skill.
   * @param skillId The skillId parameter.
   */
  forgetSkill(skillId: unknown): void;
  /**
   * Gets friends unit.
   * @returns The result.
   */
  friendsUnit(): unknown;
  /**
   * Performs gain exp.
   * @param exp The exp parameter.
   */
  gainExp(exp: unknown): void;
  /**
   * Determines whether armor.
   * @param armor The armor parameter.
   * @returns True if armor; false otherwise.
   */
  hasArmor(armor: unknown): boolean;
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
  hasSkill(skillId: unknown): boolean;
  /**
   * Determines whether weapon.
   * @param weapon The weapon parameter.
   * @returns True if weapon; false otherwise.
   */
  hasWeapon(weapon: unknown): boolean;
  /**
   * Performs hide.
   */
  hide(): void;
  /**
   * Gets index.
   * @returns The result.
   */
  index(): unknown;
  /**
   * Initializes equips.
   * @param equips The equips parameter.
   */
  initEquips(equips: unknown): void;
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
  initialize(actorId: unknown): void;
  /**
   * Gets inputting action.
   * @returns The result.
   */
  inputtingAction(): unknown;
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
  isClass(gameClass: unknown): boolean;
  /**
   * Determines whether equip change ok.
   * @param slotId The slotId parameter.
   * @returns True if equip change ok; false otherwise.
   */
  isEquipChangeOk(slotId: unknown): boolean;
  /**
   * Determines whether equipped.
   * @param item The item parameter.
   * @returns True if equipped; false otherwise.
   */
  isEquipped(item: unknown): boolean;
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
  isLearnedSkill(skillId: unknown): boolean;
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
  isSkillWtypeOk(skill: unknown): boolean;
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
  isWtypeEquipped(wtypeId: unknown): boolean;
  /**
   * Gets last battle skill.
   * @returns The result.
   */
  lastBattleSkill(): unknown;
  /**
   * Gets last command symbol.
   * @returns The result.
   */
  lastCommandSymbol(): unknown;
  /**
   * Gets last menu skill.
   * @returns The result.
   */
  lastMenuSkill(): unknown;
  /**
   * Gets last skill.
   * @returns The result.
   */
  lastSkill(): unknown;
  /**
   * Performs learn skill.
   * @param skillId The skillId parameter.
   */
  learnSkill(skillId: unknown): void;
  /**
   * Gets level.
   * @returns The result.
   */
  get level(): unknown;
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
  makeActionList(): unknown;
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
  maxFloorDamage(): unknown;
  /**
   * Gets max level.
   * @returns The result.
   */
  maxLevel(): unknown;
  /**
   * Gets meets usable item conditions.
   * @param item The item parameter.
   * @returns The result.
   */
  meetsUsableItemConditions(item: unknown): boolean;
  /**
   * Gets name.
   * @returns The result.
   */
  name(): unknown;
  /**
   * Gets next level exp.
   * @returns The result.
   */
  nextLevelExp(): unknown;
  /**
   * Gets next required exp.
   * @returns The result.
   */
  nextRequiredExp(): unknown;
  /**
   * Gets nickname.
   * @returns The result.
   */
  nickname(): unknown;
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
  opponentsUnit(): unknown;
  /**
   * Performs optimize equipments.
   */
  optimizeEquipments(): void;
  /**
   * Gets param base.
   * @param paramId The paramId parameter.
   * @returns The result.
   */
  paramBase(paramId: unknown): unknown;
  /**
   * Gets param plus.
   * @param paramId The paramId parameter.
   * @returns The result.
   */
  paramPlus(paramId: unknown): unknown;
  /**
   * Performs perform action.
   * @param action The action parameter.
   */
  performAction(action: unknown): void;
  /**
   * Performs perform action end.
   */
  performActionEnd(): void;
  /**
   * Performs perform action start.
   * @param action The action parameter.
   */
  performActionStart(action: unknown): void;
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
  profile(): unknown;
  /**
   * Performs refresh.
   */
  refresh(): void;
  /**
   * Performs release unequippable items.
   * @param forcing The forcing parameter.
   */
  releaseUnequippableItems(forcing: unknown): void;
  /**
   * Clears state counts.
   * @param stateId The stateId parameter.
   */
  resetStateCounts(stateId: unknown): void;
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
  setBattlerImage(battlerName: unknown): void;
  /**
   * Sets character image.
   * @param characterName The characterName parameter.
   * @param characterIndex The characterIndex parameter.
   */
  setCharacterImage(characterName: unknown, characterIndex: unknown): void;
  /**
   * Sets face image.
   * @param faceName The faceName parameter.
   * @param faceIndex The faceIndex parameter.
   */
  setFaceImage(faceName: unknown, faceIndex: unknown): void;
  /**
   * Sets last battle skill.
   * @param skill The skill parameter.
   */
  setLastBattleSkill(skill: unknown): void;
  /**
   * Sets last command symbol.
   * @param _symbol The symbol parameter.
   */
  setLastCommandSymbol(_symbol: unknown): void;
  /**
   * Sets last menu skill.
   * @param skill The skill parameter.
   */
  setLastMenuSkill(skill: unknown): void;
  /**
   * Sets name.
   * @param name The name parameter.
   */
  setName(name: unknown): void;
  /**
   * Sets nickname.
   * @param nickname The nickname parameter.
   */
  setNickname(nickname: unknown): void;
  /**
   * Sets profile.
   * @param profile The profile parameter.
   */
  setProfile(profile: unknown): void;
  /**
   * Performs setup.
   * @param actorId The actorId parameter.
   */
  setup(actorId: unknown): void;
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
  skillTypes(): unknown;
  /**
   * Gets skills.
   * @returns The result.
   */
  skills(): unknown;
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
  testEscape(item: unknown): unknown;
  /**
   * Gets trade item with party.
   * @param newItem The newItem parameter.
   * @param oldItem The oldItem parameter.
   * @returns The result.
   */
  tradeItemWithParty(newItem: unknown, oldItem: unknown): boolean;
  /**
   * Gets trait objects.
   * @returns The result.
   */
  traitObjects(): unknown;
  /**
   * Performs turn end on map.
   */
  turnEndOnMap(): void;
  /**
   * Updates state steps.
   * @param state The state parameter.
   */
  updateStateSteps(state: unknown): void;
  /**
   * Gets usable skills.
   * @returns The result.
   */
  usableSkills(): unknown;
  /**
   * Gets weapons.
   * @returns The result.
   */
  weapons(): RPG_Weapon[];
}
