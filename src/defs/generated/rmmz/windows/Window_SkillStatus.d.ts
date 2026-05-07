/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_SkillStatus
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_SkillStatus extends Window_StatusBase
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | Game_Actor`.<br/>
   * Initialized in: {@link Window_SkillStatus#initialize}.<br/>
   * Written in: {@link Window_SkillStatus#initialize}, {@link Window_SkillStatus#setActor}.<br/>
   * Read in: {@link Window_SkillStatus#refresh}, {@link Window_SkillStatus#setActor}.<br/>
   */
  _actor: null | Game_Actor;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: Rectangle): void;
  /**
   * Performs refresh.
   */
  refresh(): void;
  /**
   * Sets actor.
   * @param actor The actor parameter.
   */
  setActor(actor: Game_Actor): void;
}
