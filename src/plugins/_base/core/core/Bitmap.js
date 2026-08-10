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

//endregion Bitmap