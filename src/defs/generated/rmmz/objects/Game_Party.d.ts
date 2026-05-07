/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Party
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Party
{
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown[]`.
   * Initialized in: {@link Game_Party#initialize}.
   * Written in: {@link Game_Party#initialize}, {@link Game_Party#setupStartingMembers}.
   * Read in: {@link Game_Party#addActor}, {@link Game_Party#allMembers}, {@link Game_Party#exists}, {@link Game_Party#removeActor}, {@link Game_Party#removeInvalidMembers}, {@link Game_Party#setupStartingMembers}, {@link Game_Party#swapOrder}.
   *
   * Consumed by:
   * - `.length`: {@link Game_Party#exists}.
   * - `push()`: {@link Game_Party#addActor}, {@link Game_Party#setupStartingMembers}.
   */
  _actors: unknown[];
  /**
   * Inferred engine backing field.
   *
   * Type: `object`.
   * Initialized in: none.
   * Written in: {@link Game_Party#initAllItems}.
   * Read in: {@link Game_Party#armors}, {@link Game_Party#itemContainer}.
   */
  _armors: object;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Game_Party#initialize}.
   * Written in: {@link Game_Party#gainGold}, {@link Game_Party#initialize}.
   * Read in: {@link Game_Party#gainGold}, {@link Game_Party#gold}.
   */
  _gold: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `object`.
   * Initialized in: none.
   * Written in: {@link Game_Party#initAllItems}.
   * Read in: {@link Game_Party#itemContainer}, {@link Game_Party#items}.
   */
  _items: object;
  /**
   * Inferred engine backing field.
   *
   * Type: `Game_Item`.
   * Initialized in: {@link Game_Party#initialize}.
   * Written in: {@link Game_Party#initialize}.
   * Read in: {@link Game_Party#lastItem}, {@link Game_Party#setLastItem}.
   */
  _lastItem: Game_Item;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Game_Party#initialize}.
   * Written in: {@link Game_Party#initialize}, {@link Game_Party#setMenuActor}.
   * Read in: {@link Game_Party#menuActor}.
   */
  _menuActorId: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Game_Party#initialize}.
   * Written in: {@link Game_Party#increaseSteps}, {@link Game_Party#initialize}.
   * Read in: {@link Game_Party#steps}.
   */
  _steps: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Game_Party#initialize}.
   * Written in: {@link Game_Party#initialize}, {@link Game_Party#setTargetActor}.
   * Read in: {@link Game_Party#targetActor}.
   */
  _targetActorId: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `object`.
   * Initialized in: none.
   * Written in: {@link Game_Party#initAllItems}.
   * Read in: {@link Game_Party#itemContainer}, {@link Game_Party#weapons}.
   */
  _weapons: object;
  /**
   * Adds actor.
   * @param actorId The actorId parameter.
   */
  addActor(actorId: number): void;
  /**
   * Gets all battle members.
   * @returns The result.
   */
  allBattleMembers(): Game_Actor[];
  /**
   * Gets all items.
   * @returns The result.
   */
  allItems(): (RPG_Item | RPG_Weapon | RPG_Armor)[];
  /**
   * Gets all members.
   * @returns The result.
   */
  allMembers(): Game_Actor[];
  /**
   * Gets armors.
   * @returns The result.
   */
  armors(): RPG_Armor[];
  /**
   * Gets battle members.
   * @returns The result.
   */
  battleMembers(): Game_Actor[];
  /**
   * Determines whether input.
   * @returns True if input; false otherwise.
   */
  canInput(): boolean;
  /**
   * Determines whether use.
   * @param item The item parameter.
   * @returns True if use; false otherwise.
   */
  canUse(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  /**
   * Gets characters for savefile.
   * @returns The result.
   */
  charactersForSavefile(): [string, number][];
  /**
   * Performs consume item.
   * @param item The item parameter.
   */
  consumeItem(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): void;
  /**
   * Performs discard members equip.
   * @param item The item parameter.
   * @param amount The amount parameter.
   */
  discardMembersEquip(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null, amount: number): void;
  /**
   * Gets equip items.
   * @returns The result.
   */
  equipItems(): (RPG_Item | RPG_Weapon | RPG_Armor)[];
  /**
   * Gets exists.
   * @returns The result.
   */
  exists(): boolean;
  /**
   * Gets faces for savefile.
   * @returns The result.
   */
  facesForSavefile(): [string, number][];
  /**
   * Performs gain gold.
   * @param amount The amount parameter.
   */
  gainGold(amount: number): void;
  /**
   * Performs gain item.
   * @param item The item parameter.
   * @param amount The amount parameter.
   * @param includeEquip The includeEquip parameter.
   */
  gainItem(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null, amount: number, includeEquip: boolean): void;
  /**
   * Gets gold.
   * @returns The result.
   */
  gold(): number;
  /**
   * Determines whether cancel surprise.
   * @returns True if cancel surprise; false otherwise.
   */
  hasCancelSurprise(): boolean;
  /**
   * Determines whether drop item double.
   * @returns True if drop item double; false otherwise.
   */
  hasDropItemDouble(): boolean;
  /**
   * Determines whether encounter half.
   * @returns True if encounter half; false otherwise.
   */
  hasEncounterHalf(): boolean;
  /**
   * Determines whether encounter none.
   * @returns True if encounter none; false otherwise.
   */
  hasEncounterNone(): boolean;
  /**
   * Determines whether gold double.
   * @returns True if gold double; false otherwise.
   */
  hasGoldDouble(): boolean;
  /**
   * Determines whether item.
   * @param item The item parameter.
   * @param includeEquip The includeEquip parameter.
   * @returns True if item; false otherwise.
   */
  hasItem(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null, includeEquip: boolean): boolean;
  /**
   * Determines whether max items.
   * @param item The item parameter.
   * @returns True if max items; false otherwise.
   */
  hasMaxItems(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  /**
   * Determines whether raise preemptive.
   * @returns True if raise preemptive; false otherwise.
   */
  hasRaisePreemptive(): boolean;
  /**
   * Gets hidden battle members.
   * @returns The result.
   */
  hiddenBattleMembers(): Game_Actor[];
  /**
   * Gets highest level.
   * @returns The result.
   */
  highestLevel(): number;
  /**
   * Performs increase steps.
   */
  increaseSteps(): void;
  /**
   * Initializes all items.
   */
  initAllItems(): void;
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
   * Determines whether any member equipped.
   * @param item The item parameter.
   * @returns True if any member equipped; false otherwise.
   */
  isAnyMemberEquipped(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  /**
   * Determines whether empty.
   * @returns True if empty; false otherwise.
   */
  isEmpty(): boolean;
  /**
   * Determines whether escaped.
   * @returns True if escaped; false otherwise.
   */
  isEscaped(): boolean;
  /**
   * Gets item container.
   * @param item The item parameter.
   * @returns The result.
   */
  itemContainer(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): null;
  /**
   * Gets items.
   * @returns The result.
   */
  items(): RPG_Item[];
  /**
   * Gets last item.
   * @returns The result.
   */
  lastItem(): RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null;
  /**
   * Gets leader.
   * @returns The result.
   */
  leader(): Game_Actor | undefined;
  /**
   * Performs lose gold.
   * @param amount The amount parameter.
   */
  loseGold(amount: number): void;
  /**
   * Performs lose item.
   * @param item The item parameter.
   * @param amount The amount parameter.
   * @param includeEquip The includeEquip parameter.
   */
  loseItem(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null, amount: number, includeEquip: boolean): void;
  /**
   * Creates menu actor next.
   */
  makeMenuActorNext(): void;
  /**
   * Creates menu actor previous.
   */
  makeMenuActorPrevious(): void;
  /**
   * Gets max battle members.
   * @returns The result.
   */
  maxBattleMembers(): number;
  /**
   * Gets max gold.
   * @returns The result.
   */
  maxGold(): number;
  /**
   * Gets max items.
   * @returns The result.
   */
  maxItems(): number;
  /**
   * Gets members.
   * @returns The result.
   */
  members(): Game_Actor[];
  /**
   * Gets menu actor.
   * @returns The result.
   */
  menuActor(): Game_Actor | undefined;
  /**
   * Gets name.
   * @returns The result.
   */
  name(): string;
  /**
   * Gets num items.
   * @param item The item parameter.
   * @returns The result.
   */
  numItems(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): number;
  /**
   * Performs on escape failure.
   */
  onEscapeFailure(): void;
  /**
   * Performs on player walk.
   */
  onPlayerWalk(): void;
  /**
   * Gets party ability.
   * @param abilityId The abilityId parameter.
   * @returns The result.
   */
  partyAbility(abilityId: number): boolean;
  /**
   * Performs perform escape.
   */
  performEscape(): void;
  /**
   * Performs perform victory.
   */
  performVictory(): void;
  /**
   * Gets rate preemptive.
   * @param troopAgi The troopAgi parameter.
   * @returns The result.
   */
  ratePreemptive(troopAgi: number): number;
  /**
   * Gets rate surprise.
   * @param troopAgi The troopAgi parameter.
   * @returns The result.
   */
  rateSurprise(troopAgi: number): number;
  /**
   * Removes actor.
   * @param actorId The actorId parameter.
   */
  removeActor(actorId: number): void;
  /**
   * Removes battle states.
   */
  removeBattleStates(): void;
  /**
   * Removes invalid members.
   */
  removeInvalidMembers(): void;
  /**
   * Performs request motion refresh.
   */
  requestMotionRefresh(): void;
  /**
   * Performs revive battle members.
   */
  reviveBattleMembers(): void;
  /**
   * Sets last item.
   * @param item The item parameter.
   */
  setLastItem(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): void;
  /**
   * Sets menu actor.
   * @param actor The actor parameter.
   */
  setMenuActor(actor: Game_Actor): void;
  /**
   * Sets target actor.
   * @param actor The actor parameter.
   */
  setTargetActor(actor: Game_Actor): void;
  /**
   * Performs setup battle test.
   */
  setupBattleTest(): void;
  /**
   * Performs setup battle test items.
   */
  setupBattleTestItems(): void;
  /**
   * Performs setup battle test members.
   */
  setupBattleTestMembers(): void;
  /**
   * Performs setup starting members.
   */
  setupStartingMembers(): void;
  /**
   * Gets size.
   * @returns The result.
   */
  size(): number;
  /**
   * Gets steps.
   * @returns The result.
   */
  steps(): number;
  /**
   * Performs swap order.
   * @param index1 The index1 parameter.
   * @param index2 The index2 parameter.
   */
  swapOrder(index1: number, index2: number): void;
  /**
   * Gets target actor.
   * @returns The result.
   */
  targetActor(): Game_Actor | undefined;
  /**
   * Gets weapons.
   * @returns The result.
   */
  weapons(): RPG_Weapon[];
}
declare namespace Game_Party
{
  const ABILITY_CANCEL_SURPRISE: 2;
  const ABILITY_DROP_ITEM_DOUBLE: 5;
  const ABILITY_ENCOUNTER_HALF: 0;
  const ABILITY_ENCOUNTER_NONE: 1;
  const ABILITY_GOLD_DOUBLE: 4;
  const ABILITY_RAISE_PREEMPTIVE: 3;
}
