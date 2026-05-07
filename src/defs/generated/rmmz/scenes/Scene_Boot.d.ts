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
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _databaseLoaded: boolean;
  adjustBoxSize(): void;
  adjustWindow(): void;
  checkPlayerLocation(): void;
  create(): void;
  initialize(): void;
  isPlayerDataLoaded(): boolean;
  isReady(): boolean;
  loadGameFonts(): void;
  loadPlayerData(): void;
  loadSystemImages(): void;
  onDatabaseLoaded(): void;
  resizeScreen(): void;
  screenScale(): number;
  setEncryptionInfo(): void;
  start(): void;
  startNormalGame(): void;
  updateDocumentTitle(): void;
}
