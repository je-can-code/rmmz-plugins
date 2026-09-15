//region Sprite_MessageGlyph
import MessageGlyphModulation from '../__models/MessageGlyphModulation.js';
import MessageTintResolver from '../services/MessageTintResolver.js';

/**
 * One character of a message, drawn as something that can still be moved after it is drawn.
 *
 * The engine's own message text goes straight into the window's `contents` bitmap, where it stops
 * being letters and becomes pixels. That is why nothing in vanilla can wave a word: there is no
 * word there any more. A sprite per glyph costs more than a single bitmap and buys the only thing
 * worth buying here, which is that the letter is still an object on frame two hundred.
 *
 * **The raster is white and the colour arrives as a tint.** Painting the glyph its real colour
 * would be simpler and would make colour cycling impossible - a tint multiplies, so a glyph already
 * red can be dimmed but never turned green. Drawing white and multiplying by the real colour lands
 * in exactly the same place for static text, and leaves the colour free to animate. It also means
 * two glyphs that differ only in colour are the same picture, which is what makes the cache below
 * worth having at all.
 *
 * Rasters are shared across every glyph in the game and deliberately never expire. Dialogue reuses
 * a very small alphabet in a very small number of styles, so the cache stops growing within the
 * first few messages and every message after that is pure lookup.
 */
