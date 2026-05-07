/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Boot
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Boot
{
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: {@link Scene_Boot#initialize}.
   * Written in: {@link Scene_Boot#initialize}, {@link Scene_Boot#isReady}.
   * Read in: {@link Scene_Boot#isReady}.
   */
  _databaseLoaded: boolean;
  /**
   * Performs adjust box size.
   */
  adjustBoxSize(): void;
  /**
   * Performs adjust window.
   */
  adjustWindow(): void;
  /**
   * Performs check player location.
   */
  checkPlayerLocation(): void;
  /**
   * Performs create.
   */
  create(): void;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Determines whether player data loaded.
   * @returns True if player data loaded; false otherwise.
   */
  isPlayerDataLoaded(): boolean;
  /**
   * Determines whether ready.
   * @returns True if ready; false otherwise.
   */
  isReady(): boolean;
  /**
   * Performs load game fonts.
   */
  loadGameFonts(): void;
  /**
   * Performs load player data.
   */
  loadPlayerData(): void;
  /**
   * Performs load system images.
   */
  loadSystemImages(): void;
  /**
   * Performs on database loaded.
   */
  onDatabaseLoaded(): void;
  /**
   * Performs resize screen.
   */
  resizeScreen(): void;
  /**
   * Gets screen scale.
   * @returns The result.
   */
  screenScale(): number;
  /**
   * Sets encryption info.
   */
  setEncryptionInfo(): void;
  /**
   * Performs start.
   */
  start(): void;
  /**
   * Performs start normal game.
   */
  startNormalGame(): void;
  /**
   * Updates document title.
   */
  updateDocumentTitle(): void;
}
