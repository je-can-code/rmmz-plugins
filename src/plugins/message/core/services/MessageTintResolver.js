//region MessageTintResolver
/**
 * Converts the colours the engine speaks into the numbers PIXI tints with.
 *
 * Two different vocabularies meet here. RMMZ describes a text colour as a CSS string, because that
 * is what a canvas context wants - `ColorManager.textColor` reads its answer out of the windowskin
 * with {@link Bitmap.getPixel}, which builds a `#rrggbb` string one hex byte at a time. A PIXI
 * sprite's `tint`, meanwhile, is a single integer. Nothing in either library converts between them,
 * so the conversion lives here rather than being retyped at every call site that needs it.
 *
 * The reason any of this is necessary is that glyphs are rasterized white and coloured by tint
 * afterward. Baking the colour into the raster would be simpler and would make `\=` impossible:
 * tint multiplies, so a glyph already painted red can be darkened but never turned orange.
 */
class MessageTintResolver
{
  /**
   * Degrees in a full turn of hue.
   * @type {number}
   */
  static HueTurn = 360;

  /**
   * Converts one of the engine's CSS colour strings into a PIXI tint.
   *
   * The string is always `#rrggbb`: every text colour in a message arrives from
   * `ColorManager.textColor`, which reads a windowskin pixel and formats it that way. No other
   * shape is reachable from the message pipeline, so no other shape is interpreted here - a colour
   * that somehow arrived as something else should surface as a visibly wrong glyph rather than be
   * quietly coerced into a plausible one.
   * @param {string} cssColor The colour as `#rrggbb`.
   * @returns {number} The same colour as the integer PIXI tints with.
   */
  static fromCssColor(cssColor)
  {
    // drop the leading '#'; what remains is three hex bytes in the order PIXI already expects.
    const hexDigits = cssColor.slice(1);

    return parseInt(hexDigits, 16);
  }

  /**
   * Converts a hue into a fully saturated PIXI tint.
   *
   * Hue rather than an index into the windowskin palette, because the palette is sixteen discrete
   * swatches chosen for legibility and stepping through them reads as flashing rather than
   * cycling. A continuous hue is what makes the motion look deliberate.
   * @param {number} hue The hue in degrees; values outside a single turn wrap.
   * @returns {number} The colour as the integer PIXI tints with.
   */
  static fromHue(hue)
  {
    // javascript's remainder keeps the sign of its left operand, so a negative hue needs a second
    // turn added before it lands inside one.
    const turn = MessageTintResolver.HueTurn;
    const wrappedHue = ((hue % turn) + turn) % turn;

    const [ red, green, blue ] = MessageTintResolver.hueToChannels(wrappedHue);

    return MessageTintResolver.fromChannels(red, green, blue);
  }

  /**
   * Resolves a hue into its three colour channels, each from zero to one.
   *
   * This is the standard HSL conversion narrowed to the one case we use: full saturation at half
   * lightness, where the chroma is exactly one and the black offset exactly zero. Written out as a
   * sector table rather than derived, because the six cases each name a recognisable third of the
   * colour wheel and a reader can check any one of them against a colour picker.
   * @param {number} hue The hue in degrees, already wrapped into a single turn.
   * @returns {number[]} The red, green and blue channels, each from zero to one.
   */
  static hueToChannels(hue)
  {
    // which sixth of the wheel the hue falls in, and how far through that sixth it has travelled.
    const position = hue / 60;
    const sector = Math.floor(position);
    const progress = position - sector;

    // the channel that is neither fully on nor fully off, ramping across this sector.
    const ramp = (sector % 2 === 0)
      ? progress
      : 1 - progress;

    switch (sector)
    {
      case 0:
        return [ 1, ramp, 0 ];
      case 1:
        return [ ramp, 1, 0 ];
      case 2:
        return [ 0, 1, ramp ];
      case 3:
        return [ 0, ramp, 1 ];
      case 4:
        return [ ramp, 0, 1 ];
      default:
        return [ 1, 0, ramp ];
    }
  }

  /**
   * Packs three zero-to-one colour channels into a single tint.
   * @param {number} red The red channel, from zero to one.
   * @param {number} green The green channel, from zero to one.
   * @param {number} blue The blue channel, from zero to one.
   * @returns {number}
   */
  static fromChannels(red, green, blue)
  {
    const redByte = Math.round(red * 255);
    const greenByte = Math.round(green * 255);
    const blueByte = Math.round(blue * 255);

    return (redByte << 16) + (greenByte << 8) + blueByte;
  }
}

export default MessageTintResolver;
//endregion MessageTintResolver