class Sprite_MessageGlyph
  extends Sprite
{
  /**
   * The colour every glyph is rasterized in, before its real colour is applied as a tint.
   * @type {string}
   */
  static RasterColor = '#ffffff';

  /**
   * The tint that leaves artwork exactly as it was drawn.
   * @type {number}
   */
  static IconTint = 0xffffff;

  /**
   * Every glyph picture built so far, by the key describing what makes it distinct.
   * @type {Map<string, Bitmap>}
   */
  static #rasters = new Map();

  /**
   * The one bitmap used to measure text, shared by every glyph ever drawn.
   *
   * Measuring needs a canvas context and nothing else, so a single pixel of one is enough. Giving
   * each sprite its own measuring bitmap is the trap {@link Sprite_BaseText} falls into - that is a
   * whole canvas element per instance, which is fine for one label above a character's head and
   * ruinous at ninety per page of dialogue.
   * @type {Bitmap|null}
   */
  static #measuringBitmap = null;

  /**
   * Measures a character at a given style, in logical pixels.
   *
   * The measuring bitmap is deliberately never device-scaled: `measureText` ignores the context
   * transform, so the answer is in logical pixels either way, and scaling it would only make the
   * shared canvas larger for no gain.
   * @param {MessageGlyph} glyph The glyph whose character and style to measure.
   * @returns {number}
   */
  static measure(glyph)
  {
    Sprite_MessageGlyph.#measuringBitmap ||= new Bitmap(1, 1);

    const measuring = Sprite_MessageGlyph.#measuringBitmap;
    measuring.fontFace = glyph.fontFace;
    measuring.fontSize = glyph.fontSize;
    measuring.fontBold = glyph.bold;
    measuring.fontItalic = glyph.italic;

    return measuring.measureTextWidth(glyph.character);
  }

  /**
   * The picture for a glyph, built once and shared from then on.
   * @param {MessageGlyph} glyph The glyph to draw.
   * @returns {Bitmap}
   */
  static rasterFor(glyph)
  {
    const key = glyph.rasterKey();

    const cached = Sprite_MessageGlyph.#rasters.get(key);
    if (cached !== undefined) return cached;

    const raster = Sprite_MessageGlyph.buildRaster(glyph);
    Sprite_MessageGlyph.#rasters.set(key, raster);

    return raster;
  }

  /**
   * Draws one glyph onto a bitmap of its own.
   *
   * Every measurement comes from {@link TextRasterMetrics}, which exists because canvas text
   * rasterization has three separate ways of quietly ruining a glyph - condensing it to fit a
   * fractional width, shaving the outline off at the edge, and landing the whole thing on a half
   * pixel. The outline width and colour, though, are taken from the glyph rather than from that
   * class: they describe what the window was already drawing, and the point of this pipeline is to
   * render what the engine rendered, not an improvement on it.
   * @param {MessageGlyph} glyph The glyph to draw.
   * @returns {Bitmap}
   */
  static buildRaster(glyph)
  {
    const measuredWidth = Sprite_MessageGlyph.measure(glyph);
    const textWidth = TextRasterMetrics.textWidth(measuredWidth);
    const padding = TextRasterMetrics.padding(glyph.outlineWidth);
    const canvasWidth = TextRasterMetrics.canvasWidth(textWidth, padding);
    const canvasHeight = TextRasterMetrics.canvasHeight(glyph.fontSize);

    const raster = new Bitmap(canvasWidth, canvasHeight);

    // resizing a canvas clears it, so the scale has to be established before anything is drawn.
    raster.applyDeviceScale(Graphics.deviceScale);

    raster.fontFace = glyph.fontFace;
    raster.fontSize = glyph.fontSize;
    raster.fontBold = glyph.bold;
    raster.fontItalic = glyph.italic;
    raster.textColor = Sprite_MessageGlyph.RasterColor;
    raster.outlineColor = glyph.outlineColor;
    raster.outlineWidth = glyph.outlineWidth;

    // the same line height the window measured with, so the engine's own baseline sum - half the
    // line plus a fraction of the font size - lands the glyph exactly where contents would have.
    raster.drawText(glyph.character, padding, 0, textWidth, glyph.lineHeight, 'left');

    return raster;
  }

  /**
   * Extend initialization to draw the glyph this sprite represents.
   * @param {MessageGlyph} glyph The glyph to draw.
   */
  initialize(glyph)
  {
    // perform original logic.
    super.initialize();

    this.initMembers();

    this.setGlyph(glyph);
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
     * The glyph this sprite draws.
     * @type {MessageGlyph|null}
     */
    this._j._glyph = null;

    /**
     * How far the raster's transparent margin pushes the glyph right of the sprite's origin.
     * @type {number}
     */
    this._j._rasterPadding = 0;
  }

  /**
   * The glyph this sprite draws.
   * @returns {MessageGlyph}
   */
  glyph()
  {
    return this._j._glyph;
  }

  /**
   * How far the raster's transparent margin pushes the glyph right of this sprite's origin.
   * @returns {number}
   */
  rasterPadding()
  {
    return this._j._rasterPadding;
  }

  /**
   * Sets how far the raster's transparent margin pushes the glyph right of this sprite's origin.
   * @param {number} padding The margin reserved on the left of the raster.
   */
  setRasterPadding(padding)
  {
    this._j._rasterPadding = padding;
  }

  /**
   * How many icons sit in one row of the icon sheet.
   * @type {number}
   */
  static IconsPerRow = 16;

  /**
   * Binds this sprite to a glyph and draws it at rest.
   * @param {MessageGlyph} glyph The glyph to draw.
   */
  setGlyph(glyph)
  {
    this._j._glyph = glyph;

    if (glyph.isIcon() === true)
    {
      this.setupIcon(glyph);
    }
    else
    {
      this.setupCharacter(glyph);
    }

    this.settle();
  }

  /**
   * Draws this sprite as one character, from the shared raster cache.
   * @param {MessageGlyph} glyph The glyph to draw.
   */
  setupCharacter(glyph)
  {
    // the raster reserved a transparent margin for the outline, and the sprite's origin sits at the
    // left edge of that margin rather than at the left edge of the ink.
    this.setRasterPadding(TextRasterMetrics.padding(glyph.outlineWidth));

    this.bitmap = Sprite_MessageGlyph.rasterFor(glyph);
  }

  /**
   * Draws this sprite as one icon, copied out of the shared icon sheet into a bitmap of its own.
   *
   * Pointing the sprite at the sheet and framing a region of it looks cheaper and does not work
   * here: the frame is correct, the texture is ready, and nothing renders - the glyph plane draws
   * every other sprite from a bitmap it owns outright, and a sprite sharing a base texture with the
   * rest of the game does not survive the trip. Copying thirty-two pixels square into a private
   * bitmap sidesteps the question entirely, makes an icon behave exactly like a character all the
   * way down, and is what the engine's own `drawIcon` does anyway.
   *
   * The copy is cached like any other glyph raster, so an icon is only ever copied once however
   * many times a message mentions it.
   * @param {MessageGlyph} glyph The glyph to draw.
   */
  setupIcon(glyph)
  {
    // an icon carries its own edges; there is no outline margin to sit left of.
    this.setRasterPadding(0);

    this.bitmap = Sprite_MessageGlyph.iconRasterFor(glyph.iconIndex);
  }

  /**
   * The private copy of one icon, built once and shared from then on.
   * @param {number} iconIndex The icon to copy.
   * @returns {Bitmap}
   */
  static iconRasterFor(iconIndex)
  {
    const key = `icon:${iconIndex}`;

    const cached = Sprite_MessageGlyph.#rasters.get(key);
    if (cached !== undefined) return cached;

    const raster = Sprite_MessageGlyph.buildIconRaster(iconIndex);
    Sprite_MessageGlyph.#rasters.set(key, raster);

    return raster;
  }

  /**
   * Copies one icon out of the sheet onto a bitmap of its own.
   * @param {number} iconIndex The icon to copy.
   * @returns {Bitmap}
   */
  static buildIconRaster(iconIndex)
  {
    const {
      iconWidth,
      iconHeight
    } = ImageManager;
    const sourceX = (iconIndex % Sprite_MessageGlyph.IconsPerRow) * iconWidth;
    const sourceY = Math.floor(iconIndex / Sprite_MessageGlyph.IconsPerRow) * iconHeight;

    const raster = new Bitmap(iconWidth, iconHeight);
    const iconSheet = ImageManager.loadSystem('IconSet');

    // the sheet arrives asynchronously, and a copy taken before it lands copies nothing - which
    // would then be cached, leaving a blank square wherever that icon is ever mentioned again. The
    // listener fires immediately once the sheet is in memory, so this costs nothing after the first
    // message of a session and is the difference between icons and no icons during it.
    iconSheet.addLoadListener(
      () => raster.blt(iconSheet, sourceX, sourceY, iconWidth, iconHeight, 0, 0));

    return raster;
  }

  /**
   * The colour this sprite shows when nothing is acting on it.
   *
   * A character is rasterized white and owes its whole appearance to this. An icon is finished
   * artwork that arrives already coloured, so it is left alone - tinting it by the surrounding text
   * colour would repaint the art every time a name beside it changed colour.
   * @returns {number}
   */
  restingTint()
  {
    const glyph = this.glyph();

    if (glyph.isIcon() === true) return Sprite_MessageGlyph.IconTint;

    return MessageTintResolver.fromCssColor(glyph.textColor);
  }

  /**
   * Places this sprite where the engine would have drawn its glyph, with nothing acting on it.
   */
  settle()
  {
    const modulation = MessageGlyphModulation.none();

    this.applyModulation(modulation);
  }

  /**
   * Places this sprite for one frame, with whatever is currently acting on it.
   * @param {MessageGlyphModulation} modulation This frame's displacement and colour.
   */
  applyModulation(modulation)
  {
    const glyph = this.glyph();
    const scale = Graphics.deviceScale;

    // the glyph's own coordinate is where its ink starts; the sprite's origin sits a margin to the
    // left of that, because the raster reserved room there for the outline.
    const restingX = glyph.x - this.rasterPadding();

    this.scale.set(modulation.scale, modulation.scale);

    // a sprite grows down and to the right of its origin, so a glyph left where it was would drift
    // into its neighbour as it swelled. Pulling back by half the growth keeps it centred on the box
    // the line was measured with, which is the only place it can grow from without moving.
    // measured off the bitmap rather than off the sprite, because a sprite's own width already has
    // the scale applied to it and would compensate for its own compensation.
    const growth = modulation.scale - 1;
    const growthX = this.bitmap.width * growth / 2;
    const growthY = this.bitmap.height * growth / 2;

    this.x = TextRasterMetrics.snap(restingX + modulation.offsetX - growthX, scale);
    this.y = TextRasterMetrics.snap(glyph.y + modulation.offsetY - growthY, scale);

    // an effect with no colour opinion leaves the glyph whatever colour it already had.
    if (modulation.tint === null)
    {
      this.tint = this.restingTint();
      return;
    }

    this.tint = modulation.tint;
  }
}

export default Sprite_MessageGlyph;
//endregion Sprite_MessageGlyph