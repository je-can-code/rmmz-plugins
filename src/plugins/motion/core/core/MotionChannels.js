//region MotionChannels
/**
 * The properties of a sprite that a motion effect is allowed to write, and the rules for combining
 * several effects that all want to write the same one.
 *
 * A channel exists so that effects never touch a sprite directly. An effect states "I contribute
 * +4 to offsetY this frame" and the composer decides what the sprite actually gets, which is the
 * only reason an ambient breathe and a combat squish can coexist on one enemy without either
 * knowing the other exists.
 *
 * The combine rule differs per channel because the arithmetic that is correct for a pixel offset
 * is wrong for a scale. Two effects each nudging a sprite four pixels right should move it eight;
 * two effects each scaling it by 1.5 should produce 2.25, not 3.
 */
class MotionChannels
{
  /**
   * Horizontal pixel offset from wherever the engine placed the sprite.
   * @type {string}
   */
  static OFFSET_X = 'offsetX';

  /**
   * Vertical pixel offset from wherever the engine placed the sprite.
   * @type {string}
   */
  static OFFSET_Y = 'offsetY';

  /**
   * Sprite rotation, in radians.
   * @type {string}
   */
  static ROTATION = 'rotation';

  /**
   * Horizontal scale, as a multiplier where 1.0 is unchanged.
   * @type {string}
   */
  static SCALE_X = 'scaleX';

  /**
   * Vertical scale, as a multiplier where 1.0 is unchanged.
   * @type {string}
   */
  static SCALE_Y = 'scaleY';

  /**
   * Opacity, as a multiplier against whatever opacity the engine assigned.
   * @type {string}
   */
  static OPACITY = 'opacity';

  /**
   * Hue rotation, in degrees.
   * @type {string}
   */
  static HUE = 'hue';

  /**
   * Multiplicative colour tint as `[r, g, b]`, each 0-255.
   * @type {string}
   */
  static TINT = 'tint';

  /**
   * Additive colour tone as `[r, g, b, gray]`, each -255 to 255.
   * @type {string}
   */
  static TONE = 'tone';

  /**
   * Blend colour as `[r, g, b, a]`, each 0-255.
   * @type {string}
   */
  static FLASH = 'flash';

  /**
   * Every channel, in the order a composition reports them.
   * @type {string[]}
   */
  static all()
  {
    return [
      MotionChannels.OFFSET_X,
      MotionChannels.OFFSET_Y,
      MotionChannels.ROTATION,
      MotionChannels.SCALE_X,
      MotionChannels.SCALE_Y,
      MotionChannels.OPACITY,
      MotionChannels.HUE,
      MotionChannels.TINT,
      MotionChannels.TONE,
      MotionChannels.FLASH,
    ];
  }

  /**
   * The value a channel holds when nothing is contributing to it.
   *
   * A fresh array is built on every call rather than handing back a shared constant, because the
   * composer accumulates into whatever this returns and a shared array would carry one character's
   * colour onto every other character on the map.
   * @param {string} channel The channel name.
   * @returns {number|number[]} The identity value for that channel.
   */
  static identityFor(channel)
  {
    switch (channel)
    {
      case MotionChannels.SCALE_X:
      case MotionChannels.SCALE_Y:
      case MotionChannels.OPACITY:
        return 1.0;
      case MotionChannels.TINT:
        return [ 255, 255, 255 ];
      case MotionChannels.TONE:
        return [ 0, 0, 0, 0 ];
      case MotionChannels.FLASH:
        return [ 0, 0, 0, 0 ];
      default:
        return 0;
    }
  }

  /**
   * Folds one effect's contribution into whatever has accumulated for a channel so far.
   * @param {string} channel The channel being combined.
   * @param {number|number[]} accumulated The running value for this channel.
   * @param {number|number[]} contribution The value one effect wants to add to it.
   * @returns {number|number[]} The new running value.
   */
  static combine(channel, accumulated, contribution)
  {
    switch (channel)
    {
      case MotionChannels.SCALE_X:
      case MotionChannels.SCALE_Y:
      case MotionChannels.OPACITY:
        return accumulated * contribution;
      case MotionChannels.HUE:
        return MotionChannels.#wrapDegrees(accumulated + contribution);
      case MotionChannels.TINT:
        return MotionChannels.#combineTint(accumulated, contribution);
      case MotionChannels.TONE:
        return MotionChannels.#combineTone(accumulated, contribution);
      case MotionChannels.FLASH:
        return MotionChannels.#combineFlash(accumulated, contribution);
      default:
        return accumulated + contribution;
    }
  }

  /**
   * Normalizes a hue into the 0-359 range so that repeated additions never run away.
   * @param {number} degrees The raw summed degrees.
   * @returns {number}
   */
  static #wrapDegrees(degrees)
  {
    // the remainder of a negative number is negative in javascript, so bias it back up first.
    const remainder = degrees % 360;
    if (remainder < 0) return remainder + 360;

    return remainder;
  }

  /**
   * Multiplies two tints together in normalized space.
   *
   * Tints multiply rather than sum because a tint darkens toward a colour; two half-strength reds
   * should compound into a deeper red rather than saturating back to white.
   * @param {number[]} accumulated The running `[r, g, b]`.
   * @param {number[]} contribution The `[r, g, b]` being folded in.
   * @returns {number[]}
   */
  static #combineTint(accumulated, contribution)
  {
    return accumulated.map((component, index) => (component * contribution.at(index)) / 255);
  }

  /**
   * Sums two tones component-wise, clamped to the range the engine's colour filter accepts.
   * @param {number[]} accumulated The running `[r, g, b, gray]`.
   * @param {number[]} contribution The `[r, g, b, gray]` being folded in.
   * @returns {number[]}
   */
  static #combineTone(accumulated, contribution)
  {
    return accumulated.map((component, index) =>
    {
      const summed = component + contribution.at(index);

      return summed.clamp(-255, 255);
    });
  }

  /**
   * Resolves two flashes by taking whichever is strongest.
   *
   * Flashes do not stack: two things flashing a character white at once should read as one white
   * flash, not as a blown-out double exposure. Alpha is the strength, so the higher alpha wins
   * outright and carries its own colour with it.
   * @param {number[]} accumulated The running `[r, g, b, a]`.
   * @param {number[]} contribution The `[r, g, b, a]` being folded in.
   * @returns {number[]}
   */
  static #combineFlash(accumulated, contribution)
  {
    // the incoming flash is weaker than what we already have, so it contributes nothing visible.
    if (contribution.at(3) <= accumulated.at(3)) return accumulated;

    return contribution;
  }
}

export default MotionChannels;
//endregion MotionChannels