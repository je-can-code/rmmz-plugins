/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_SkillType
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_SkillType extends Window_Command
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | Game_Actor`.<br/>
   * Initialized in: {@link Window_SkillType#initialize}.<br/>
   * Written in: {@link Window_SkillType#initialize}, {@link Window_SkillType#setActor}.<br/>
   * Read in: {@link Window_SkillType#makeCommandList}, {@link Window_SkillType#selectLast}, {@link Window_SkillType#setActor}.<br/>
   */
  _actor: null | Game_Actor;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Window_Base`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_SkillType#setSkillWindow}.<br/>
   * Read in: {@link Window_SkillType#update}.<br/>
   */
  _skillWindow: Window_Base;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: Rectangle): void;
  /**
   * Creates command list.
   */
  makeCommandList(): void;
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
   * Sets skill window.
   * @param skillWindow The skillWindow parameter.
   */
  setSkillWindow(skillWindow: Window_Base): void;
  /**
   * Performs update.
   */
  update(): void;
}
