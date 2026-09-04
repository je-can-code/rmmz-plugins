//region Sprite_BaseText
import Diagnostics from './../core/Diagnostics.js';
import TextRasterMetrics from './../core/TextRasterMetrics.js';

/**
 * A sprite that displays some text.
 * This acts as a base class for a number of other text-based sprites.
 */
class Sprite_BaseText
  extends Sprite
{
  /**
   * The available supported text alignments.
   */
  static Alignments = {
    Left: 'left',
    Center: 'center',
    Right: 'right',
  };

  /**
   * Extend initialization of the sprite to draw the text.
   * @param {string} text The text content for this sprite.
   */
  initialize(text = String.empty)
  {
    // perform original logic.
    super.initialize();

    // initialize our properties.
    this.initMembers();

    // set the text of the sprite.
    this.setText(text);
  }

  /**
   * Initialize all properties of this class.
   */
  initMembers()
  {
    /**
     * The shared root namespace for all of J's plugin data.
     */
    this._j ||= {};

    /**
     * A test bitmap for measuring text width upon.
     * @type {Bitmap}
     */
    this._j._testBitmap = new Bitmap(512, 128);

    /**
     * The text to render in this sprite.
     * @type {string}
     */
    this._j._text = String.empty;

    /**
     * The text color index of this sprite.
     * This should be a hexcode.
     * @type {string}
     */
    this._j._color = '#ffffff';

    /**
     * The alignment of text in this sprite.
     * @type {Sprite_BaseText.Alignments}
     */
    this._j._alignment = Sprite_BaseText.Alignments.Left;

    /**
     * Whether or not the text should be italics.
     * @type {boolean}
     */
    this._j._italics = false;

    /**
     * Whether or not the text should be bolded.
     * @type {boolean}
     */
    this._j._bold = false;

    /**
     * The font face of the text in this sprite.
     * @type {string}
     */
    this._j._fontFace = $gameSystem.mainFontFace();

    /**
     * The font size of the text in this sprite.
     * @type {number}
     */
    this._j._fontSize = $gameSystem.mainFontSize();

    /**
     * The minimum width of the text.
     * @type {number}
     */
    this._j._minWidth = 0;

    /**
     * Some systems that leverage {@link Sprite_BaseText} may have automation to manage the opacity of their text.
     * Setting this flag to true will disable that automation and allow you to manage the opacity yourself.
     * @type {boolean}
     */
    this._j._disableManagedOpacity = false;

    /**
     * The transparent margin reserved on each side of the text for its outline.
     * Established by {@link #configureBitmap} and consumed by {@link #renderText}.
     * @type {number}
     */
    this._j._padding = 0;

    /**
     * The width of the area the text is drawn into.
     * This is the bitmap's width less the padding on both sides.
     * @type {number}
     */
    this._j._textWidth = 0;
  }

  //region properties
  /**
   * Gets the j.
   * @returns {{_testBitmap: Bitmap, _text: string, _color: string, _alignment: string,
   * _italics: boolean, _bold: boolean, _fontFace: string, _fontSize: number, _minWidth: number,
   * _disableManagedOpacity: boolean, _padding: number, _textWidth: number}} The j.
   */
  j()
  {
    // hand back the j.
    return this._j;
  }
  //endregion properties

  /**
   * Sets up the bitmap based on the desired text content.
   */
  loadBitmap()
  {
    // building the bitmap and configuring it are the same act; the configuration decides the size.
    this.configureBitmap();
  }

  /**
   * Builds this sprite's bitmap and configures it to draw text.
   *
   * Every measurement here is a logical pixel, exactly as it was before any of this cared about
   * display resolution. The bitmap is then handed to {@link Bitmap.applyDeviceScale}, which is the
   * one place in the codebase that knows how many real pixels sit behind a logical one - it grows
   * the canvas and scales the drawing context so that everything below keeps speaking logically and
   * simply rasterizes into more pixels.
   *
   * Doing it that way rather than measuring in device pixels here is not a style preference. A
   * bitmap reports its logical size through `width` and `height`, and callers position things
   * against those - the tier stripe beside a nameplate centres itself on the text's height. A sprite
   * that sized its own bitmap in device pixels would have those callers reading a number half again
   * too large, which is a misalignment nobody would think to trace back to a font.
   */
  configureBitmap()
  {
    const outlineWidth = TextRasterMetrics.outlineWidth(this.fontSize());
    const padding = TextRasterMetrics.padding(outlineWidth);

    // a caller may demand more room than the glyphs actually need.
    const naturalWidth = this.measureTextWidth();
    const textWidth = TextRasterMetrics.textWidth(Math.max(naturalWidth, this.minWidth()));

    // the renderer needs both of these to know where its text area starts and how wide it runs.
    this.setPadding(padding);
    this.setTextAreaWidth(textWidth);

    // build the canvas at the size this sprite occupies, outline margins included.
    const canvasWidth = TextRasterMetrics.canvasWidth(textWidth, padding);
    const canvasHeight = TextRasterMetrics.canvasHeight(this.fontSize());
    this.bitmap = new Bitmap(canvasWidth, canvasHeight);

    // and put the display's real pixels behind that area without changing what it reports.
    this.bitmap.applyDeviceScale(Graphics.deviceScale);

    // configure the canvas to draw the text itself.
    this.bitmap.fontFace = this.fontFace();
    this.bitmap.fontSize = this.fontSize();
    this.bitmap.fontBold = this.isBold();
    this.bitmap.fontItalic = this.isItalics();
    this.bitmap.textColor = this.color();
    this.bitmap.outlineColor = '#000000';
    this.bitmap.outlineWidth = outlineWidth;
  }

  /**
   * Refresh the content of this sprite.
   * This completely reloads the sprite's bitmap and redraws the text.
   */
  refresh()
  {
    // the bitmap's size depends on the text it is about to hold, so it is rebuilt rather than reused.
    this.configureBitmap();

    // render the text onto the bitmap.
    this.renderText();
  }

  /**
   * The natural width of this sprite's text at its current configuration.
   *
   * Measured against a scratch canvas rather than the real one because the real one does not exist
   * yet at the point this is needed - its width is what this measurement decides.
   * @returns {number}
   */
  measureTextWidth()
  {
    // the scratch bitmap exists only to hold a configured canvas context to measure against.
    const testBitmap = this.j()._testBitmap;
    testBitmap.fontFace = this.fontFace();
    testBitmap.fontSize = this.fontSize();
    testBitmap.fontItalic = this.isItalics();
    testBitmap.fontBold = this.isBold();

    return testBitmap.measureTextWidth(this.text());
  }

  /**
   * The width this sprite occupies on screen.
   *
   * The bitmap behind it may hold considerably more pixels than this on a scaled display, and
   * deliberately does not say so - this is the size a caller laying the sprite out reasons about.
   * @returns {number}
   */
  bitmapWidth()
  {
    return this.bitmap.width;
  }

  /**
   * The height this sprite occupies on screen.
   * @returns {number}
   */
  bitmapHeight()
  {
    return this.bitmap.height;
  }

  /**
   * The text currently assigned to this sprite.
   * @returns {string|String.empty}
   */
  text()
  {
    return this.j()._text;
  }

  /**
   * Assigns text to this sprite.
   * If the text has changed, it reloads the bitmap.
   * @param {string} text The text to assign to this sprite.
   * @returns {this} Returns `this` for fluent-chaining.
   */
  setText(text)
  {
    // check if the text has changed.
    if (this.text() !== text)
    {
      // assign the new text.
      this.j()._text = text;

      // render the text to the bitmap.
      this.refresh();
    }

    // return this for chaining if desired.
    return this;
  }

  /**
   * Gets the current color assigned to this sprite's text.
   * @returns {string}
   */
  color()
  {
    return this.j()._color;
  }

  /**
   * Sets the color of this sprite's text.
   * This should be a hexcode.
   * @param {string} color The hex color for this text.
   * @returns {this} Returns `this` for fluent-chaining.
   */
  setColor(color)
  {
    // if we do not have a valid hex color, then do not assign it.
    if (!this.isValidColor(color)) return;

    if (this.color() !== color)
    {
      this.j()._color = color;
      this.refresh();
    }

    // return this for chaining if desired.
    return this;
  }

  /**
   * Validates the color to ensure it is a hex color.
   * @param {string} color The color to validate.
   * @returns {boolean} True if the hex color is valid, false otherwise.
   */
  isValidColor(color)
  {
    // use regex to validate the hex color.
    const structure = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const isHexColor = structure.test(color);

    // check if we failed the validation.
    if (!isHexColor)
    {
      // and warn the user.
      Diagnostics.error(__PLUGIN_NAME__, `attempted to assign ${color} as a hex color to this text sprite.`, this);
    }

    // return the result.
    return isHexColor;
  }

  /**
   * Gets the text alignment for this text sprite.
   * @returns {Sprite_BaseText.Alignments}
   */
  alignment()
  {
    return this.j()._alignment;
  }

  /**
   * Sets the alignment of this sprite's text.
   * The alignment set must be one of the three valid options.
   * @param {Sprite_BaseText.Alignments} alignment The alignment to set.
   * @returns {this} Returns `this` for fluent-chaining.
   */
  setAlignment(alignment)
  {
    // if we do not have a valid alignment, then do not assign it.
    if (!this.isValidAlignment(alignment)) return;

    if (this.alignment() !== alignment)
    {
      this.j()._alignment = alignment;
      this.refresh();
    }

    // return this for chaining if desired.
    return this;
  }

  /**
   * Validates the alignment to ensure it is a valid alignment.
   * @param {string} alignment The alignment to validate.
   * @returns {boolean} True if the alignment is valid, false otherwise.
   */
  isValidAlignment(alignment)
  {
    const validAlignments = [
      Sprite_BaseText.Alignments.Left, Sprite_BaseText.Alignments.Center, Sprite_BaseText.Alignments.Right
    ];

    return validAlignments.includes(alignment);
  }

  /**
   * Gets whether or not this sprite's text is bold.
   * @returns {boolean}
   */
  isBold()
  {
    return this.j()._bold;
  }

  /**
   * Sets the bold for this sprite's text.
   * @param {boolean} bold True if we're using bold, false otherwise.
   * @returns {this} Returns `this` for fluent-chaining.
   */
  setBold(bold)
  {
    if (this.isBold() !== bold)
    {
      this.j()._bold = bold;
      this.refresh();
    }

    // return this for chaining if desired.
    return this;
  }

  /**
   * Gets whether or not this sprite's text is italics.
   * @returns {boolean}
   */
  isItalics()
  {
    return this.j()._italics;
  }

  /**
   * Sets the italics for this sprite's text.
   * @param {boolean} italics True if we're using italics, false otherwise.
   * @returns {this} Returns `this` for fluent-chaining.
   */
  setItalics(italics)
  {
    if (this.isItalics() !== italics)
    {
      this.j()._italics = italics;
      this.refresh();
    }

    // return this for chaining if desired.
    return this;
  }

  /**
   * Gets the current font face name.
   * @returns {string}
   */
  fontFace()
  {
    return this.j()._fontFace;
  }

  /**
   * Sets the font face to the designated font.
   * This will not work if you set it to a font that you don't have
   * in the `/font` folder.
   * @param {string} fontFace The precise name of the font to change the text to.
   * @returns {this} Returns `this` for fluent-chaining.
   */
  setFontFace(fontFace)
  {
    if (this.fontFace() !== fontFace)
    {
      this.j()._fontFace = fontFace;
      this.refresh();
    }

    // return this for chaining if desired.
    return this;
  }

  /**
   * Gets the current font size.
   * @returns {number}
   */
  fontSize()
  {
    return this.j()._fontSize;
  }

  /**
   * Sets the font size to the designated number.
   * @param {number} fontSize The size of the font.
   * @returns {this} Returns `this` for fluent-chaining.
   */
  setFontSize(fontSize)
  {
    if (this.fontSize() !== fontSize)
    {
      this.j()._fontSize = fontSize;
      this.refresh();
    }

    // return this for chaining if desired.
    return this;
  }

  /**
   * Gets the minimum width for the text box.
   * @returns {number}
   */
  minWidth()
  {
    return this.j()._minWidth;
  }

  /**
   * Sets a minimum width for the text box. Useful to make center/right alignment visible.
   * @param {number} width The minimum pixel width of this sprite’s bitmap.
   * @returns {this}
   */
  setMinWidth(width)
  {
    // guard to make sure the width isn't being set to something negative.
    const w = Math.max(0, width);

    if (this.j()._minWidth !== w)
    {
      this.j()._minWidth = w;
      this.refresh();
    }

    // return this for chaining if desired.
    return this;
  }

  /**
   * The transparent margin reserved on each side of the text for its outline.
   * @returns {number}
   */
  padding()
  {
    return this.j()._padding;
  }

  /**
   * Sets the margin reserved on each side of the text for its outline.
   * @param {number} padding The margin reserved on each side.
   * @returns {this} Returns `this` for fluent-chaining.
   */
  setPadding(padding)
  {
    this.j()._padding = padding;

    // return this for chaining if desired.
    return this;
  }

  /**
   * The width of the area the text is drawn into.
   * @returns {number}
   */
  textAreaWidth()
  {
    return this.j()._textWidth;
  }

  /**
   * Sets the width of the area the text is drawn into.
   * @param {number} width The width of the text area.
   * @returns {this} Returns `this` for fluent-chaining.
   */
  setTextAreaWidth(width)
  {
    this.j()._textWidth = width;

    // return this for chaining if desired.
    return this;
  }

  /**
   * Flags this sprite to disable the managed opacity automation.
   */
  selfManageOpacity()
  {
    this.j()._disableManagedOpacity = true;
  }

  /**
   * Unflags this sprite to enable the managed opacity automation.
   */
  autoManageOpacity()
  {
    this.j()._disableManagedOpacity = false;
  }

  /**
   * Checks whether or not this sprite is flagged for self-managed opacity.
   * @returns {boolean}
   */
  hasSelfManagedOpacity()
  {
    return this.j()._disableManagedOpacity;
  }

  /**
   * Renders the text of this sprite.
   */
  renderText()
  {
    // the text area begins inside the margin reserved for the outline, so the leading glyph's stroke
    // has somewhere to land instead of being shaved off against the edge of the bitmap.
    const originX = this.padding();

    // the width promised to the canvas is never less than what the glyphs need, which is the whole
    // reason the canvas does not condense them to fit it.
    const drawWidth = this.textAreaWidth();

    // draw the text with the current settings onto the bitmap.
    this.bitmap.drawText(this.text(), originX, 0, drawWidth, this.bitmap.height, this.alignment());
  }
}

export default Sprite_BaseText;
//endregion Sprite_BaseText