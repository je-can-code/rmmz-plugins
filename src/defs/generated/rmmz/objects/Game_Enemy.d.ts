/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Enemy
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Enemy
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _enemyId: number;
  _letter: string;
  _plural: boolean;
  _screenX: number;
  _screenY: number;
  battlerHue(): number;
  battlerName(): string;
  dropItemRate(): number;
  enemy(): RPG_Enemy;
  enemyId(): number;
  exp(): number;
  friendsUnit(): Game_Troop;
  gold(): number;
  index(): number;
  initMembers(): void;
  initialize(enemyId: number, x: number, y: number): void;
  isActionValid(action: object): boolean;
  isBattleMember(): boolean;
  isEnemy(): boolean;
  isLetterEmpty(): boolean;
  isSpriteVisible(): boolean;
  itemObject(kind: number, dataId: number): RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null;
  makeActions(): void;
  makeDropItems(): Array<RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null>;
  meetsCondition(action: object): boolean;
  meetsHpCondition(param1: number, param2: number): boolean;
  meetsMpCondition(param1: number, param2: number): boolean;
  meetsPartyLevelCondition(param: number): boolean;
  meetsStateCondition(param: number): boolean;
  meetsSwitchCondition(param: number): boolean;
  meetsTurnCondition(param1: number, param2: number): boolean;
  name(): string;
  opponentsUnit(): Game_Party;
  originalName(): string;
  paramBase(paramId: number): number;
  performAction(action: Game_Action): void;
  performActionEnd(): void;
  performActionStart(action: Game_Action): void;
  performCollapse(): void;
  performDamage(): void;
  screenX(): number;
  screenY(): number;
  selectAction(actionList: object[], ratingZero: number): object | null;
  selectAllActions(actionList: object[]): void;
  setLetter(letter: string): void;
  setPlural(plural: boolean): void;
  setup(enemyId: number, x: number, y: number): void;
  traitObjects(): object[];
  transform(enemyId: number): void;
}
