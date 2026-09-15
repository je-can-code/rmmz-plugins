//region LightingColor
/**
 * Turns the hex colours an author writes into the shapes the renderer and the composer need.
 *
 * Authors write colours the way a colour picker hands them over - `#ffbb73` - and three different
 * consumers want three different things from that string. Keeping the conversions in one place means
 * a malformed hex is judged once, by one rule, rather than being separately tolerated by whichever
 * consumer happens to see it first.
 */
class LightingColor
{
  /**
   * The shape a colour must have to be usable: a hash and either three or six hex digits.
   * @type {RegExp}
   */
  static HEX_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

  /**
   * Determines whether a string is a colour this plugin can actually use.
   * @param {string} hex The string to judge.
   * @returns {boolean}
   */
  static isValidHex(hex)
  {
    // a colour is only a colour if it matches the shape exactly, anchored at both ends.
    return LightingColor.HEX_PATTERN.test(hex);
  }

  /**
   * Splits a hex colour into its red, green and blue channels.
   *
   * Shorthand is expanded rather than rejected, because `#fff` is something an author will
   * reasonably write and refusing it would be a papercut with no upside.
   * @param {string} hex A colour that has already passed {@link isValidHex}.
   * @returns {number[]} The colour as `[r, g, b]`, each 0 through 255.
   */
  static toRgb(hex)
  {
    // drop the hash; everything past this point is digits.
    const digits = hex.slice(1);

    // shorthand doubles each digit, so `#fb7` means exactly `#ffbb77`.
    const expanded = digits.length === 3
      ? digits.replace(/./g, digit => digit + digit)
      : digits;

    const red = Number.parseInt(expanded.slice(0, 2), 16);
    const green = Number.parseInt(expanded.slice(2, 4), 16);
    const blue = Number.parseInt(expanded.slice(4, 6), 16);

    return [ red, green, blue ];
  }

  /**
   * Packs a colour into the single number PIXI wants for a sprite's tint.
   * @param {number[]} rgb The colour as `[r, g, b]`.
   * @returns {number} The colour as `0xRRGGBB`.
   */
  static toTintNumber(rgb)
  {
    const [ red, green, blue ] = rgb;

    // shift each channel into its own byte of a single integer.
    return (red << 16) + (green << 8) + blue;
  }
}

export default LightingColor;
//endregion LightingColor