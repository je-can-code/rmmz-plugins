/**
 * Generated from project/js/rmmz_core.js
 * Class: Graphics
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Graphics
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _app: null | PIXI.Application;
  _canvas: null;
  _defaultScale: number;
  _effekseer: null;
  _errorPrinter: null;
  _fpsCounter: null | Graphics.FPSCounter;
  _height: number;
  _loadingSpinner: null;
  _realScale: number;
  _stretchEnabled: boolean;
  _tickHandler: null | () => void;
  _wasLoading: boolean;
  _width: number;
}
declare function Graphics(): never;
declare namespace Graphics
{
  function _applyCanvasFilter(): void;
  function _canRender(): boolean;
  function _cancelFullScreen(): void;
  function _centerElement(element: HTMLElement): void;
  function _clearCanvasFilter(): void;
  /**
   * The default zoom scale of the game screen.
   */
  function _createAllElements(): void;
  function _createCanvas(): void;
  function _createEffekseerContext(): void;
  function _createErrorPrinter(): void;
  function _createFPSCounter(): void;
  function _createLoadingSpinner(): void;
  function _createPixiApp(): void;
  function _defaultStretchMode(): boolean;
  function _disableContextMenu(): void;
  function _isFullScreen(): boolean;
  function _makeErrorHtml(name: string, message: string): string;
  function _onKeyDown(event: KeyboardEvent): void;
  /**
   * The default zoom scale of the game screen.
   */
  function _onTick(deltaTime: number): void;
  function _onWindowResize(): void;
  function _requestFullScreen(): void;
  function _setupEventHandlers(): void;
  function _setupPixi(): void;
  function _stretchHeight(): number;
  function _stretchWidth(): number;
  function _switchFPSCounter(): void;
  function _switchFullScreen(): void;
  function _switchStretchMode(): void;
  /**
   * The default zoom scale of the game screen.
   */
  function _updateAllElements(): void;
  function _updateCanvas(): void;
  function _updateErrorPrinter(): void;
  function _updateRealScale(): void;
  function _updateVideo(): void;
  /**
   * Erases the loading spinner.
   */
  function endLoading(): boolean;
  /**
   * Erases the loading error text.
   */
  function eraseError(): void;
  /**
   * Hides the game screen.
   */
  function hideScreen(): void;
  /**
   * Initializes the graphics system.
   */
  function initialize(): boolean;
  /**
   * Checks whether the specified point is inside the game canvas area.
   * @param x The x coordinate on the canvas area.
   * @param y The y coordinate on the canvas area.
   */
  function isInsideCanvas(x: number, y: number): boolean;
  /**
   * Converts an x coordinate on the page to the corresponding x coordinate on the canvas area.
   * @param x The x coordinate on the page to be converted.
   */
  function pageToCanvasX(x: number): number;
  /**
   * Converts a y coordinate on the page to the corresponding y coordinate on the canvas area.
   * @param y The y coordinate on the page to be converted.
   */
  function pageToCanvasY(y: number): number;
  /**
   * Displays the error text to the screen.
   * @param name The name of the error.
   * @param message The message of the error.
   */
  function printError(name: string, message: string, error?: Error): void;
  /**
   * Changes the size of the game screen.
   * @param width The width of the game screen.
   * @param height The height of the game screen.
   */
  function resize(width: number, height: number): void;
  /**
   * Sets the stage to be rendered.
   * @param stage The stage object to be rendered.
   */
  function setStage(stage: Stage): void;
  /**
   * Register a handler for tick events.
   * @param handler The listener function to be added for updates.
   */
  function setTickHandler(handler: () => void): void;
  /**
   * Displays a button to try to reload resources.
   * @param retry The callback function to be called when the button
   */
  function showRetryButton(retry: () => void): void;
  /**
   * Shows the game screen.
   */
  function showScreen(): void;
  /**
   * Starts the game loop.
   */
  function startGameLoop(): void;
  /**
   * Shows the loading spinner.
   */
  function startLoading(): void;
  /**
   * Stops the game loop.
   */
  function stopGameLoop(): void;
}
