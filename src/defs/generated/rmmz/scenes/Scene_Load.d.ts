/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Load
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Load extends Scene_File
{
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: {@link Scene_Load#initialize}.
   * Written in: {@link Scene_Load#initialize}, {@link Scene_Load#onLoadSuccess}.
   * Read in: {@link Scene_Load#terminate}.
   */
  _loadSuccess: boolean;
  /**
   * Performs execute load.
   * @param savefileId The savefileId parameter.
   */
  executeLoad(savefileId: number): void;
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
   * Performs on load failure.
   */
  onLoadFailure(): void;
  /**
   * Performs on load success.
   */
  onLoadSuccess(): void;
  /**
   * Performs on savefile ok.
   */
  onSavefileOk(): void;
  /**
   * Performs reload map if updated.
   */
  reloadMapIfUpdated(): void;
  /**
   * Performs terminate.
   */
  terminate(): void;
}
