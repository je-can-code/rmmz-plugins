//region Bitmap
/**
 * RMMZ {@link Window_Base.prototype.flushTextState} calls {@link Bitmap.prototype.drawText}
 * without an alignment argument. Older engines treated that like left alignment; NW.js 0.110+
 * warns when assigning undefined to {@link CanvasRenderingContext2D#textAlign}.
 *
 * @param {string} text The text that will be drawn.
 * @param {number} x The x coordinate for the left of the text.
 * @param {number} y The y coordinate for the top of the text.
 * @param {number} maxWidth The maximum allowed width of the text.
 * @param {number} lineHeight The height of the text line.
 * @param {string} [align] The alignment of the text; defaults to left when omitted.
 */
J.BASE.Aliased.Bitmap.set('drawText', Bitmap.prototype.drawText);
Bitmap.prototype.drawText = function(text, x, y, maxWidth, lineHeight, align)
{
  const resolvedAlign = align === undefined
    ? 'left'
    : align;

  J.BASE.Aliased.Bitmap.get('drawText')
    .call(this, text, x, y, maxWidth, lineHeight, resolvedAlign);
};
//endregion Bitmap