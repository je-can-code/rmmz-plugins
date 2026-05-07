/**
 * Generated from project/js/rmmz_core.js
 * Class: Window
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _animationCount: number;
  _backSprite: null | Sprite;
  _clientArea: Sprite;
  _colorTone: number[] | unknown[];
  _container: null | PIXI.Container;
  _contentsBackSprite: null | Sprite;
  _contentsSprite: null | Sprite;
  _cursorRect: Rectangle;
  _cursorSprite: null | Sprite;
  _downArrowSprite: null | Sprite;
  _frameSprite: null | Sprite;
  _height: number;
  _innerChildren: unknown[];
  _isWindow: boolean;
  _margin: number;
  _openness: number;
  _padding: number;
  _pauseSignSprite: null | Sprite;
  _upArrowSprite: null | Sprite;
  _width: number;
  _windowskin: null;
  /**
   * Draws the window shape into PIXI.Graphics object. Used by WindowLayer.
   */
  _createAllParts(): void;
  _createArrowSprites(): void;
  /**
   * Draws the window shape into PIXI.Graphics object. Used by WindowLayer.
   */
  _createBackSprite(): void;
  _createClientArea(): void;
  /**
   * Draws the window shape into PIXI.Graphics object. Used by WindowLayer.
   */
  _createContainer(): void;
  _createContentsBackSprite(): void;
  _createContentsSprite(): void;
  _createCursorSprite(): void;
  _createFrameSprite(): void;
  _createPauseSignSprites(): void;
  _makeCursorAlpha(): number;
  _onWindowskinLoad(): void;
  _refreshAllParts(): void;
  _refreshArrows(): void;
  _refreshBack(): void;
  _refreshCursor(): void;
  _refreshFrame(): void;
  _refreshPauseSign(): void;
  _setRectPartsGeometry(sprite: Sprite, srect: Rectangle, drect: Rectangle, m: number): void;
  _updateArrows(): void;
  _updateClientArea(): void;
  _updateContents(): void;
  _updateContentsBack(): void;
  _updateCursor(): void;
  _updateFilterArea(): void;
  _updateFrame(): void;
  _updatePauseSign(): void;
  /**
   * Adds a child between the background and contents.
   * @param child The child to add.
   */
  addChildToBack(child: object): object;
  /**
   * Adds a child to the client area.
   * @param child The child to add.
   */
  addInnerChild(child: object): object;
  /**
   * Destroys the window.
   */
  destroy(): void;
  /**
   * Draws the window shape into PIXI.Graphics object. Used by WindowLayer.
   */
  drawShape(graphics: object): void;
  /**
   * The window in the game.
   */
  initialize(): void;
  /**
   * Checks whether the window is completely closed (openness == 0).
   */
  isClosed(): boolean;
  /**
   * Checks whether the window is completely open (openness == 255).
   */
  isOpen(): boolean;
  /**
   * Sets the x, y, width, and height all at once.
   * @param x The x coordinate of the window.
   * @param y The y coordinate of the window.
   * @param width The width of the window.
   * @param height The height of the window.
   */
  move(x: number, y: number, width: number, height: number): void;
  /**
   * Moves the cursor position by the given amount.
   * @param x The amount of horizontal movement.
   * @param y The amount of vertical movement.
   */
  moveCursorBy(x: number, y: number): void;
  /**
   * Moves the inner children by the given amount.
   * @param x The amount of horizontal movement.
   * @param y The amount of vertical movement.
   */
  moveInnerChildrenBy(x: number, y: number): void;
  /**
   * Sets the position of the command cursor.
   * @param x The x coordinate of the cursor.
   * @param y The y coordinate of the cursor.
   * @param width The width of the cursor.
   * @param height The height of the cursor.
   */
  setCursorRect(x: number, y: number, width: number, height: number): void;
  /**
   * Changes the color of the background.
   * @param r The red value in the range (-255, 255).
   * @param g The green value in the range (-255, 255).
   * @param b The blue value in the range (-255, 255).
   */
  setTone(r: number, g: number, b: number): void;
  /**
   * Updates the window for each frame.
   */
  update(): void;
  /**
   * Updates the transform on all children of this container for rendering.
   */
  updateTransform(): void;
}
