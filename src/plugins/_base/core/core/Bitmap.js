//region Bitmap
/**
 * The alignments a canvas will actually accept for {@link CanvasRenderingContext2D#textAlign}.
 *
 * Kept as an allowlist rather than a type check, because the question being asked is not "is this a string" but
 * "is this something the canvas understands" - and a wrong string is every bit as broken as a number.
 * @type {string[]}
 */
const validTextAlignments = [ 'left', 'center', 'right', 'start', 'end' ];

/**
 * Normalizes the alignment RMMZ hands down, because the engine hands down two different wrong things.
 *
 * `Window_Base.prototype.drawText` takes `(text, x, y, maxWidth, align)` while `Bitmap.prototype.drawText` takes
 * `(text, x, y, maxWidth, lineHeight, align)` - five parameters against six, with `align` and `lineHeight` sitting
 * in the same slot. Vanilla confuses the two in three separate places, and every one lands here:
 *
 * - `Window_Base.flushTextState` calls with no alignment at all, so `align` arrives `undefined`.
 * - `Window_EquipSlot.drawItem` and `Window_StatusEquip.drawItem` both pass `rect.height`, so `align` arrives as
 *   the line height - `36` by default, which the console then rejects once per equipment slot per refresh.
 *
 * Older Chromium quietly ignored an unusable `textAlign`; NW.js 0.110+ warns instead, which is why engine code
 * that has been wrong for years only started saying so recently. **This is not a guard against our own contract**
 * - it is the boundary with engine code that cannot be corrected at the source, and every one of those callers
 * meant the default, so the default is what they get.
 *
 * @param {string} text The text that will be drawn.
 * @param {number} x The x coordinate for the left of the text.
 * @param {number} y The y coordinate for the top of the text.
 * @param {number} maxWidth The maximum allowed width of the text.
 * @param {number} lineHeight The height of the text line.
 * @param {string} [align] The alignment of the text; defaults to left when unusable or omitted.
 */
J.BASE.Aliased.Bitmap.set('drawText', Bitmap.prototype.drawText);
Bitmap.prototype.drawText = function(text, x, y, maxWidth, lineHeight, align)
{
  const resolvedAlign = validTextAlignments.includes(align)
    ? align
    : 'left';

  // perform original logic.
  J.BASE.Aliased.Bitmap.get('drawText')
    .call(this, text, x, y, maxWidth, lineHeight, resolvedAlign);
};

/**
 * The scale every bitmap holds unless it is deliberately raised to the display's resolution.
 *
 * This lives on the prototype rather than only in `initialize`, and the reason is load order. The
 * engine builds bitmaps while its own scripts are still parsing - `ImageManager._emptyBitmap` is a
 * `new Bitmap(1, 1)` evaluated at the top level of `rmmz_managers.js`, long before any plugin has
 * had the chance to alias anything. Such a bitmap never runs the `initialize` below, so it would
 * carry no `_deviceScale` at all, and the `width` getter divides by whatever that answers.
 *
 * Undefined is the worst possible answer to divide by, because the result is `NaN` rather than a
 * throw: `patternWidth` hands it to `setFrame`, the engine's `_refresh` derives `pivot` from the
 * frame, and a sprite with a `NaN` pivot composes to a `NaN` world matrix. It then reports itself
 * visible, opaque and correctly scaled while rendering nowhere at all - which is a genuinely
 * horrible thing to debug, and was exactly the bug that produced this line.
 *
 * A prototype default is what makes that state unreachable. Every bitmap answers 1 from the moment
 * it exists, and {@link Bitmap.setDeviceScale} shadows it per instance for the ones that grow.
 * @type {number}
 */
Bitmap.prototype._deviceScale = 1;

/**
 * Extends {@link Bitmap.initialize}.<br/>
 * Also establishes the scale at which this bitmap holds its pixels.
 *
 * Seeded before the original runs rather than after, because the original may build a canvas on the
 * way through and everything downstream of that reads dimensions back off this.
 * @param {number} [width] The width of the bitmap.
 * @param {number} [height] The height of the bitmap.
 */
J.BASE.Aliased.Bitmap.set('initialize', Bitmap.prototype.initialize);
Bitmap.prototype.initialize = function(width, height)
{
  /**
   * How many real pixels this bitmap holds for each logical pixel it reports.
   * One for every bitmap in the game unless something deliberately raises it.
   * @type {number}
   */
  this._deviceScale = 1;

  // perform original logic.
  J.BASE.Aliased.Bitmap.get('initialize')
    .call(this, width, height);
};

/**
 * How many real pixels this bitmap holds for each logical pixel it reports.
 * @returns {number} One unless this bitmap has been raised to the display's resolution.
 */
Bitmap.prototype.deviceScale = function()
{
  return this._deviceScale;
};

/**
 * Sets how many real pixels this bitmap holds per logical pixel.
 * @param {number} scale The scale.
 */
Bitmap.prototype.setDeviceScale = function(scale)
{
  this._deviceScale = scale;
};

