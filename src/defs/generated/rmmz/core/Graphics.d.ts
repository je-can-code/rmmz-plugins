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
   * Inferred engine backing field.
   *
   * Type: `null | PIXI.Application`.
   * Initialized in: {@link Graphics#initialize}.
   * Written in: {@link Graphics#_createEffekseerContext}, {@link Graphics#_createPixiApp}, {@link Graphics#initialize}.
   * Read in: {@link Graphics#_canRender}, {@link Graphics#_createEffekseerContext}, {@link Graphics#_createPixiApp}, {@link Graphics#_onTick}, {@link Graphics#initialize}, {@link Graphics#resize}, {@link Graphics#setStage}, {@link Graphics#startGameLoop}, {@link Graphics#stopGameLoop}.
   */
  _app: null | PIXI.Application;
  /**
   * Inferred engine backing field.
   *
   * Type: `null`.
   * Initialized in: {@link Graphics#initialize}.
   * Written in: {@link Graphics#_createCanvas}, {@link Graphics#initialize}.
   * Read in: {@link Graphics#_applyCanvasFilter}, {@link Graphics#_clearCanvasFilter}, {@link Graphics#_createCanvas}, {@link Graphics#_createPixiApp}, {@link Graphics#_updateCanvas}, {@link Graphics#hideScreen}, {@link Graphics#pageToCanvasX}, {@link Graphics#pageToCanvasY}, {@link Graphics#showScreen}.
   */
  _canvas: null;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Graphics#initialize}.
   * Written in: {@link Graphics#initialize}.
   * Read in: {@link Graphics#_updateRealScale}.
   */
  _defaultScale: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `null`.
   * Initialized in: {@link Graphics#initialize}.
   * Written in: {@link Graphics#_createEffekseerContext}, {@link Graphics#initialize}.
   * Read in: {@link Graphics#_createEffekseerContext}.
   */
  _effekseer: null;
  /**
   * Inferred engine backing field.
   *
   * Type: `null`.
   * Initialized in: {@link Graphics#initialize}.
   * Written in: {@link Graphics#_createErrorPrinter}, {@link Graphics#initialize}.
   * Read in: {@link Graphics#_createErrorPrinter}, {@link Graphics#_updateErrorPrinter}, {@link Graphics#eraseError}, {@link Graphics#printError}, {@link Graphics#showRetryButton}.
   */
  _errorPrinter: null;
  /**
   * Inferred engine backing field.
   *
   * Type: `null | Graphics.FPSCounter`.
   * Initialized in: {@link Graphics#initialize}.
   * Written in: {@link Graphics#_createFPSCounter}, {@link Graphics#initialize}.
   * Read in: {@link Graphics#_onTick}, {@link Graphics#_switchFPSCounter}.
   */
  _fpsCounter: null | Graphics.FPSCounter;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Graphics#initialize}.
   * Written in: {@link Graphics#initialize}, {@link Graphics#resize}.
   * Read in: {@link Graphics#_updateCanvas}, {@link Graphics#_updateRealScale}, {@link Graphics#_updateVideo}, {@link Graphics#initialize}, {@link Graphics#isInsideCanvas}.
   */
  _height: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `null`.
   * Initialized in: {@link Graphics#initialize}.
   * Written in: {@link Graphics#_createLoadingSpinner}, {@link Graphics#initialize}.
   * Read in: {@link Graphics#endLoading}, {@link Graphics#startLoading}.
   */
  _loadingSpinner: null;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Graphics#initialize}.
   * Written in: {@link Graphics#_updateRealScale}, {@link Graphics#initialize}.
   * Read in: {@link Graphics#_centerElement}, {@link Graphics#_updateErrorPrinter}, {@link Graphics#_updateVideo}, {@link Graphics#pageToCanvasX}, {@link Graphics#pageToCanvasY}.
   */
  _realScale: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: {@link Graphics#initialize}.
   * Written in: {@link Graphics#_switchStretchMode}, {@link Graphics#initialize}.
   * Read in: {@link Graphics#_switchStretchMode}, {@link Graphics#_updateRealScale}.
   */
  _stretchEnabled: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `null | () => void`.
   * Initialized in: {@link Graphics#initialize}.
   * Written in: {@link Graphics#initialize}, {@link Graphics#setTickHandler}.
   * Read in: {@link Graphics#_onTick}.
   */
  _tickHandler: null | () => void;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: {@link Graphics#initialize}.
   * Written in: {@link Graphics#initialize}, {@link Graphics#printError}.
   * Read in: {@link Graphics#eraseError}.
   */
  _wasLoading: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Graphics#initialize}.
   * Written in: {@link Graphics#initialize}, {@link Graphics#resize}.
   * Read in: {@link Graphics#_updateCanvas}, {@link Graphics#_updateErrorPrinter}, {@link Graphics#_updateRealScale}, {@link Graphics#_updateVideo}, {@link Graphics#initialize}, {@link Graphics#isInsideCanvas}.
   */
  _width: number;
}
declare function Graphics(): never;
declare namespace Graphics
{
  /**
   * Performs apply canvas filter.
   */
  function _applyCanvasFilter(): void;
  /**
   * Gets can render.
   * @returns The result.
   */
  function _canRender(): boolean;
  /**
   * Performs cancel full screen.
   */
  function _cancelFullScreen(): void;
  /**
   * Performs center element.
   * @param element The element parameter.
   */
  function _centerElement(element: HTMLElement): void;
  /**
   * Performs clear canvas filter.
   */
  function _clearCanvasFilter(): void;
  /**
   * The default zoom scale of the game screen.
   */
  function _createAllElements(): void;
  /**
   * Performs create canvas.
   */
  function _createCanvas(): void;
  /**
   * Performs create effekseer context.
   */
  function _createEffekseerContext(): void;
  /**
   * Performs create error printer.
   */
  function _createErrorPrinter(): void;
  /**
   * Performs create fpscounter.
   */
  function _createFPSCounter(): void;
  /**
   * Performs create loading spinner.
   */
  function _createLoadingSpinner(): void;
  /**
   * Performs create pixi app.
   */
  function _createPixiApp(): void;
  /**
   * Gets default stretch mode.
   * @returns The result.
   */
  function _defaultStretchMode(): boolean;
  /**
   * Performs disable context menu.
   */
  function _disableContextMenu(): void;
  /**
   * Gets is full screen.
   * @returns The result.
   */
  function _isFullScreen(): boolean;
  /**
   * Gets make error html.
   * @param name The name parameter.
   * @param message The message parameter.
   * @returns The result.
   */
  function _makeErrorHtml(name: string, message: string): string;
  /**
   * Performs on key down.
   * @param event The event parameter.
   */
  function _onKeyDown(event: KeyboardEvent): void;
  /**
   * The default zoom scale of the game screen.
   * @param deltaTime The deltaTime parameter.
   */
  function _onTick(deltaTime: number): void;
  /**
   * Performs on window resize.
   */
  function _onWindowResize(): void;
  /**
   * Performs request full screen.
   */
  function _requestFullScreen(): void;
  /**
   * Performs setup event handlers.
   */
  function _setupEventHandlers(): void;
  /**
   * Performs setup pixi.
   */
  function _setupPixi(): void;
  /**
   * Gets stretch height.
   * @returns The result.
   */
  function _stretchHeight(): number;
  /**
   * Gets stretch width.
   * @returns The result.
   */
  function _stretchWidth(): number;
  /**
   * Performs switch fpscounter.
   */
  function _switchFPSCounter(): void;
  /**
   * Performs switch full screen.
   */
  function _switchFullScreen(): void;
  /**
   * Performs switch stretch mode.
   */
  function _switchStretchMode(): void;
  /**
   * The default zoom scale of the game screen.
   */
  function _updateAllElements(): void;
  /**
   * Performs update canvas.
   */
  function _updateCanvas(): void;
  /**
   * Performs update error printer.
   */
  function _updateErrorPrinter(): void;
  /**
   * Performs update real scale.
   */
  function _updateRealScale(): void;
  /**
   * Performs update video.
   */
  function _updateVideo(): void;
  /**
   * Erases the loading spinner.
   * @returns The result.
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
   * @returns The result.
   */
  function initialize(): boolean;
  /**
   * Checks whether the specified point is inside the game canvas area.
   * @param x The x coordinate on the canvas area.
   * @param y The y coordinate on the canvas area.
   * @returns True if inside canvas; false otherwise.
   */
  function isInsideCanvas(x: number, y: number): boolean;
  /**
   * Converts an x coordinate on the page to the corresponding x coordinate on the canvas area.
   * @param x The x coordinate on the page to be converted.
   * @returns The result.
   */
  function pageToCanvasX(x: number): number;
  /**
   * Converts a y coordinate on the page to the corresponding y coordinate on the canvas area.
   * @param y The y coordinate on the page to be converted.
   * @returns The result.
   */
  function pageToCanvasY(y: number): number;
  /**
   * Displays the error text to the screen.
   * @param name The name of the error.
   * @param message The message of the error.
   * @param error The error parameter.
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
