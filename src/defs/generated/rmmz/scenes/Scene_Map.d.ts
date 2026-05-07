/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Map
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Map
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _encounterEffectDuration: number;
  _lastMapWasNull: boolean;
  _mapLoaded: boolean;
  _mapNameWindow: Window_MapName;
  _menuButton: Sprite_Button;
  _menuEnabled: boolean;
  _spriteset: Spriteset_Map;
  _touchCount: number;
  _transfer: unknown;
  _waitCount: number;
  callMenu(): void;
  create(): void;
  createAllWindows(): void;
  createButtons(): void;
  createDisplayObjects(): void;
  createMapNameWindow(): void;
  createMenuButton(): void;
  createSpriteset(): void;
  encounterEffectSpeed(): number;
  fadeInForTransfer(): void;
  fadeOutForTransfer(): void;
  hideMenuButton(): void;
  initialize(): void;
  isAnyButtonPressed(): boolean;
  isBusy(): boolean;
  isDebugCalled(): boolean;
  isFastForward(): boolean;
  isMapTouchOk(): boolean;
  isMenuCalled(): boolean;
  isMenuEnabled(): boolean;
  isPlayerActive(): boolean;
  isReady(): boolean;
  isSceneChangeOk(): boolean;
  launchBattle(): void;
  mapNameWindowRect(): Rectangle;
  needsFadeIn(): boolean;
  needsSlowFadeOut(): boolean;
  onMapLoaded(): void;
  onMapTouch(): void;
  onTransfer(): void;
  onTransferEnd(): void;
  processMapTouch(): void;
  shouldAutosave(): boolean;
  snapForBattleBackground(): void;
  start(): void;
  startEncounterEffect(): void;
  startFlashForEncounter(duration: number): void;
  stop(): void;
  stopAudioOnBattleStart(): void;
  terminate(): void;
  update(): void;
  updateCallDebug(): void;
  updateCallMenu(): void;
  updateDestination(): void;
  updateEncounter(): void;
  updateEncounterEffect(): void;
  updateMain(): void;
  updateMainMultiply(): void;
  updateMapNameWindow(): void;
  updateMenuButton(): void;
  updateScene(): void;
  updateTransferPlayer(): void;
  updateWaitCount(): boolean;
}
