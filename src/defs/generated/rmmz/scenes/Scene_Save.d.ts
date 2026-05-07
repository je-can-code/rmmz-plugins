/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Save
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Save extends Scene_File
{
  /**
   * Performs execute save.
   * @param savefileId The savefileId parameter.
   */
  executeSave(savefileId: number): void;
  /**
   * Gets first savefile id.
   * @returns The result.
   */
  firstSavefileId(): number;
  /**
   * Gets help window text.
   * @returns The result.
   */
  helpWindowText(): string;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Gets mode.
   * @returns The result.
   */
  mode(): string;
  /**
   * Performs on save failure.
   */
  onSaveFailure(): void;
  /**
   * Performs on save success.
   */
  onSaveSuccess(): void;
  /**
   * Performs on savefile ok.
   */
  onSavefileOk(): void;
}