/**
 * The width of the bitmap, in the logical pixels every caller draws with.
 *
 * Overridden rather than extended because the number this returns is the whole contract. The engine
 * frames a window's contents sprite with `setFrame(0, 0, bitmap.width, bitmap.height)`, and those
 * coordinates are texture space - so a bitmap holding more pixels than it occupies has to keep
 * reporting the smaller number or the frame runs off the end of its own texture.
 * @returns {number}
 */
Object.defineProperty(Bitmap.prototype, 'width', {
  get: function()
  {
    const image = this._canvas || this._image;

    // vanilla's own contract: a bitmap still loading from a url has neither yet.
    if (!image) return 0;

    return image.width / this.deviceScale();
  },
  configurable: true
});

/**
 * The height of the bitmap, in the logical pixels every caller draws with.
 * @returns {number}
 */
Object.defineProperty(Bitmap.prototype, 'height', {
  get: function()
  {
    const image = this._canvas || this._image;

    // vanilla's own contract: a bitmap still loading from a url has neither yet.
    if (!image) return 0;

    return image.height / this.deviceScale();
  },
  configurable: true
});

/**
 * Rebuilds this bitmap to hold more real pixels than the area it reports occupying.
 *
 * This is the whole trick behind crisp text in a window. The canvas grows to the display's real
 * pixel count, the texture is told that those pixels describe the original smaller area, and the
 * drawing context is scaled to match - so every existing `drawText(x, y, width)` in the codebase
 * keeps passing the same logical coordinates it always did and simply rasterizes into more pixels.
 * Measurement is unaffected because `measureText` ignores the context transform, which is what
 * keeps text wrapping and alignment identical to before.
 * @param {number} scale How many real pixels to hold per logical pixel.
 */
Bitmap.prototype.applyDeviceScale = function(scale)
{
  // captured before the scale changes what these report.
  const logicalWidth = this.width;
  const logicalHeight = this.height;

  this.setDeviceScale(scale);
  this.rescaleCanvas(logicalWidth, logicalHeight);
};

/**
 * Sizes this bitmap's canvas to hold its logical area at its device scale.
 *
 * Kept separate because resizing a canvas element resets everything about its drawing context - the
 * transform included - so this has to happen again after every resize rather than only once.
 * @param {number} logicalWidth The width this bitmap should report.
 * @param {number} logicalHeight The height this bitmap should report.
 */
Bitmap.prototype.rescaleCanvas = function(logicalWidth, logicalHeight)
{
  const scale = this.deviceScale();
  const realWidth = logicalWidth * scale;
  const realHeight = logicalHeight * scale;

  this.canvas.width = realWidth;
  this.canvas.height = realHeight;

  // the texture reports the logical area while sampling from every real pixel behind it.
  this.baseTexture.setRealSize(realWidth, realHeight, scale);

  // and this is what lets callers keep speaking in logical coordinates.
  this.context.setTransform(scale, 0, 0, scale, 0, 0);
};

/**
 * Extends {@link Bitmap.resize}.<br/>
 * Also restores the device scale the original just sized away.
 * @param {number} width The new logical width.
 * @param {number} height The new logical height.
 */
J.BASE.Aliased.Bitmap.set('resize', Bitmap.prototype.resize);
Bitmap.prototype.resize = function(width, height)
{
  // perform original logic.
  J.BASE.Aliased.Bitmap.get('resize')
    .call(this, width, height);

  // an ordinary bitmap is already the size it was asked for.
  if (this.deviceScale() === 1) return;

  // the original sized the canvas in the logical units the caller passed and wiped the context
  // transform doing it, so both have to be put back.
  const clampedWidth = Math.max(width || 0, 1);
  const clampedHeight = Math.max(height || 0, 1);
  this.rescaleCanvas(clampedWidth, clampedHeight);
};

/**
 * Extends {@link Bitmap.getPixel}.<br/>
 * Also addresses the request in real pixels rather than logical ones.
 *
 * `getImageData` reads the canvas directly and ignores the context transform, so a caller's logical
 * coordinate would land at a fraction of where it meant on a bitmap holding more pixels than it
 * reports.
 * @param {number} x The x coordinate of the pixel, in logical pixels.
 * @param {number} y The y coordinate of the pixel, in logical pixels.
 * @returns {string} The colour, as a hex string.
 */
J.BASE.Aliased.Bitmap.set('getPixel', Bitmap.prototype.getPixel);
Bitmap.prototype.getPixel = function(x, y)
{
  const scale = this.deviceScale();

  // perform original logic.
  return J.BASE.Aliased.Bitmap.get('getPixel')
    .call(this, x * scale, y * scale);
};

/**
 * Extends {@link Bitmap.getAlphaPixel}.<br/>
 * Also addresses the request in real pixels rather than logical ones.
 * @param {number} x The x coordinate of the pixel, in logical pixels.
 * @param {number} y The y coordinate of the pixel, in logical pixels.
 * @returns {number} The alpha value.
 */
J.BASE.Aliased.Bitmap.set('getAlphaPixel', Bitmap.prototype.getAlphaPixel);
Bitmap.prototype.getAlphaPixel = function(x, y)
{
  const scale = this.deviceScale();

  // perform original logic.
  return J.BASE.Aliased.Bitmap.get('getAlphaPixel')
    .call(this, x * scale, y * scale);
};

//endregion Bitmap