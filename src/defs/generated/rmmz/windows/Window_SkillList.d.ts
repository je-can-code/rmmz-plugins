/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_SkillList
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_SkillList extends Window_Selectable
{
  /**
   * Inferred engine backing field.
   *
   * Type: `null | Game_Actor`.
   * Initialized in: {@link Window_SkillList#initialize}.
   * Written in: {@link Window_SkillList#initialize}, {@link Window_SkillList#setActor}.
   * Read in: {@link Window_SkillList#drawSkillCost}, {@link Window_SkillList#isEnabled}, {@link Window_SkillList#makeItemList}, {@link Window_SkillList#selectLast}, {@link Window_SkillList#setActor}.
   */
  _actor: null | Game_Actor;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown[]`.
   * Initialized in: {@link Window_SkillList#initialize}.
   * Written in: {@link Window_SkillList#initialize}, {@link Window_SkillList#makeItemList}.
   * Read in: {@link Window_SkillList#isCurrentItemEnabled}, {@link Window_SkillList#itemAt}, {@link Window_SkillList#maxItems}, {@link Window_SkillList#selectLast}.
   *
   * Consumed by:
   * - `.length`: {@link Window_SkillList#maxItems}.
   */
  _data: unknown[];
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Window_SkillList#initialize}.
   * Written in: {@link Window_SkillList#initialize}, {@link Window_SkillList#setStypeId}.
   * Read in: {@link Window_SkillList#includes}, {@link Window_SkillList#setStypeId}.
   */
  _stypeId: number;
  /**
   * Gets col spacing.
   * @returns The result.
   */
  colSpacing(): number;
  /**
   * Gets cost width.
   * @returns The result.
   */
  costWidth(): number;
  /**
   * Performs draw item.
   * @param index The index parameter.
   */
  drawItem(index: number): void;
  /**
   * Performs draw skill cost.
   * @param skill The skill parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param width The width parameter.
   */
  drawSkillCost(skill: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null, x: number, y: number, width: number): void;
  /**
   * Gets includes.
   * @param item The item parameter.
   * @returns The result.
   */
  includes(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: Rectangle): void;
  /**
   * Determines whether current item enabled.
   * @returns True if current item enabled; false otherwise.
   */
  isCurrentItemEnabled(): boolean;
  /**
   * Determines whether enabled.
   * @param item The item parameter.
   * @returns True if enabled; false otherwise.
   */
  isEnabled(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  /**
   * Gets item.
   * @returns The result.
   */
  item(): RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null;
  /**
   * Gets item at.
   * @param index The index parameter.
   * @returns The result.
   */
  itemAt(index: number): null;
  /**
   * Creates item list.
   */
  makeItemList(): void;
  /**
   * Gets max cols.
   * @returns The result.
   */
  maxCols(): number;
  /**
   * Gets max items.
   * @returns The result.
   */
  maxItems(): number;
  /**
   * Performs refresh.
   */
  refresh(): void;
  /**
   * Performs select last.
   */
  selectLast(): void;
  /**
   * Sets actor.
   * @param actor The actor parameter.
   */
  setActor(actor: Game_Actor): void;
  /**
   * Sets stype id.
   * @param stypeId The stypeId parameter.
   */
  setStypeId(stypeId: number): void;
  /**
   * Updates help.
   */
  updateHelp(): void;
}
