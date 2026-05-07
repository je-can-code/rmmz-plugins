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
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Scene_Map#initialize}.
   * Written in: {@link Scene_Map#initialize}, {@link Scene_Map#startEncounterEffect}, {@link Scene_Map#updateEncounterEffect}.
   * Read in: {@link Scene_Map#isBusy}, {@link Scene_Map#updateEncounterEffect}.
   */
  _encounterEffectDuration: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link Scene_Map#create}.
   * Read in: {@link Scene_Map#shouldAutosave}.
   */
  _lastMapWasNull: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: {@link Scene_Map#initialize}.
   * Written in: {@link Scene_Map#initialize}, {@link Scene_Map#isReady}.
   * Read in: {@link Scene_Map#isReady}.
   */
  _mapLoaded: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_MapName`.
   * Initialized in: none.
   * Written in: {@link Scene_Map#createMapNameWindow}.
   * Read in: {@link Scene_Map#callMenu}, {@link Scene_Map#createMapNameWindow}, {@link Scene_Map#launchBattle}, {@link Scene_Map#onTransferEnd}, {@link Scene_Map#stop}, {@link Scene_Map#terminate}, {@link Scene_Map#updateMapNameWindow}.
   */
  _mapNameWindow: Window_MapName;
  /**
   * Inferred engine backing field.
   *
   * Type: `Sprite_Button`.
   * Initialized in: none.
   * Written in: {@link Scene_Map#createMenuButton}.
   * Read in: {@link Scene_Map#createMenuButton}, {@link Scene_Map#hideMenuButton}, {@link Scene_Map#isAnyButtonPressed}, {@link Scene_Map#updateMenuButton}.
   */
  _menuButton: Sprite_Button;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: {@link Scene_Map#initialize}.
   * Written in: {@link Scene_Map#hideMenuButton}, {@link Scene_Map#initialize}, {@link Scene_Map#updateMenuButton}.
   * Read in: {@link Scene_Map#updateMenuButton}.
   */
  _menuEnabled: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `Spriteset_Map`.
   * Initialized in: none.
   * Written in: {@link Scene_Map#createSpriteset}.
   * Read in: {@link Scene_Map#createSpriteset}, {@link Scene_Map#startEncounterEffect}, {@link Scene_Map#terminate}.
   */
  _spriteset: Spriteset_Map;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Scene_Map#initialize}.
   * Written in: {@link Scene_Map#initialize}, {@link Scene_Map#processMapTouch}, {@link Scene_Map#updateDestination}.
   * Read in: {@link Scene_Map#processMapTouch}.
   */
  _touchCount: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown`.
   * Initialized in: none.
   * Written in: {@link Scene_Map#create}.
   * Read in: {@link Scene_Map#create}, {@link Scene_Map#onMapLoaded}, {@link Scene_Map#start}.
   */
  _transfer: unknown;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Scene_Map#initialize}.
   * Written in: {@link Scene_Map#callMenu}, {@link Scene_Map#initialize}, {@link Scene_Map#updateWaitCount}.
   * Read in: {@link Scene_Map#isBusy}, {@link Scene_Map#updateWaitCount}.
   */
  _waitCount: number;
  /**
   * Performs call menu.
   */
  callMenu(): void;
  /**
   * Performs create.
   */
  create(): void;
  /**
   * Creates all windows.
   */
  createAllWindows(): void;
  /**
   * Creates buttons.
   */
  createButtons(): void;
  /**
   * Creates display objects.
   */
  createDisplayObjects(): void;
  /**
   * Creates map name window.
   */
  createMapNameWindow(): void;
  /**
   * Creates menu button.
   */
  createMenuButton(): void;
  /**
   * Creates spriteset.
   */
  createSpriteset(): void;
  /**
   * Gets encounter effect speed.
   * @returns The result.
   */
  encounterEffectSpeed(): number;
  /**
   * Performs fade in for transfer.
   */
  fadeInForTransfer(): void;
  /**
   * Performs fade out for transfer.
   */
  fadeOutForTransfer(): void;
  /**
   * Performs hide menu button.
   */
  hideMenuButton(): void;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Determines whether any button pressed.
   * @returns True if any button pressed; false otherwise.
   */
  isAnyButtonPressed(): boolean;
  /**
   * Determines whether busy.
   * @returns True if busy; false otherwise.
   */
  isBusy(): boolean;
  /**
   * Determines whether debug called.
   * @returns True if debug called; false otherwise.
   */
  isDebugCalled(): boolean;
  /**
   * Determines whether fast forward.
   * @returns True if fast forward; false otherwise.
   */
  isFastForward(): boolean;
  /**
   * Determines whether map touch ok.
   * @returns True if map touch ok; false otherwise.
   */
  isMapTouchOk(): boolean;
  /**
   * Determines whether menu called.
   * @returns True if menu called; false otherwise.
   */
  isMenuCalled(): boolean;
  /**
   * Determines whether menu enabled.
   * @returns True if menu enabled; false otherwise.
   */
  isMenuEnabled(): boolean;
  /**
   * Determines whether player active.
   * @returns True if player active; false otherwise.
   */
  isPlayerActive(): boolean;
  /**
   * Determines whether ready.
   * @returns True if ready; false otherwise.
   */
  isReady(): boolean;
  /**
   * Determines whether scene change ok.
   * @returns True if scene change ok; false otherwise.
   */
  isSceneChangeOk(): boolean;
  /**
   * Performs launch battle.
   */
  launchBattle(): void;
  /**
   * Gets map name window rect.
   * @returns The result.
   */
  mapNameWindowRect(): Rectangle;
  /**
   * Gets needs fade in.
   * @returns The result.
   */
  needsFadeIn(): boolean;
  /**
   * Gets needs slow fade out.
   * @returns The result.
   */
  needsSlowFadeOut(): boolean;
  /**
   * Performs on map loaded.
   */
  onMapLoaded(): void;
  /**
   * Performs on map touch.
   */
  onMapTouch(): void;
  /**
   * Performs on transfer.
   */
  onTransfer(): void;
  /**
   * Performs on transfer end.
   */
  onTransferEnd(): void;
  /**
   * Performs process map touch.
   */
  processMapTouch(): void;
  /**
   * Gets should autosave.
   * @returns The result.
   */
  shouldAutosave(): boolean;
  /**
   * Performs snap for battle background.
   */
  snapForBattleBackground(): void;
  /**
   * Performs start.
   */
  start(): void;
  /**
   * Performs start encounter effect.
   */
  startEncounterEffect(): void;
  /**
   * Performs start flash for encounter.
   * @param duration The duration parameter.
   */
  startFlashForEncounter(duration: number): void;
  /**
   * Performs stop.
   */
  stop(): void;
  /**
   * Performs stop audio on battle start.
   */
  stopAudioOnBattleStart(): void;
  /**
   * Performs terminate.
   */
  terminate(): void;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates call debug.
   */
  updateCallDebug(): void;
  /**
   * Updates call menu.
   */
  updateCallMenu(): void;
  /**
   * Updates destination.
   */
  updateDestination(): void;
  /**
   * Updates encounter.
   */
  updateEncounter(): void;
  /**
   * Updates encounter effect.
   */
  updateEncounterEffect(): void;
  /**
   * Updates main.
   */
  updateMain(): void;
  /**
   * Updates main multiply.
   */
  updateMainMultiply(): void;
  /**
   * Updates map name window.
   */
  updateMapNameWindow(): void;
  /**
   * Updates menu button.
   */
  updateMenuButton(): void;
  /**
   * Updates scene.
   */
  updateScene(): void;
  /**
   * Updates transfer player.
   */
  updateTransferPlayer(): void;
  /**
   * Updates wait count.
   * @returns The result.
   */
  updateWaitCount(): boolean;
}
