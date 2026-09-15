//region LightingChannels
/**
 * The properties of the screen that a lighting source is allowed to write, and the rules for
 * combining several sources that all want to write the same one.
 *
 * A channel exists so that no source ever touches the screen directly. The clock states "night is
 * this colour and takes away this much light", a map states "this cave is mostly dark", a cutscene
 * states "everything is red right now", and the composer decides what the renderer actually gets.
 * That is the only reason a cave at midnight during a red-lit cutscene resolves to one coherent
 * picture rather than to whichever of the three ran last.
 *
 * The combine rule differs per channel because the arithmetic that is correct for darkness is wrong
 * for a colour. Two things each removing half the light should leave a quarter of it, not none.
 * Two things each tinting the screen should not sum into a colour neither of them asked for.
 */
class LightingChannels
{
  /**
   * The additive colour cast over the whole scene, as `[r, g, b, grey]`.
   *
   * This is what the engine's own screen tone has always been, and it reaches the same place - the
   * colour filter on the spriteset's base sprite. It says what colour the light is. It cannot say
   * how much of it there is, because an additive filter is uniform and cannot have holes punched
   * in it, which is exactly the limitation that made this plugin necessary.
   * @type {string}
   */
  static TONE = 'tone';

  /**
   * How much light the scene has lost, as a fraction where `0` is untouched and `1` is pitch black.
   * @type {string}
   */
  static AMBIENT = 'ambient';

  /**
   * What colour the darkness itself is, as a `[r, g, b]` triplet.
   *
   * Ordinary dark is black, but dark is not always black - a cave lit by nothing but its own
   * bioluminescence is closer to teal, and saying so is cheaper and more controllable than tinting
   * every light in the room to compensate.
   * @type {string}
   */
  static AMBIENT_COLOR = 'ambientColor';

  /**
   * Every channel, in the order a composition reports them.
   * @returns {string[]}
   */
  static all()
  {
    return [
      LightingChannels.TONE,
      LightingChannels.AMBIENT,
      LightingChannels.AMBIENT_COLOR, ];
  }

  /**
   * The value a channel holds when nothing is contributing to it.
   *
   * A fresh array is built on every call rather than handing back a shared constant, because the
   * composer accumulates into whatever this returns and a shared array would carry one frame's
   * colour into the next.
   * @param {string} channel The channel name.
   * @returns {number|number[]} The identity value for that channel.
   */
  static identityFor(channel)
  {
    switch (channel)
    {
      case LightingChannels.TONE:
        return [ 0, 0, 0, 0 ];
      case LightingChannels.AMBIENT_COLOR:
        return [ 0, 0, 0 ];
      default:
        return 0;
    }
  }

  /**
   * Folds one source's contribution into whatever has accumulated for a channel so far.
   *
   * **Fold order is part of the contract for the claiming channels.** `TONE` and `AMBIENT_COLOR`
   * resolve by letting the incoming value win outright, so the composer must fold sources in
   * ascending priority - the last one in is the one that keeps the channel. Folding them in the
   * other order silently hands the screen to the least assertive source, and the result looks
   * plausible enough that nobody would go looking for the reason.
   * @param {string} channel The channel being combined.
   * @param {number|number[]} accumulated The running value for this channel.
   * @param {number|number[]} contribution The value one source wants to apply to it.
   * @returns {number|number[]} The new running value.
   */
  static combine(channel, accumulated, contribution)
  {
    switch (channel)
    {
      case LightingChannels.AMBIENT:
        return LightingChannels.#combineDarkness(accumulated, contribution);
      default:
        return contribution;
    }
  }

  /**
   * Compounds two darkness fractions by multiplying the light each one leaves behind.
   *
   * Darkness compounds rather than sums because each source removes a share of whatever light
   * reached it, not a share of the original. A map that is 30% dark at a moment the sky is 40% dark
   * leaves `0.7 x 0.6` of its light, so it is 58% dark - not 70%, which is what summing would say,
   * and which would let two ordinary evenings add up to a total blackout.
   * @param {number} accumulated The running darkness fraction.
   * @param {number} contribution The darkness fraction being folded in.
   * @returns {number}
   */
  static #combineDarkness(accumulated, contribution)
  {
    const lightRemaining = (1 - accumulated) * (1 - contribution);

    return 1 - lightRemaining;
  }
}

export default LightingChannels;
//endregion LightingChannels