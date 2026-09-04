//region Graphics
/**
 * The horizontal padding between {@link Graphics.width} and {@link Graphics.boxWidth}.<br>
 * When combined with {@link Graphics.verticalPadding}, the origin x,y can be easily
 * determined.
 * @returns {number} Always positive.
 */
Object.defineProperty(Graphics, "horizontalPadding", {
  get: function()
  {
    return Math.abs(this.width - this.boxWidth);
  }
});

/**
 * The vertical padding between {@link Graphics.height} and {@link Graphics.boxHeight}.<br>
 * @returns {number} Always positive.
 */
Object.defineProperty(Graphics, "verticalPadding", {
  get: function()
  {
    return Math.abs(this.height - this.boxHeight);
  }
});

/**
 * The origin x and y coordinates of the "box" width and height values.
 * @returns {[number, number]} A destructurable array of the box's ox and oy coordinates.
 */
Object.defineProperty(Graphics, "boxOrigin", {
  get: function()
  {
    return [ this.horizontalPadding, this.verticalPadding ];
  }
});

/**
 * How many real pixels on the player's display sit behind each logical pixel the game draws with.
 *
 * Every coordinate and font size in this codebase is a *logical* pixel, and on a display running at
 * 100% that is also a real one. On anything else - a 4K panel at 150%, a laptop at 125%, which
 * between them is most machines - it is not, and anything rasterized at its logical size arrives on
 * screen stretched across a fractional number of real pixels. Text is where that shows up first,
 * because a glyph is the only thing in the game that could have been drawn at the larger size for
 * free had anyone thought to ask.
 *
 * The renderer's own resolution is the honest answer to the question, and reading it here rather
 * than reading {@link window.devicePixelRatio} directly means that everything measuring itself
 * against this scale stays correct no matter what the renderer is eventually configured to.
 * @returns {number} Always positive; `1` on an unscaled display.
 */
Object.defineProperty(Graphics, "deviceScale", {
  get: function()
  {
    return this.app.renderer.resolution;
  }
});

/**
 * The number of real pixels per logical pixel that this display would like to be rendered at.
 *
 * Deliberately separate from {@link Graphics.deviceScale}: that one reports what the renderer is
 * *currently* doing and is the honest number for anything sizing itself against the framebuffer,
 * while this is the value the renderer is about to be configured with. During setup there is no
 * renderer to ask, which is the whole reason both exist.
 *
 * The ceiling is a memory decision rather than a visual one. Every bitmap that rasterizes itself at
 * this scale costs its own area multiplied by the square of it, and there is no display on which
 * the pixels past three are distinguishable from the ones beneath them.
 * @returns {number} Between 1 and 3.
 */
Graphics.desiredDeviceScale = function()
{
  const ratio = window.devicePixelRatio;

  return Math.min(Math.max(ratio, 1), 3);
};

/**
 * Points the renderer at the display's real pixel grid.
 *
 * RMMZ builds its `PIXI.Application` with no `resolution` at all, so the framebuffer holds exactly
 * as many pixels as the game is logically wide and the browser stretches that across however many
 * the display actually has. On any display not running at 100% - a 4K panel at 150%, a laptop at
 * 125%, which between them is most machines - that is a permanent bilinear smear across every frame
 * of the game, and no amount of care taken further up can survive it.
 *
 * Resizing rather than assigning the canvas dimensions directly is deliberate: `resize` recomputes
 * the renderer's own screen rectangle alongside the backing store, and those two disagreeing is a
 * worse state than either of them being wrong. The canvas keeps whatever CSS size it was given, so
 * the game occupies exactly the same area of the window as before; there are simply more pixels
 * inside it.
 */
Graphics.applyDeviceResolution = function()
{
  // a renderer that failed to build is a state vanilla deliberately survives - `_createPixiApp`
  // swallows the failure, `initialize` reports it by returning false, and the player gets an error
  // screen instead of a crash. `_createEffekseerContext` asks the same question for the same reason.
  // this is that engine contract rather than a guard against our own, and the resize handler is
  // registered before the app is built, so a resize on a dead renderer really can arrive here.
  if (!this.app) return;

  const { renderer } = this.app;

  // from here on, this is what turns a logical coordinate into a framebuffer one.
  renderer.resolution = this.desiredDeviceScale();

  // resizing to the same logical size re-derives the backing store from that new resolution.
  renderer.resize(this.width, this.height);
};

/**
 * Extends {@link Graphics._setupPixi}.<br/>
 * Also raises the resolution that filter passes render at.
 *
 * A filter draws into a texture of its own and that texture is then drawn into the framebuffer, so
 * a filter still running at a resolution of one flattens the entire scene back down and quietly
 * undoes everything else here. {@link Spriteset_Base.createBaseFilters} puts a colour filter over
 * the whole map unconditionally, which makes this not an edge case but every frame of the game.
 *
 * It belongs in this particular seam because a filter reads the setting in its own constructor:
 * anything constructed before this line keeps the old value for as long as it lives.
 */
J.BASE.Aliased.Graphics.set('_setupPixi', Graphics._setupPixi);
Graphics._setupPixi = function()
{
  // perform original logic.
  J.BASE.Aliased.Graphics.get('_setupPixi')
    .call(this);

  // the renderer does not exist yet, so this asks the display directly for what it is about to be.
  PIXI.settings.FILTER_RESOLUTION = this.desiredDeviceScale();
};

/**
 * Extends {@link Graphics._createPixiApp}.<br/>
 * Also raises the freshly-built renderer to the display's own resolution.
 */
J.BASE.Aliased.Graphics.set('_createPixiApp', Graphics._createPixiApp);
Graphics._createPixiApp = function()
{
  // perform original logic.
  J.BASE.Aliased.Graphics.get('_createPixiApp')
    .call(this);

  // raise the framebuffer to the display's real pixel count before anything renders into it.
  this.applyDeviceResolution();
};

/**
 * Extends {@link Graphics._updateAllElements}.<br/>
 * Also restores the renderer's resolution after the canvas is put back to logical pixels.
 *
 * `_updateCanvas` writes the logical width straight onto the canvas element, which throws the
 * device-resolution backing store away every time the window is resized, the stretch mode is
 * toggled, or the game screen changes size. Putting it back here is what stops a resized window
 * from silently going soft again for the rest of the session.
 */
J.BASE.Aliased.Graphics.set('_updateAllElements', Graphics._updateAllElements);
Graphics._updateAllElements = function()
{
  // perform original logic.
  J.BASE.Aliased.Graphics.get('_updateAllElements')
    .call(this);

  // and undo the part of it that just undid this.
  this.applyDeviceResolution();
};
//endregion Graphics