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
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _actors: unknown[];
  _armors: object;
  _gold: number;
  _items: object;
  _lastItem: Game_Item;
  _menuActorId: number;
  _steps: number;
  _targetActorId: number;
  _weapons: object;
  addActor(actorId: number): void;
  allBattleMembers(): Game_Actor[];
  allItems(): (RPG_Item | RPG_Weapon | RPG_Armor)[];
  allMembers(): Game_Actor[];
  armors(): RPG_Armor[];
  battleMembers(): Game_Actor[];
  canInput(): boolean;
  canUse(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  charactersForSavefile(): [string, number][];
  consumeItem(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): void;
  discardMembersEquip(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null, amount: number): void;
  equipItems(): (RPG_Item | RPG_Weapon | RPG_Armor)[];
  exists(): boolean;
  facesForSavefile(): [string, number][];
  gainGold(amount: number): void;
  gainItem(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null, amount: number, includeEquip: boolean): void;
  gold(): number;
  hasCancelSurprise(): boolean;
  hasDropItemDouble(): boolean;
  hasEncounterHalf(): boolean;
  hasEncounterNone(): boolean;
  hasGoldDouble(): boolean;
  hasItem(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null, includeEquip: boolean): boolean;
  hasMaxItems(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  hasRaisePreemptive(): boolean;
  hiddenBattleMembers(): Game_Actor[];
  highestLevel(): number;
  increaseSteps(): void;
  initAllItems(): void;
  initialize(): void;
  isAllDead(): boolean;
  isAnyMemberEquipped(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  isEmpty(): boolean;
  isEscaped(): boolean;
  itemContainer(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): null;
  items(): RPG_Item[];
  lastItem(): RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null;
  leader(): Game_Actor | undefined;
  loseGold(amount: number): void;
  loseItem(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null, amount: number, includeEquip: boolean): void;
  makeMenuActorNext(): void;
  makeMenuActorPrevious(): void;
  maxBattleMembers(): number;
  maxGold(): number;
  maxItems(): number;
  members(): Game_Actor[];
  menuActor(): Game_Actor | undefined;
  name(): string;
  numItems(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): number;
  onEscapeFailure(): void;
  onPlayerWalk(): void;
  partyAbility(abilityId: number): boolean;
  performEscape(): void;
  performVictory(): void;
  ratePreemptive(troopAgi: number): number;
  rateSurprise(troopAgi: number): number;
  removeActor(actorId: number): void;
  removeBattleStates(): void;
  removeInvalidMembers(): void;
  requestMotionRefresh(): void;
  reviveBattleMembers(): void;
  setLastItem(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): void;
  setMenuActor(actor: Game_Actor): void;
  setTargetActor(actor: Game_Actor): void;
  setupBattleTest(): void;
  setupBattleTestItems(): void;
  setupBattleTestMembers(): void;
  setupStartingMembers(): void;
  size(): number;
  steps(): number;
  swapOrder(index1: number, index2: number): void;
  targetActor(): Game_Actor | undefined;
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
