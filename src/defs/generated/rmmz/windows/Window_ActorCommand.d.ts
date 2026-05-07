/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_ActorCommand
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_ActorCommand extends Window_Command
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | Game_Actor`.<br/>
   * Initialized in: {@link Window_ActorCommand#initialize}.<br/>
   * Written in: {@link Window_ActorCommand#initialize}, {@link Window_ActorCommand#setup}.<br/>
   * Read in: {@link Window_ActorCommand#actor}, {@link Window_ActorCommand#addAttackCommand}, {@link Window_ActorCommand#addGuardCommand}, {@link Window_ActorCommand#addSkillCommands}, {@link Window_ActorCommand#makeCommandList}, {@link Window_ActorCommand#processOk}, {@link Window_ActorCommand#selectLast}.<br/>
   */
  _actor: null | Game_Actor;
  /**
   * Gets actor.
   * @returns The result.
   */
  actor(): Game_Actor | undefined;
  /**
   * Adds attack command.
   */
  addAttackCommand(): void;
  /**
   * Adds guard command.
   */
  addGuardCommand(): void;
  /**
   * Adds item command.
   */
  addItemCommand(): void;
  /**
   * Adds skill commands.
   */
  addSkillCommands(): void;
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
   * Performs process ok.
   */
  processOk(): void;
  /**
   * Performs select last.
   */
  selectLast(): void;
  /**
   * Performs setup.
   * @param actor The actor parameter.
   */
  setup(actor: Game_Actor): void;
}
