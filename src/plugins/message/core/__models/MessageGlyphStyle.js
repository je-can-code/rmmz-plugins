//region MessageGlyphStyle
/**
 * The font, colour and effect state in force at the moment a run of text was flushed.
 *
 * A snapshot rather than a reference, and that distinction is the whole point of the class. The
 * window's `contents` carries exactly one font state at a time, and a single line of dialogue
 * routinely changes it several times- `\C[2]` here, `\*` there, `\FS[18]` for an aside. A glyph
 * that asked the window what colour it was after the fact would be told whatever the *last* code
 * set, so the state is copied out while it is still true and travels with the glyphs it describes.
 *
 * It is built once per flush, not once per glyph: a run only ever ends at a control character, and
 * every code that could change any of this is a control character, so every glyph within one run
 * necessarily shares one style. That is what makes emitting per-glyph cheap.
 */
class MessageGlyphStyle
{
  /**
   * The height of the line these glyphs sit on.
   * @type {number}
   */
  lineHeight = 0;

  /**
   * The font family in force.
   * @type {string}
   */
  fontFace = String.empty;

  /**
   * The font size in force.
   * @type {number}
   */
  fontSize = 0;

  /**
   * Whether bold is in force.
   * @type {boolean}
   */
  bold = false;

  /**
   * Whether italics are in force.
   * @type {boolean}
   */
  italic = false;

  /**
   * The text colour in force, as the CSS string the engine deals in.
   * @type {string}
   */
  textColor = String.empty;

  /**
   * The outline colour in force.
   * @type {string}
   */
  outlineColor = String.empty;

  /**
   * The outline width in force.
   * @type {number}
   */
  outlineWidth = 0;

  /**
   * The effects active on these glyphs, by registered name.
   * @type {string[]}
   */
  effects = [];

  /**
   * Builds a style snapshot.
   * @param {number} lineHeight The height of the line these glyphs sit on.
   * @param {string} fontFace The font family in force.
   * @param {number} fontSize The font size in force.
   * @param {boolean} bold Whether bold is in force.
   * @param {boolean} italic Whether italics are in force.
   * @param {string} textColor The text colour in force.
   * @param {string} outlineColor The outline colour in force.
   * @param {number} outlineWidth The outline width in force.
   * @param {string[]} effects The effects active on these glyphs.
   */
  constructor(lineHeight, fontFace, fontSize, bold, italic, textColor, outlineColor, outlineWidth, effects)
  {
    this.lineHeight = lineHeight;
    this.fontFace = fontFace;
    this.fontSize = fontSize;
    this.bold = bold;
    this.italic = italic;
    this.textColor = textColor;
    this.outlineColor = outlineColor;
    this.outlineWidth = outlineWidth;
    this.effects = effects;
  }

  /**
   * Snapshots the live font state off a window's contents bitmap.
   *
   * The one place that reads `contents` directly, so that nothing downstream has to. Effects and
   * line height do not live on the bitmap- they belong to the message and the line respectively-
   * and are handed in.
   * @param {Bitmap} contents The bitmap the window draws its text into.
   * @param {number} lineHeight The height of the line being flushed.
   * @param {string[]} effects The effects active on this run.
   * @returns {MessageGlyphStyle}
   */
  static fromContents(contents, lineHeight, effects)
  {
    return new MessageGlyphStyle(
      lineHeight,
      contents.fontFace,
      contents.fontSize,
      contents.fontBold,
      contents.fontItalic,
      contents.textColor,
      contents.outlineColor,
      contents.outlineWidth,
      effects);
  }
}

export default MessageGlyphStyle;
//endregion MessageGlyphStyle