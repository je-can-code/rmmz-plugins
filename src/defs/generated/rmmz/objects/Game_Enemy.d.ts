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
  battlerHue(): unknown;
  /**
   * Gets battler name.
   * @returns The result.
   */
  battlerName(): unknown;
  /**
   * Gets drop item rate.
   * @returns The result.
   */
  dropItemRate(): number;
  /**
   * Gets enemy.
   * @returns The result.
   */
  enemy(): unknown;
  /**
   * Gets enemy id.
   * @returns The result.
   */
  enemyId(): unknown;
  /**
   * Gets exp.
   * @returns The result.
   */
  exp(): unknown;
  /**
   * Gets friends unit.
   * @returns The result.
   */
  friendsUnit(): unknown;
  /**
   * Gets gold.
   * @returns The result.
   */
  gold(): unknown;
  /**
   * Gets index.
   * @returns The result.
   */
  index(): unknown;
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
  initialize(enemyId: unknown, x: unknown, y: unknown): void;
  /**
   * Determines whether action valid.
   * @param action The action parameter.
   * @returns True if action valid; false otherwise.
   */
  isActionValid(action: unknown): boolean;
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
  itemObject(kind: unknown, dataId: unknown): null;
  /**
   * Creates actions.
   */
  makeActions(): void;
  /**
   * Creates drop items.
   * @returns The result.
   */
  makeDropItems(): unknown;
  /**
   * Gets meets condition.
   * @param action The action parameter.
   * @returns The result.
   */
  meetsCondition(action: unknown): boolean;
  /**
   * Gets meets hp condition.
   * @param param1 The param1 parameter.
   * @param param2 The param2 parameter.
   * @returns The result.
   */
  meetsHpCondition(param1: unknown, param2: unknown): boolean;
  /**
   * Gets meets mp condition.
   * @param param1 The param1 parameter.
   * @param param2 The param2 parameter.
   * @returns The result.
   */
  meetsMpCondition(param1: unknown, param2: unknown): boolean;
  /**
   * Gets meets party level condition.
   * @param param The param parameter.
   * @returns The result.
   */
  meetsPartyLevelCondition(param: unknown): boolean;
  /**
   * Gets meets state condition.
   * @param param The param parameter.
   * @returns The result.
   */
  meetsStateCondition(param: unknown): unknown;
  /**
   * Gets meets switch condition.
   * @param param The param parameter.
   * @returns The result.
   */
  meetsSwitchCondition(param: unknown): unknown;
  /**
   * Gets meets turn condition.
   * @param param1 The param1 parameter.
   * @param param2 The param2 parameter.
   * @returns The result.
   */
  meetsTurnCondition(param1: unknown, param2: unknown): boolean;
  /**
   * Gets name.
   * @returns The result.
   */
  name(): string;
  /**
   * Gets opponents unit.
   * @returns The result.
   */
  opponentsUnit(): unknown;
  /**
   * Gets original name.
   * @returns The result.
   */
  originalName(): unknown;
  /**
   * Gets param base.
   * @param paramId The paramId parameter.
   * @returns The result.
   */
  paramBase(paramId: unknown): unknown;
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
  screenX(): unknown;
  /**
   * Gets screen y.
   * @returns The result.
   */
  screenY(): unknown;
  /**
   * Gets select action.
   * @param actionList The actionList parameter.
   * @param ratingZero The ratingZero parameter.
   * @returns The result.
   */
  selectAction(actionList: unknown, ratingZero: unknown): unknown;
  /**
   * Performs select all actions.
   * @param actionList The actionList parameter.
   */
  selectAllActions(actionList: unknown): void;
  /**
   * Sets letter.
   * @param letter The letter parameter.
   */
  setLetter(letter: unknown): void;
  /**
   * Sets plural.
   * @param plural The plural parameter.
   */
  setPlural(plural: unknown): void;
  /**
   * Performs setup.
   * @param enemyId The enemyId parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  setup(enemyId: unknown, x: unknown, y: unknown): void;
  /**
   * Gets trait objects.
   * @returns The result.
   */
  traitObjects(): unknown;
  /**
   * Performs transform.
   * @param enemyId The enemyId parameter.
   */
  transform(enemyId: unknown): void;
}
