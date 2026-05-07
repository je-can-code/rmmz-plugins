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
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _backgroundBitmap: null;
  _elapsedTime: number;
  _exiting: boolean;
  _nextScene: null | sceneClass;
  _previousClass: null;
  _previousScene: null;
  _scene: null;
  _smoothDeltaTime: number;
  _stack: unknown[];
}
declare function SceneManager(): never;
declare namespace SceneManager
{
  function backgroundBitmap(): Bitmap | null;
  function catchException(e: unknown): void;
  function catchLoadError(e: Event): void;
  function catchNormalError(e: Event): void;
  function catchUnknownError(e: Event): void;
  function changeScene(): void;
  function checkBrowser(): void;
  function checkPluginErrors(): void;
  function clearStack(): void;
  function determineRepeatNumber(deltaTime: number): number;
  function exit(): void;
  function goto(sceneClass: new () => Scene_Base): void;
  function initAudio(): void;
  function initGraphics(): void;
  function initInput(): void;
  function initVideo(): void;
  function initialize(): void;
  function isCurrentSceneBusy(): boolean;
  function isGameActive(): boolean;
  function isNextScene(sceneClass: new () => Scene_Base): boolean;
  function isPreviousScene(sceneClass: new () => Scene_Base): boolean;
  function isSceneChanging(): boolean;
  function onBeforeSceneStart(): void;
  function onError(event: ErrorEvent): void;
  function onKeyDown(event: KeyboardEvent): void;
  function onReject(event: PromiseRejectionEvent): void;
  function onSceneCreate(): void;
  function onSceneStart(): void;
  function onSceneTerminate(): void;
  function onUnload(): void;
  function pop(): void;
  function prepareNextScene(): void;
  function push(sceneClass: new () => Scene_Base): void;
  function reloadGame(): void;
  function resume(): void;
  function run(sceneClass: new () => Scene_Base): void;
  function setupEventHandlers(): void;
  function showDevTools(): void;
  function snap(): Bitmap;
  function snapForBackground(): void;
  function stop(): void;
  function terminate(): void;
  function update(deltaTime: number): void;
  function updateEffekseer(): void;
  function updateFrameCount(): void;
  function updateInputData(): void;
  function updateMain(): void;
  function updateScene(): void;
}
