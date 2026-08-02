/**
 * Overwrites {@link Bitmap#_createCanvas}.<br/>
 * Adds an additional "willReadFrequently" attribute set to true on the canvas.
 * This forces software-based rendering, which is supposedly optimal based
 * on the way this code is written, according to Chromium's warning.
 * @param {number} width The width in pixels of the canvas.
 * @param {number} height The height in pixels of the canvas.
 * @private
 * @override
 */
Bitmap.prototype._createCanvas = function(width, height)
{
  // held as a local for the rest of this method rather than read back off the object: the engine's
  // `canvas` property re-enters `_ensureCanvas`, which would recurse straight back into here.
  const canvas = document.createElement("canvas");

  this.setCanvas(canvas);

  // applies the new attribute to change it to software rendering.
  this.setContext(canvas.getContext("2d", { willReadFrequently: true }));

  // size the element before it becomes a texture.
  canvas.width = width;
  canvas.height = height;

  this._createBaseTexture(canvas);
};

//region properties
/**
 * Sets the canvas element this bitmap draws onto.
 *
 * Note that there is deliberately no matching getter here; the engine already exposes a `canvas`
 * property, and that one lazily creates the element it returns.
 * @param {HTMLCanvasElement} newCanvas The canvas element.
 */
Bitmap.prototype.setCanvas = function(newCanvas)
{
  // assign the canvas.
  this._canvas = newCanvas;
};

/**
 * Sets the 2d drawing context this bitmap renders through.
 * @param {CanvasRenderingContext2D} newContext The drawing context.
 */
Bitmap.prototype.setContext = function(newContext)
{
  // assign the context.
  this._context = newContext;
};
//endregion properties