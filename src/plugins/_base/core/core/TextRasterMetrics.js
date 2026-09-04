//region TextRasterMetrics
/**
 * The pixel measurements for rasterizing a run of text onto a bitmap without the canvas mangling it.
 *
 * Drawing text in RMMZ is not a rendering problem, it is an arithmetic one, which is why the sums live
 * here rather than inside a sprite. There are three of them and they compound.
 *
 * The first is the squeeze. {@link Bitmap.drawText} forwards its `maxWidth` down to
 * `CanvasRenderingContext2D.fillText`, and the canvas treats that argument as a promise it must keep:
 * text wider than `maxWidth` is *condensed* to fit rather than clipped. Meanwhile a canvas element's
 * `width` is an integer attribute, so a bitmap sized from a fractional measurement silently truncates.
 * Size a bitmap to `measureTextWidth` and the number handed back is always a fraction under what the
 * text actually needs - so every string drawn that way is horizontally squashed, forever, by an amount
 * too small to name and too large to unsee.
 *
 * The second is the shaved outline. The outline is stroked along the glyph's own path, so half of its
 * width falls outside the letterform. A bitmap sized to the glyphs alone leaves nowhere for that half
 * to land, and the first and last character of every label lose their outline to the bitmap's edge.
 *
 * The third is the half-pixel. `drawText` centres by adding half the draw width to the origin, so an
 * odd width puts the entire run on a half-pixel boundary and the canvas antialiases each stem across
 * two columns instead of filling one.
 *
 * Every measurement below is in the **logical pixels** the rest of the codebase speaks in. How many
 * real pixels end up behind them is {@link Bitmap.applyDeviceScale}'s business and deliberately not
 * this class's: a bitmap that holds more pixels than it reports still reports these numbers, and the
 * moment two places in the codebase each decide for themselves what a pixel means, they disagree.
 */
class TextRasterMetrics
{
  /**
   * The width of the outline stroked around each glyph.
   *
   * Scaled off the font size so the outline keeps the same visual weight against glyphs of any size,
   * with a floor of two that keeps small text legible against a bright tile it happens to be
   * standing on.
   * @param {number} fontSize The font size.
   * @returns {number}
   */
  static outlineWidth(fontSize)
  {
    return Math.max(2, Math.floor(fontSize / 6));
  }

  /**
   * The transparent margin to leave on each side of the text, in device pixels.
   *
   * A stroke is centred on the path it follows, so only half of it falls outside the glyph and half
   * this much would technically do. The full width is reserved instead because a round line join
   * bulges past that half on a sharp corner, and a spare pixel of nothing costs nothing.
   * @param {number} outlineWidth The width of the outline in device pixels.
   * @returns {number}
   */
  static padding(outlineWidth)
  {
    return Math.ceil(outlineWidth);
  }

  /**
   * The width of the area the text itself is drawn into, in device pixels.
   *
   * Rounded **up** so the value handed to `fillText` as `maxWidth` is never below what the glyphs
   * need, which is what stops the canvas condensing them. Rounded up to an **even** number so that
   * centred text - which lands on half of this value - still lands on a whole pixel.
   * @param {number} measuredWidth The natural width of the text at its device font size.
   * @returns {number}
   */
  static textWidth(measuredWidth)
  {
    return Math.ceil(measuredWidth / 2) * 2;
  }

  /**
   * The full width of the bitmap, in device pixels.
   * @param {number} textWidth The width of the text area.
   * @param {number} padding The margin reserved on each side for the outline.
   * @returns {number}
   */
  static canvasWidth(textWidth, padding)
  {
    return textWidth + (padding * 2);
  }

  /**
   * The full height of the bitmap.
   *
   * Three times the font size, which is generous, and deliberately so: the engine's own baseline sum
   * places text well down inside the box, and a tall box costs a little texture memory where a short
   * one costs clipped descenders on every glyph that has one.
   * @param {number} fontSize The font size the text is drawn at.
   * @returns {number}
   */
  static canvasHeight(fontSize)
  {
    return fontSize * 3;
  }

  /**
   * Snaps a logical coordinate onto the device pixel grid.
   *
   * Rounding a logical coordinate to a whole number is not enough on a scaled display: at a scale of
   * 1.5, the whole logical number 37 is device pixel 55.5, and the sprite is sampled between two
   * columns exactly as if it had never been rounded at all. The grid that matters is the one made of
   * real pixels, so the value is rounded on that grid and converted back.
   * @param {number} value The coordinate in logical pixels.
   * @param {number} scale How many device pixels sit behind each logical pixel.
   * @returns {number}
   */
  static snap(value, scale)
  {
    return Math.round(value * scale) / scale;
  }
}

export default TextRasterMetrics;
//endregion TextRasterMetrics