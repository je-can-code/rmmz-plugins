//region Sprite_BaseText
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
  }

  //region properties
  /**
   * Gets the j.
   * @returns {{_testBitmap: Bitmap, _text: string, _color: string, _alignment: string,
   * _italics: boolean, _bold: boolean, _fontFace: string, _fontSize: number, _minWidth: number,
   * _disableManagedOpacity: boolean}} The j.
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
    // check if a bitmap is already defined.
    if (this.bitmap)
    {
      // clear it if so.
      this.bitmap.clear();
    }

    // generate a new bitmap based on width and height.
    this.bitmap = new Bitmap(this.bitmapWidth(), this.bitmapHeight());

    // setup the bitmap with the current configuration.
    this.configureBitmap();
  }

  /**
   * Configures the bitmap with the current settings and configuration.
   */
  configureBitmap()
  {
    this.bitmap.clear();
    this.bitmap = new Bitmap(this.bitmapWidth(), this.bitmapHeight());
    this.bitmap.fontFace = this.fontFace();
    this.bitmap.fontSize = this.fontSize();
    this.bitmap.fontBold = this.isBold();
    this.bitmap.fontItalic = this.isItalics();
    this.bitmap.textColor = this.color();

    this.bitmap.outlineColor = '#000000'; // or a theme color
    this.bitmap.outlineWidth = Math.max(2, Math.floor(this.fontSize() / 6));
  }

  /**
   * Refresh the content of this sprite.
   * This completely reloads the sprite's bitmap and redraws the text.
   */
  refresh()
  {
    // check if we are missing a bitmap somehow.
    if (!this.bitmap)
    {
      // load the bitmap if so.
      this.loadBitmap();
    }
    else
    {
      // configure the bitmap based on current settings.
      this.configureBitmap();
    }

    // render the text onto the bitmap.
    this.renderText();
  }

  /**
   * The width of this bitmap.
   * Uses the bitmap measuring of text based on the current configuration.
   * @returns {number}
   */
  bitmapWidth()
  {
    // setup the test bitmap similar to the real one.
    this.j()._testBitmap = new Bitmap(this.bitmap ? this.bitmap.width : 128, this.bitmapHeight());
    this.j()._testBitmap.fontFace = this.fontFace();
    this.j()._testBitmap.fontSize = this.fontSize();
    this.j()._testBitmap.fontItalic = this.isItalics();
    this.j()._testBitmap.fontBold = this.isBold();

    // measure the text and respect a configured minimum width, if any.
    const measured = this.j()._testBitmap.measureTextWidth(this.text());
    const min = this.j()._minWidth;
    return Math.max(measured, min);
  }

  /**
   * The height of this bitmap.
   * This defaults to roughly 3 pixels per size of font.
   * @returns {number}
   */
  bitmapHeight()
  {
    return this.j()._fontSize * 3;
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
      console.error(`Attempted to assign ${color} as a hex color to this text sprite:`, this);
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
    // always draw using the bitmap’s own width so alignment behaves predictably.
    const drawWidth = this.bitmap
      ? this.bitmap.width
      : this.bitmapWidth();

    // draw the text with the current settings onto the bitmap.
    this.bitmap.drawText(this.text(), 0, 0, drawWidth, this.bitmapHeight(), this.alignment());
  }
}

export default Sprite_BaseText;
//endregion Sprite_BaseText