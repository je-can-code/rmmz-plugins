/**
 * Overrides {@link Bitmap#_createCanvas}.<br>
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
  this._canvas = document.createElement("canvas");

  // applies the new attribute to change it to software rendering.
  this._context = this._canvas.getContext("2d", { willReadFrequently: true });

  this._canvas.width = width;
  this._canvas.height = height;
  this._createBaseTexture(this._canvas);
};