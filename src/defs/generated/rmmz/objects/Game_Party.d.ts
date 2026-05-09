/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Party
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Party extends Game_Unit
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: {@link Game_Party#initialize}.<br/>
   * Written in: {@link Game_Party#initialize}, {@link Game_Party#setupStartingMembers}.<br/>
   * Read in: {@link Game_Party#addActor}, {@link Game_Party#allMembers}, {@link Game_Party#exists}, {@link Game_Party#removeActor}, {@link Game_Party#removeInvalidMembers}, {@link Game_Party#setupStartingMembers}, {@link Game_Party#swapOrder}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `.length`: {@link Game_Party#exists}.<br/>
   * - `push()`: {@link Game_Party#addActor}, {@link Game_Party#setupStartingMembers}.<br/>
   */
  _actors: unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `object`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Party#initAllItems}.<br/>
   * Read in: {@link Game_Party#armors}, {@link Game_Party#itemContainer}.<br/>
   */
  _armors: object;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Game_Party#initialize}.<br/>
   * Written in: {@link Game_Party#gainGold}, {@link Game_Party#initialize}.<br/>
   * Read in: {@link Game_Party#gainGold}, {@link Game_Party#gold}.<br/>
   */
  _gold: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `object`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Party#initAllItems}.<br/>
   * Read in: {@link Game_Party#itemContainer}, {@link Game_Party#items}.<br/>
   */
  _items: object;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Game_Item`.<br/>
   * Initialized in: {@link Game_Party#initialize}.<br/>
   * Written in: {@link Game_Party#initialize}.<br/>
   * Read in: {@link Game_Party#lastItem}, {@link Game_Party#setLastItem}.<br/>
   */
  _lastItem: Game_Item;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Game_Party#initialize}.<br/>
   * Written in: {@link Game_Party#initialize}, {@link Game_Party#setMenuActor}.<br/>
   * Read in: {@link Game_Party#menuActor}.<br/>
   */
  _menuActorId: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Game_Party#initialize}.<br/>
   * Written in: {@link Game_Party#increaseSteps}, {@link Game_Party#initialize}.<br/>
   * Read in: {@link Game_Party#steps}.<br/>
   */
  _steps: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Game_Party#initialize}.<br/>
   * Written in: {@link Game_Party#initialize}, {@link Game_Party#setTargetActor}.<br/>
   * Read in: {@link Game_Party#targetActor}.<br/>
   */
  _targetActorId: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `object`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Party#initAllItems}.<br/>
   * Read in: {@link Game_Party#itemContainer}, {@link Game_Party#weapons}.<br/>
   */
  _weapons: object;
  /**
   * Adds actor.
   * @param actorId The actorId parameter.
   */
  addActor(actorId: unknown): void;
  /**
   * Gets all battle members.
   * @returns The result.
   */
  allBattleMembers(): unknown;
  /**
   * Gets all items.
   * @returns The result.
   */
  allItems(): unknown;
  /**
   * Gets all members.
   * @returns The result.
   */
  allMembers(): unknown;
  /**
   * Gets armors.
   * @returns The result.
   */
  armors(): RPG_Armor[];
  /**
   * Gets battle members.
   * @returns The result.
   */
  battleMembers(): unknown;
  /**
   * Determines whether input.
   * @returns The result.
   */
  canInput(): unknown;
  /**
   * Determines whether use.
   * @param item The item parameter.
   * @returns The result.
   */
  canUse(item: unknown): unknown;
  /**
   * Gets characters for savefile.
   * @returns The result.
   */
  charactersForSavefile(): unknown;
  /**
   * Performs consume item.
   * @param item The item parameter.
   */
  consumeItem(item: unknown): void;
  /**
   * Performs discard members equip.
   * @param item The item parameter.
   * @param amount The amount parameter.
   */
  discardMembersEquip(item: unknown, amount: unknown): void;
  /**
   * Gets equip items.
   * @returns The result.
   */
  equipItems(): unknown;
  /**
   * Gets exists.
   * @returns The result.
   */
  exists(): boolean;
  /**
   * Gets faces for savefile.
   * @returns The result.
   */
  facesForSavefile(): unknown;
  /**
   * Performs gain gold.
   * @param amount The amount parameter.
   */
  gainGold(amount: unknown): void;
  /**
   * Performs gain item.
   * @param item The item parameter.
   * @param amount The amount parameter.
   * @param includeEquip The includeEquip parameter.
   */
  gainItem(item: unknown, amount: unknown, includeEquip: unknown): void;
  /**
   * Gets gold.
   * @returns The result.
   */
  gold(): unknown;
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
  hasItem(item: unknown, includeEquip: unknown): boolean;
  /**
   * Determines whether max items.
   * @param item The item parameter.
   * @returns True if max items; false otherwise.
   */
  hasMaxItems(item: unknown): boolean;
  /**
   * Determines whether raise preemptive.
   * @returns True if raise preemptive; false otherwise.
   */
  hasRaisePreemptive(): boolean;
  /**
   * Gets hidden battle members.
   * @returns The result.
   */
  hiddenBattleMembers(): unknown;
  /**
   * Gets highest level.
   * @returns The result.
   */
  highestLevel(): unknown;
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
  isAnyMemberEquipped(item: unknown): boolean;
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
  itemContainer(item: unknown): null;
  /**
   * Gets items.
   * @returns The result.
   */
  items(): unknown;
  /**
   * Gets last item.
   * @returns The result.
   */
  lastItem(): unknown;
  /**
   * Gets leader.
   * @returns The result.
   */
  leader(): unknown;
  /**
   * Performs lose gold.
   * @param amount The amount parameter.
   */
  loseGold(amount: unknown): void;
  /**
   * Performs lose item.
   * @param item The item parameter.
   * @param amount The amount parameter.
   * @param includeEquip The includeEquip parameter.
   */
  loseItem(item: unknown, amount: unknown, includeEquip: unknown): void;
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
  members(): unknown;
  /**
   * Gets menu actor.
   * @returns The result.
   */
  menuActor(): unknown;
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
  numItems(item: unknown): number;
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
  partyAbility(abilityId: unknown): unknown;
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
  ratePreemptive(troopAgi: unknown): unknown;
  /**
   * Gets rate surprise.
   * @param troopAgi The troopAgi parameter.
   * @returns The result.
   */
  rateSurprise(troopAgi: unknown): unknown;
  /**
   * Removes actor.
   * @param actorId The actorId parameter.
   */
  removeActor(actorId: unknown): void;
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
  setLastItem(item: unknown): void;
  /**
   * Sets menu actor.
   * @param actor The actor parameter.
   */
  setMenuActor(actor: unknown): void;
  /**
   * Sets target actor.
   * @param actor The actor parameter.
   */
  setTargetActor(actor: unknown): void;
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
  size(): unknown;
  /**
   * Gets steps.
   * @returns The result.
   */
  steps(): unknown;
  /**
   * Performs swap order.
   * @param index1 The index1 parameter.
   * @param index2 The index2 parameter.
   */
  swapOrder(index1: unknown, index2: unknown): void;
  /**
   * Gets target actor.
   * @returns The result.
   */
  targetActor(): unknown;
  /**
   * Gets weapons.
   * @returns The result.
   */
  weapons(): RPG_Weapon[];
}
declare namespace Game_Party
{
  /**
   * Engine static constant.
   */
  const ABILITY_CANCEL_SURPRISE: 2;
  /**
   * Engine static constant.
   */
  const ABILITY_DROP_ITEM_DOUBLE: 5;
  /**
   * Engine static constant.
   */
  const ABILITY_ENCOUNTER_HALF: 0;
  /**
   * Engine static constant.
   */
  const ABILITY_ENCOUNTER_NONE: 1;
  /**
   * Engine static constant.
   */
  const ABILITY_GOLD_DOUBLE: 4;
  /**
   * Engine static constant.
   */
  const ABILITY_RAISE_PREEMPTIVE: 3;
}
