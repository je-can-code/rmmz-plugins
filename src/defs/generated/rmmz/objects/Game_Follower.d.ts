/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Follower
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Follower extends Game_Character
{
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Game_Follower#initialize}.
   * Written in: {@link Game_Follower#initialize}.
   * Read in: {@link Game_Follower#actor}.
   */
  _memberIndex: number;
  /**
   * Gets actor.
   * @returns The result.
   */
  actor(): Game_Actor;
  /**
   * Performs chase character.
   * @param character The character parameter.
   */
  chaseCharacter(character: Game_Character): void;
  /**
   * Initializes initialize.
   * @param memberIndex The memberIndex parameter.
   */
  initialize(memberIndex: number): void;
  /**
   * Determines whether gathered.
   * @returns True if gathered; false otherwise.
   */
  isGathered(): boolean;
  /**
   * Determines whether visible.
   * @returns True if visible; false otherwise.
   */
  isVisible(): boolean;
  /**
   * Performs refresh.
   */
  refresh(): void;
  /**
   * Performs update.
   */
  update(): void;
}
