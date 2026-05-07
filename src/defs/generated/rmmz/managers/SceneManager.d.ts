/**
 * Generated from project/js/rmmz_managers.js
 * Class: SceneManager
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface SceneManager
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init, {@link SceneManager#snapForBackground}.<br/>
   * Read in: {@link SceneManager#backgroundBitmap}, {@link SceneManager#snapForBackground}.<br/>
   */
  _backgroundBitmap: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init, {@link SceneManager#determineRepeatNumber}.<br/>
   * Read in: {@link SceneManager#determineRepeatNumber}.<br/>
   */
  _elapsedTime: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init, {@link SceneManager#exit}.<br/>
   * Read in: {@link SceneManager#changeScene}, {@link SceneManager#isSceneChanging}.<br/>
   */
  _exiting: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | sceneClass`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init, {@link SceneManager#changeScene}, {@link SceneManager#goto}.<br/>
   * Read in: {@link SceneManager#changeScene}, {@link SceneManager#isNextScene}, {@link SceneManager#isSceneChanging}, {@link SceneManager#prepareNextScene}.<br/>
   */
  _nextScene: null | sceneClass;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init, {@link SceneManager#onSceneTerminate}.<br/>
   * Read in: {@link SceneManager#isPreviousScene}.<br/>
   */
  _previousClass: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init, {@link SceneManager#onBeforeSceneStart}, {@link SceneManager#onSceneTerminate}.<br/>
   * Read in: {@link SceneManager#onBeforeSceneStart}.<br/>
   */
  _previousScene: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init, {@link SceneManager#changeScene}.<br/>
   * Read in: {@link SceneManager#changeScene}, {@link SceneManager#goto}, {@link SceneManager#isCurrentSceneBusy}, {@link SceneManager#onSceneStart}, {@link SceneManager#onSceneTerminate}, {@link SceneManager#push}, {@link SceneManager#snap}, {@link SceneManager#updateScene}.<br/>
   */
  _scene: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init, {@link SceneManager#determineRepeatNumber}.<br/>
   * Read in: {@link SceneManager#determineRepeatNumber}.<br/>
   */
  _smoothDeltaTime: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init, {@link SceneManager#clearStack}.<br/>
   * Read in: {@link SceneManager#pop}, {@link SceneManager#push}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `.length`: {@link SceneManager#pop}.<br/>
   * - `pop()`: {@link SceneManager#pop}.<br/>
   * - `push()`: {@link SceneManager#push}.<br/>
   */
  _stack: unknown[];
}
declare function SceneManager(): never;
declare namespace SceneManager
{
  /**
   * Gets background bitmap.
   * @returns The result.
   */
  function backgroundBitmap(): unknown;
  /**
   * Performs catch exception.
   * @param e The e parameter.
   */
  function catchException(e: unknown): void;
  /**
   * Performs catch load error.
   * @param e The e parameter.
   */
  function catchLoadError(e: unknown): void;
  /**
   * Performs catch normal error.
   * @param e The e parameter.
   */
  function catchNormalError(e: unknown): void;
  /**
   * Performs catch unknown error.
   * @param e The e parameter.
   */
  function catchUnknownError(e: unknown): void;
  /**
   * Performs change scene.
   */
  function changeScene(): void;
  /**
   * Performs check browser.
   */
  function checkBrowser(): void;
  /**
   * Performs check plugin errors.
   */
  function checkPluginErrors(): void;
  /**
   * Clears stack.
   */
  function clearStack(): void;
  /**
   * Gets determine repeat number.
   * @param deltaTime The deltaTime parameter.
   * @returns The result.
   */
  function determineRepeatNumber(deltaTime: unknown): number;
  /**
   * Performs exit.
   */
  function exit(): void;
  /**
   * Performs goto.
   * @param sceneClass The sceneClass parameter.
   */
  function goto(sceneClass: unknown): void;
  /**
   * Initializes audio.
   */
  function initAudio(): void;
  /**
   * Initializes graphics.
   */
  function initGraphics(): void;
  /**
   * Initializes input.
   */
  function initInput(): void;
  /**
   * Initializes video.
   */
  function initVideo(): void;
  /**
   * Initializes initialize.
   */
  function initialize(): void;
  /**
   * Determines whether current scene busy.
   * @returns True if current scene busy; false otherwise.
   */
  function isCurrentSceneBusy(): boolean;
  /**
   * Determines whether game active.
   * @returns True if game active; false otherwise.
   */
  function isGameActive(): boolean;
  /**
   * Determines whether next scene.
   * @param sceneClass The sceneClass parameter.
   * @returns True if next scene; false otherwise.
   */
  function isNextScene(sceneClass: unknown): boolean;
  /**
   * Determines whether previous scene.
   * @param sceneClass The sceneClass parameter.
   * @returns True if previous scene; false otherwise.
   */
  function isPreviousScene(sceneClass: unknown): boolean;
  /**
   * Determines whether scene changing.
   * @returns True if scene changing; false otherwise.
   */
  function isSceneChanging(): boolean;
  /**
   * Performs on before scene start.
   */
  function onBeforeSceneStart(): void;
  /**
   * Performs on error.
   * @param event The event parameter.
   */
  function onError(event: unknown): void;
  /**
   * Performs on key down.
   * @param event The event parameter.
   */
  function onKeyDown(event: unknown): void;
  /**
   * Performs on reject.
   * @param event The event parameter.
   */
  function onReject(event: unknown): void;
  /**
   * Performs on scene create.
   */
  function onSceneCreate(): void;
  /**
   * Performs on scene start.
   */
  function onSceneStart(): void;
  /**
   * Performs on scene terminate.
   */
  function onSceneTerminate(): void;
  /**
   * Performs on unload.
   */
  function onUnload(): void;
  /**
   * Performs pop.
   */
  function pop(): void;
  /**
   * Performs prepare next scene.
   */
  function prepareNextScene(): void;
  /**
   * Performs push.
   * @param sceneClass The sceneClass parameter.
   */
  function push(sceneClass: unknown): void;
  /**
   * Performs reload game.
   */
  function reloadGame(): void;
  /**
   * Performs resume.
   */
  function resume(): void;
  /**
   * Performs run.
   * @param sceneClass The sceneClass parameter.
   */
  function run(sceneClass: unknown): void;
  /**
   * Performs setup event handlers.
   */
  function setupEventHandlers(): void;
  /**
   * Performs show dev tools.
   */
  function showDevTools(): void;
  /**
   * Gets snap.
   * @returns The result.
   */
  function snap(): unknown;
  /**
   * Performs snap for background.
   */
  function snapForBackground(): void;
  /**
   * Performs stop.
   */
  function stop(): void;
  /**
   * Performs terminate.
   */
  function terminate(): void;
  /**
   * Performs update.
   * @param deltaTime The deltaTime parameter.
   */
  function update(deltaTime: unknown): void;
  /**
   * Updates effekseer.
   */
  function updateEffekseer(): void;
  /**
   * Updates frame count.
   */
  function updateFrameCount(): void;
  /**
   * Updates input data.
   */
  function updateInputData(): void;
  /**
   * Updates main.
   */
  function updateMain(): void;
  /**
   * Updates scene.
   */
  function updateScene(): void;
}
