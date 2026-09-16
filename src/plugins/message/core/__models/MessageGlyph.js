//region MessageGlyph
/**
 * One character of a message, described completely enough to be drawn without the window.
 *
 * RMMZ draws message text straight into `contents`, which turns every glyph into pixels the instant
 * it lands. That is fine for text that never moves and useless for text that does- once the letter
 * is in the bitmap there is no longer a "that letter" to wave, jitter or recolour. So the pipeline
 * stops drawing and starts emitting these instead, and a sprite layer turns them into things that
 * can still be addressed a hundred frames later.
 *
 * Everything the renderer needs is captured here at emit time rather than read back from the window
 * later, because the window's font state has moved on by then: a single line routinely changes size,
 * colour and weight several times, and a glyph asked "what colour am I" after the fact would answer
 * with whatever the last text code set.
 */
class MessageGlyph
{
  /**
   * The character this glyph draws, or empty when this glyph is an icon.
   * @type {string}
   */
  character = String.empty;

  /**
   * The icon this glyph draws, or -1 when this glyph is a character.
   *
   * Icons are glyphs here rather than a second kind of thing, and they have to be. J-Message's
   * database text codes all expand to `\I[n]` followed by a coloured name, so an icon is almost
   * never alone in a line - and an icon that stayed baked into the window's contents while the
   * letters beside it became sprites would sit perfectly still inside a word that waves.
   * @type {number}
   */
  iconIndex = -1;

  /**
   * The horizontal position within the window's contents, in logical pixels.
   * @type {number}
   */
  x = 0;

  /**
   * The vertical position within the window's contents, in logical pixels.
   * @type {number}
   */
  y = 0;

  /**
   * The advance this glyph contributes to the cursor, in logical pixels.
   *
   * Derived from the difference between two prefix measurements rather than from measuring the
   * character alone, so kerning against its neighbour is already accounted for.
   * @type {number}
   */
  width = 0;

  /**
   * The height of the line this glyph sits on.
   *
   * Carried because the engine derives the text baseline from it- {@link Bitmap.drawText} places
   * text at `y + lineHeight / 2 + fontSize * 0.35`, so a glyph handed the same line height its run
   * was measured with reproduces the baseline it would have had.
   * @type {number}
   */
  lineHeight = 0;

  /**
   * The font family this glyph renders in.
   * @type {string}
   */
  fontFace = String.empty;

  /**
   * The font size this glyph renders at.
   * @type {number}
   */
  fontSize = 0;

  /**
   * Whether this glyph renders bold.
   * @type {boolean}
   */
  bold = false;

  /**
   * Whether this glyph renders italic.
   * @type {boolean}
   */
  italic = false;

  /**
   * The colour this glyph renders in, as the CSS string the engine deals in.
   *
   * Not baked into the raster. The glyph is drawn white and tinted to this, which is what allows an
   * effect to recolour it per frame- tinting an already-red glyph toward orange multiplies the two
   * and arrives at neither. It also keeps colour out of the texture cache key, so one raster serves
   * every colour the same character is ever drawn in.
   * @type {string}
   */
  textColor = String.empty;

  /**
   * The colour of the outline stroked around this glyph.
   *
   * This one *is* baked in, because it does not animate and because the engine's default is black-
   * and black survives an arbitrary tint, being unchanged by multiplication. A coloured outline
   * would not, which is worth knowing before anyone sets one.
   * @type {string}
   */
  outlineColor = String.empty;

  /**
   * The width of the outline stroked around this glyph.
   * @type {number}
   */
  outlineWidth = 0;

  /**
   * The effects active on this glyph, by registered name.
   *
   * Already resolved at emit time: the speaker's baseline unioned with whatever spans the author
   * left open. The glyph does not know what any of them mean.
   * @type {string[]}
   */
  effects = [];

  /**
   * This glyph's position in the message, counted across runs and lines.
   *
   * What gives a wave its phase. Counting per-run would restart the wave at every colour change,
   * and counting per-line would restart it at every wrap, so the counter belongs to the message.
   * @type {number}
   */
  index = 0;

  /**
   * Builds one glyph from what it draws and the style in force when it was emitted.
   * @param {string} character The character this glyph draws, or empty for an icon.
   * @param {number} iconIndex The icon this glyph draws, or -1 for a character.
   * @param {number} x The horizontal position within the window's contents.
   * @param {number} y The vertical position within the window's contents.
   * @param {number} width The advance this glyph contributes to the cursor.
   * @param {number} index This glyph's position in the message.
   * @param {MessageGlyphStyle} style The font, colour and effect state in force at emit time.
   */
  constructor(character, iconIndex, x, y, width, index, style)
  {
    this.character = character;
    this.iconIndex = iconIndex;
    this.x = x;
    this.y = y;
    this.width = width;
    this.index = index;

    this.lineHeight = style.lineHeight;
    this.fontFace = style.fontFace;
    this.fontSize = style.fontSize;
    this.bold = style.bold;
    this.italic = style.italic;
    this.textColor = style.textColor;
    this.outlineColor = style.outlineColor;
    this.outlineWidth = style.outlineWidth;
    this.effects = style.effects;
  }

  /**
   * Builds a glyph that draws one character.
   * @param {string} character The character this glyph draws.
   * @param {number} x The horizontal position within the window's contents.
   * @param {number} y The vertical position within the window's contents.
   * @param {number} width The advance this glyph contributes to the cursor.
   * @param {number} index This glyph's position in the message.
   * @param {MessageGlyphStyle} style The font, colour and effect state in force at emit time.
   * @returns {MessageGlyph}
   */
  static forCharacter(character, x, y, width, index, style)
  {
    return new MessageGlyph(character, -1, x, y, width, index, style);
  }

  /**
   * Builds a glyph that draws one icon.
   * @param {number} iconIndex The icon this glyph draws.
   * @param {number} x The horizontal position within the window's contents.
   * @param {number} y The vertical position within the window's contents.
   * @param {number} width The advance this glyph contributes to the cursor.
   * @param {number} index This glyph's position in the message.
   * @param {MessageGlyphStyle} style The font, colour and effect state in force at emit time.
   * @returns {MessageGlyph}
   */
  static forIcon(iconIndex, x, y, width, index, style)
  {
    return new MessageGlyph(String.empty, iconIndex, x, y, width, index, style);
  }

  /**
   * Whether this glyph draws an icon rather than a character.
   * @returns {boolean}
   */
  isIcon()
  {
    return this.iconIndex >= 0;
  }

  /**
   * The key identifying the raster this glyph can share with others.
   *
   * Colour is deliberately absent- the raster is white and tinted afterward, so two glyphs differing
   * only in colour are the same texture. Outline is present because it is baked in.
   * @returns {string}
   */
  rasterKey()
  {
    return [
      this.character,
      this.fontFace,
      this.fontSize,
      this.bold,
      this.italic,
      this.outlineColor,
      this.outlineWidth,
      this.lineHeight,
    ].join('|');
  }
}

export default MessageGlyph;
//endregion MessageGlyph