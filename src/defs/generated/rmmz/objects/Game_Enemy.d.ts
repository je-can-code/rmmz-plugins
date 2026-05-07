/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Enemy
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Enemy extends Game_Battler
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Enemy#initMembers}, {@link Game_Enemy#setup}, {@link Game_Enemy#transform}.<br/>
   * Read in: {@link Game_Enemy#enemy}, {@link Game_Enemy#enemyId}.<br/>
   */
  _enemyId: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `string`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Enemy#initMembers}, {@link Game_Enemy#setLetter}, {@link Game_Enemy#transform}.<br/>
   * Read in: {@link Game_Enemy#isLetterEmpty}, {@link Game_Enemy#name}.<br/>
   */
  _letter: string;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Enemy#initMembers}, {@link Game_Enemy#setPlural}, {@link Game_Enemy#transform}.<br/>
   * Read in: {@link Game_Enemy#name}.<br/>
   */
  _plural: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Enemy#initMembers}, {@link Game_Enemy#setup}.<br/>
   * Read in: {@link Game_Enemy#screenX}.<br/>
   */
  _screenX: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Enemy#initMembers}, {@link Game_Enemy#setup}.<br/>
   * Read in: {@link Game_Enemy#screenY}.<br/>
   */
  _screenY: number;
  /**
   * Gets battler hue.
   * @returns The result.
   */
  battlerHue(): number;
  /**
   * Gets battler name.
   * @returns The result.
   */
  battlerName(): string;
  /**
   * Gets drop item rate.
   * @returns The result.
   */
  dropItemRate(): number;
  /**
   * Gets enemy.
   * @returns The result.
   */
  enemy(): RPG_Enemy;
  /**
   * Gets enemy id.
   * @returns The result.
   */
  enemyId(): number;
  /**
   * Gets exp.
   * @returns The result.
   */
  exp(): number;
  /**
   * Gets friends unit.
   * @returns The result.
   */
  friendsUnit(): Game_Troop;
  /**
   * Gets gold.
   * @returns The result.
   */
  gold(): number;
  /**
   * Gets index.
   * @returns The result.
   */
  index(): number;
  /**
   * Initializes members.
   */
  initMembers(): void;
  /**
   * Initializes initialize.
   * @param enemyId The enemyId parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  initialize(enemyId: number, x: number, y: number): void;
  /**
   * Determines whether action valid.
   * @param action The action parameter.
   * @returns True if action valid; false otherwise.
   */
  isActionValid(action: object): boolean;
  /**
   * Determines whether battle member.
   * @returns True if battle member; false otherwise.
   */
  isBattleMember(): boolean;
  /**
   * Determines whether enemy.
   * @returns True if enemy; false otherwise.
   */
  isEnemy(): boolean;
  /**
   * Determines whether letter empty.
   * @returns True if letter empty; false otherwise.
   */
  isLetterEmpty(): boolean;
  /**
   * Determines whether sprite visible.
   * @returns True if sprite visible; false otherwise.
   */
  isSpriteVisible(): boolean;
  /**
   * Gets item object.
   * @param kind The kind parameter.
   * @param dataId The dataId parameter.
   * @returns The result.
   */
  itemObject(kind: number, dataId: number): RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null;
  /**
   * Creates actions.
   */
  makeActions(): void;
  /**
   * Creates drop items.
   * @returns The result.
   */
  makeDropItems(): Array<RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null>;
  /**
   * Gets meets condition.
   * @param action The action parameter.
   * @returns The result.
   */
  meetsCondition(action: object): boolean;
  /**
   * Gets meets hp condition.
   * @param param1 The param1 parameter.
   * @param param2 The param2 parameter.
   * @returns The result.
   */
  meetsHpCondition(param1: number, param2: number): boolean;
  /**
   * Gets meets mp condition.
   * @param param1 The param1 parameter.
   * @param param2 The param2 parameter.
   * @returns The result.
   */
  meetsMpCondition(param1: number, param2: number): boolean;
  /**
   * Gets meets party level condition.
   * @param param The param parameter.
   * @returns The result.
   */
  meetsPartyLevelCondition(param: number): boolean;
  /**
   * Gets meets state condition.
   * @param param The param parameter.
   * @returns The result.
   */
  meetsStateCondition(param: number): boolean;
  /**
   * Gets meets switch condition.
   * @param param The param parameter.
   * @returns The result.
   */
  meetsSwitchCondition(param: number): boolean;
  /**
   * Gets meets turn condition.
   * @param param1 The param1 parameter.
   * @param param2 The param2 parameter.
   * @returns The result.
   */
  meetsTurnCondition(param1: number, param2: number): boolean;
  /**
   * Gets name.
   * @returns The result.
   */
  name(): string;
  /**
   * Gets opponents unit.
   * @returns The result.
   */
  opponentsUnit(): Game_Party;
  /**
   * Gets original name.
   * @returns The result.
   */
  originalName(): string;
  /**
   * Gets param base.
   * @param paramId The paramId parameter.
   * @returns The result.
   */
  paramBase(paramId: number): number;
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
   * Performs perform collapse.
   */
  performCollapse(): void;
  /**
   * Performs perform damage.
   */
  performDamage(): void;
  /**
   * Gets screen x.
   * @returns The result.
   */
  screenX(): number;
  /**
   * Gets screen y.
   * @returns The result.
   */
  screenY(): number;
  /**
   * Gets select action.
   * @param actionList The actionList parameter.
   * @param ratingZero The ratingZero parameter.
   * @returns The result.
   */
  selectAction(actionList: object[], ratingZero: number): object | null;
  /**
   * Performs select all actions.
   * @param actionList The actionList parameter.
   */
  selectAllActions(actionList: object[]): void;
  /**
   * Sets letter.
   * @param letter The letter parameter.
   */
  setLetter(letter: string): void;
  /**
   * Sets plural.
   * @param plural The plural parameter.
   */
  setPlural(plural: boolean): void;
  /**
   * Performs setup.
   * @param enemyId The enemyId parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  setup(enemyId: number, x: number, y: number): void;
  /**
   * Gets trait objects.
   * @returns The result.
   */
  traitObjects(): object[];
  /**
   * Performs transform.
   * @param enemyId The enemyId parameter.
   */
  transform(enemyId: number): void;
}
