/**
 * Generated from project/js/rmmz_core.js
 * Class: Window
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window extends PIXI.Container
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Window#initialize}.<br/>
   * Written in: {@link Window#initialize}, {@link Window#update}.<br/>
   * Read in: {@link Window#_makeCursorAlpha}, {@link Window#_updatePauseSign}.<br/>
   */
  _animationCount: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | Sprite`.<br/>
   * Initialized in: {@link Window#initialize}.<br/>
   * Written in: {@link Window#_createBackSprite}, {@link Window#initialize}.<br/>
   * Read in: {@link Window#_createBackSprite}, {@link Window#_refreshBack}.<br/>
   */
  _backSprite: null | Sprite;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Sprite`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window#_createClientArea}.<br/>
   * Read in: {@link Window#_createClientArea}, {@link Window#_createContentsBackSprite}, {@link Window#_createContentsSprite}, {@link Window#_createCursorSprite}, {@link Window#_updateClientArea}, {@link Window#_updateFilterArea}, {@link Window#addInnerChild}.<br/>
   */
  _clientArea: Sprite;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number[] | unknown[]`.<br/>
   * Initialized in: {@link Window#initialize}.<br/>
   * Written in: {@link Window#initialize}, {@link Window#setTone}.<br/>
   * Read in: {@link Window#_refreshBack}, {@link Window#setTone}.<br/>
   */
  _colorTone: number[] | unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | PIXI.Container`.<br/>
   * Initialized in: {@link Window#initialize}.<br/>
   * Written in: {@link Window#_createContainer}, {@link Window#initialize}.<br/>
   * Read in: {@link Window#_createBackSprite}, {@link Window#_createContainer}, {@link Window#_createFrameSprite}, {@link Window#addChildToBack}.<br/>
   */
  _container: null | PIXI.Container;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | Sprite`.<br/>
   * Initialized in: {@link Window#initialize}.<br/>
   * Written in: {@link Window#_createContentsBackSprite}, {@link Window#initialize}.<br/>
   * Read in: {@link Window#_createContentsBackSprite}, {@link Window#_updateContentsBack}.<br/>
   */
  _contentsBackSprite: null | Sprite;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | Sprite`.<br/>
   * Initialized in: {@link Window#initialize}.<br/>
   * Written in: {@link Window#_createContentsSprite}, {@link Window#initialize}.<br/>
   * Read in: {@link Window#_createContentsSprite}, {@link Window#_updateContents}.<br/>
   */
  _contentsSprite: null | Sprite;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Rectangle`.<br/>
   * Initialized in: {@link Window#initialize}.<br/>
   * Written in: {@link Window#initialize}.<br/>
   * Read in: {@link Window#_refreshCursor}, {@link Window#_updateCursor}, {@link Window#moveCursorBy}, {@link Window#setCursorRect}.<br/>
   */
  _cursorRect: Rectangle;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | Sprite`.<br/>
   * Initialized in: {@link Window#initialize}.<br/>
   * Written in: {@link Window#_createCursorSprite}, {@link Window#initialize}.<br/>
   * Read in: {@link Window#_createCursorSprite}, {@link Window#_refreshCursor}, {@link Window#_updateCursor}.<br/>
   */
  _cursorSprite: null | Sprite;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | Sprite`.<br/>
   * Initialized in: {@link Window#initialize}.<br/>
   * Written in: {@link Window#_createArrowSprites}, {@link Window#initialize}.<br/>
   * Read in: {@link Window#_createArrowSprites}, {@link Window#_refreshArrows}, {@link Window#_updateArrows}.<br/>
   */
  _downArrowSprite: null | Sprite;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | Sprite`.<br/>
   * Initialized in: {@link Window#initialize}.<br/>
   * Written in: {@link Window#_createFrameSprite}, {@link Window#initialize}.<br/>
   * Read in: {@link Window#_createFrameSprite}, {@link Window#_refreshFrame}, {@link Window#_updateFrame}.<br/>
   */
  _frameSprite: null | Sprite;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Window#initialize}.<br/>
   * Written in: {@link Window#initialize}, {@link Window#move}.<br/>
   * Read in: {@link Window#_refreshArrows}, {@link Window#_refreshBack}, {@link Window#_refreshFrame}, {@link Window#_refreshPauseSign}, {@link Window#move}.<br/>
   */
  _height: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: {@link Window#initialize}.<br/>
   * Written in: {@link Window#initialize}.<br/>
   * Read in: {@link Window#addInnerChild}, {@link Window#moveInnerChildrenBy}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `push()`: {@link Window#addInnerChild}.<br/>
   */
  _innerChildren: unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link Window#initialize}.<br/>
   * Written in: {@link Window#initialize}.<br/>
   * Read in: none.<br/>
   */
  _isWindow: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Window#initialize}.<br/>
   * Written in: {@link Window#initialize}.<br/>
   * Read in: {@link Window#_refreshBack}.<br/>
   */
  _margin: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Window#initialize}.<br/>
   * Written in: {@link Window#initialize}.<br/>
   * Read in: {@link Window#drawShape}, {@link Window#isClosed}, {@link Window#isOpen}.<br/>
   */
  _openness: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Window#initialize}.<br/>
   * Written in: {@link Window#initialize}.<br/>
   * Read in: {@link Window#_createClientArea}, {@link Window#_updateClientArea}.<br/>
   */
  _padding: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | Sprite`.<br/>
   * Initialized in: {@link Window#initialize}.<br/>
   * Written in: {@link Window#_createPauseSignSprites}, {@link Window#initialize}.<br/>
   * Read in: {@link Window#_createPauseSignSprites}, {@link Window#_refreshPauseSign}, {@link Window#_updatePauseSign}.<br/>
   */
  _pauseSignSprite: null | Sprite;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | Sprite`.<br/>
   * Initialized in: {@link Window#initialize}.<br/>
   * Written in: {@link Window#_createArrowSprites}, {@link Window#initialize}.<br/>
   * Read in: {@link Window#_createArrowSprites}, {@link Window#_refreshArrows}, {@link Window#_updateArrows}.<br/>
   */
  _upArrowSprite: null | Sprite;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Window#initialize}.<br/>
   * Written in: {@link Window#initialize}, {@link Window#move}.<br/>
   * Read in: {@link Window#_refreshArrows}, {@link Window#_refreshBack}, {@link Window#_refreshFrame}, {@link Window#_refreshPauseSign}, {@link Window#move}.<br/>
   */
  _width: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: {@link Window#initialize}.<br/>
   * Written in: {@link Window#initialize}.<br/>
   * Read in: {@link Window#_refreshArrows}, {@link Window#_refreshBack}, {@link Window#_refreshCursor}, {@link Window#_refreshFrame}, {@link Window#_refreshPauseSign}.<br/>
   */
  _windowskin: null;
  /**
   * Draws the window shape into PIXI.Graphics object. Used by WindowLayer.
   */
  _createAllParts(): void;
  /**
   * Performs create arrow sprites.
   */
  _createArrowSprites(): void;
  /**
   * Draws the window shape into PIXI.Graphics object. Used by WindowLayer.
   */
  _createBackSprite(): void;
  /**
   * Performs create client area.
   */
  _createClientArea(): void;
  /**
   * Draws the window shape into PIXI.Graphics object. Used by WindowLayer.
   */
  _createContainer(): void;
  /**
   * Performs create contents back sprite.
   */
  _createContentsBackSprite(): void;
  /**
   * Performs create contents sprite.
   */
  _createContentsSprite(): void;
  /**
   * Performs create cursor sprite.
   */
  _createCursorSprite(): void;
  /**
   * Performs create frame sprite.
   */
  _createFrameSprite(): void;
  /**
   * Performs create pause sign sprites.
   */
  _createPauseSignSprites(): void;
  /**
   * Gets make cursor alpha.
   * @returns The result.
   */
  _makeCursorAlpha(): unknown;
  /**
   * Performs on windowskin load.
   */
  _onWindowskinLoad(): void;
  /**
   * Performs refresh all parts.
   */
  _refreshAllParts(): void;
  /**
   * Performs refresh arrows.
   */
  _refreshArrows(): void;
  /**
   * Performs refresh back.
   */
  _refreshBack(): void;
  /**
   * Performs refresh cursor.
   */
  _refreshCursor(): void;
  /**
   * Performs refresh frame.
   */
  _refreshFrame(): void;
  /**
   * Performs refresh pause sign.
   */
  _refreshPauseSign(): void;
  /**
   * Performs set rect parts geometry.
   * @param sprite The sprite parameter.
   * @param srect The srect parameter.
   * @param drect The drect parameter.
   * @param m The m parameter.
   */
  _setRectPartsGeometry(sprite: unknown, srect: unknown, drect: unknown, m: unknown): void;
  /**
   * Performs update arrows.
   */
  _updateArrows(): void;
  /**
   * Performs update client area.
   */
  _updateClientArea(): void;
  /**
   * Performs update contents.
   */
  _updateContents(): void;
  /**
   * Performs update contents back.
   */
  _updateContentsBack(): void;
  /**
   * Performs update cursor.
   */
  _updateCursor(): void;
  /**
   * Performs update filter area.
   */
  _updateFilterArea(): void;
  /**
   * Performs update frame.
   */
  _updateFrame(): void;
  /**
   * Performs update pause sign.
   */
  _updatePauseSign(): void;
  /**
   * Adds a child between the background and contents.
   * @param child The child to add.
   * @returns The result.
   */
  addChildToBack(child: object): object;
  /**
   * Adds a child to the client area.
   * @param child The child to add.
   * @returns The result.
   */
  addInnerChild(child: object): object;
  /**
   * The opacity of the window background (0 to 255).
   * @returns The result.
   */
  get backOpacity(): unknown;
  /**
   * The bitmap used for the window contents.
   * @returns The result.
   */
  get contents(): unknown;
  /**
   * The bitmap used for the window contents background.
   * @returns The result.
   */
  get contentsBack(): unknown;
  /**
   * The opacity of the window contents (0 to 255).
   * @returns The result.
   */
  get contentsOpacity(): unknown;
  /**
   * Destroys the window.
   */
  destroy(): void;
  /**
   * Draws the window shape into PIXI.Graphics object. Used by WindowLayer.
   * @param graphics The graphics parameter.
   */
  drawShape(graphics: unknown): void;
  /**
   * The height of the window in pixels.
   * @returns The result.
   */
  get height(): unknown;
  /**
   * The window in the game.
   */
  initialize(): void;
  /**
   * The height of the content area in pixels.
   * @returns The result.
   */
  get innerHeight(): unknown;
  /**
   * The rectangle of the content area.
   * @returns The result.
   */
  get innerRect(): Rectangle;
  /**
   * The width of the content area in pixels.
   * @returns The result.
   */
  get innerWidth(): unknown;
  /**
   * Checks whether the window is completely closed (openness == 0).
   * @returns True if closed; false otherwise.
   */
  isClosed(): boolean;
  /**
   * Checks whether the window is completely open (openness == 255).
   * @returns True if open; false otherwise.
   */
  isOpen(): boolean;
  /**
   * The size of the margin for the window background.
   * @returns The result.
   */
  get margin(): unknown;
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
   * The opacity of the window without contents (0 to 255).
   * @returns The result.
   */
  get opacity(): unknown;
  /**
   * The openness of the window (0 to 255).
   * @returns The result.
   */
  get openness(): unknown;
  /**
   * The size of the padding between the frame and contents.
   * @returns The result.
   */
  get padding(): unknown;
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
  /**
   * The width of the window in pixels.
   * @returns The result.
   */
  get width(): unknown;
  /**
   * The image used as a window skin.
   * @returns The result.
   */
  get windowskin(): unknown;
}
