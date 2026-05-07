/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Follower
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Follower
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _memberIndex: number;
  actor(): Game_Actor;
  chaseCharacter(character: Game_Character): void;
  initialize(memberIndex: number): void;
  isGathered(): boolean;
  isVisible(): boolean;
  refresh(): void;
  update(): void;
}
