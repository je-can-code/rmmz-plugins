/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_SkillStatus
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_SkillStatus
{
  /**
   * Inferred engine backing field.
   *
   * Type: `null | Game_Actor`.
   * Initialized in: {@link Window_SkillStatus#initialize}.
   * Written in: {@link Window_SkillStatus#initialize}, {@link Window_SkillStatus#setActor}.
   * Read in: {@link Window_SkillStatus#refresh}, {@link Window_SkillStatus#setActor}.
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
