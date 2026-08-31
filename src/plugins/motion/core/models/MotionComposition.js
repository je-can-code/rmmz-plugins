//region MotionComposition
import MotionChannels from '../core/MotionChannels.js';

/**
 * Every channel's final value for one character on one frame.
 *
 * The composer builds one of these per sprite per frame and the sprite applies it without knowing
 * how many effects produced it or which of them won a contested channel. A composition is
 * therefore the entire contract between the motion system and the view: widen this and the view
 * learns something new, leave it alone and the view never changes again.
 *
 * Effects write into it directly rather than handing back a bag of values to be merged, because a
 * map allocated per effect per frame is a lot of garbage on a map holding several hundred events.
 */
class MotionComposition
{
  /**
   * The accumulated value of each channel, keyed by channel name.
   * @type {Map<string, number|number[]>}
   */
  #values = new Map();

  /**
   * The effect that has exclusive ownership of a channel, keyed by channel name.
   * @type {Map<string, MotionEffect>}
   */
  #claimants = new Map();

  /**
   * Whether any contributing effect needs the sprite rotated about its middle rather than its feet.
   * @type {boolean}
   */
  #centerRotation = false;

  /**
   * Constructor. Seeds every channel to the value it holds when nothing is contributing.
   */
  constructor()
  {
    MotionChannels.all()
      .forEach(channel => this.#values.set(channel, MotionChannels.identityFor(channel)), this);
  }

  /**
   * Gets the final value of a channel.
   * @param {string} channel The channel name.
   * @returns {number|number[]} The composed value.
   */
  valueFor(channel)
  {
    // hand back the composed value for this channel.
    return this.#values.get(channel);
  }

  /**
   * Records which effect has won exclusive ownership of a channel for this frame.
   *
   * Claims are resolved before any effect contributes, so that a losing contributor can be
   * discarded on arrival rather than being written and then overwritten.
   * @param {string} channel The channel being claimed.
   * @param {MotionEffect} claimant The effect that won the channel.
   */
  awardClaim(channel, claimant)
  {
    this.#claimants.set(channel, claimant);
  }

  /**
   * Gets the effect that owns a channel this frame, if any.
   * @param {string} channel The channel name.
   * @returns {MotionEffect|null} The claimant, or null when the channel is uncontested.
   */
  claimantFor(channel)
  {
    // an unclaimed channel has no owner, which callers distinguish from any real effect.
    if (this.#claimants.has(channel) === false) return null;

    // hand back the winning claimant.
    return this.#claimants.get(channel);
  }

  /**
   * Folds one effect's contribution into a channel, honouring any claim on it.
   *
   * A claimed channel accepts writes only from its claimant, and takes that write outright rather
   * than combining it — that is what "claim" means. Everyone else's contribution to that channel
   * is discarded silently, which is correct: a combat squish taking over the scale is supposed to
   * make the ambient breathe invisible for its duration, not fight it.
   * @param {MotionEffect} contributor The effect making the contribution.
   * @param {string} channel The channel being contributed to.
   * @param {number|number[]} contribution The value the effect wants to apply.
   */
  contribute(contributor, channel, contribution)
  {
    const claimant = this.claimantFor(channel);

    // nobody owns this channel, so everything that reaches it composes.
    if (claimant === null)
    {
      const accumulated = this.#values.get(channel);
      const combined = MotionChannels.combine(channel, accumulated, contribution);
      this.#values.set(channel, combined);

      return;
    }

    // somebody else owns this channel, so this contribution never lands.
    if (claimant !== contributor) return;

    // the owner writes its value outright.
    this.#values.set(channel, contribution);
  }

  /**
   * Determines whether a contribution from this effect would actually reach a channel.
   *
   * An effect that has lost a channel to a claimant is still asked to write it, and the write is
   * discarded — which is fine for a value, and not fine for anything an effect does *alongside* the
   * write. Asking first is how an effect avoids acting on a contribution that never lands.
   * @param {MotionEffect} contributor The effect that wants to contribute.
   * @param {string} channel The channel it wants to write.
   * @returns {boolean}
   */
  accepts(contributor, channel)
  {
    const claimant = this.claimantFor(channel);

    // nobody owns this channel, so everything that reaches it composes.
    if (claimant === null) return true;

    return claimant === contributor;
  }

  /**
   * Gets whether the sprite should rotate about its centre this frame.
   * @returns {boolean} The centerRotation.
   */
  hasCenterRotation()
  {
    // hand back whether centred rotation was requested.
    return this.#centerRotation;
  }

  /**
   * Requests that the sprite rotate about its centre rather than its feet.
   *
   * A character sprite is anchored at its feet so that it stands on a tile, which is correct for
   * walking and wrong for spinning — a spin about the feet reads as the character being swung
   * around on a rope. Only the view can compensate, because only the view knows the sprite's
   * height, so the composition carries the request rather than the correction.
   */
  flagCenterRotation()
  {
    this.#centerRotation = true;
  }
}

export default MotionComposition;
//endregion MotionComposition