//region TransitionMotionEffect
import MotionEffect from './MotionEffect.js';
import MotionEasing from '../core/MotionEasing.js';
import MotionChannels from '../core/MotionChannels.js';

/**
 * A motion that travels somewhere and stays there.
 *
 * Five of the eighteen types are this: growing, turning, fading, hue-shifting and tinting all mean
 * "put a channel somewhere other than its rest state and hold it". They differ only in which
 * channel and what the target is, so they share one implementation.
 *
 * These are the shape that makes a state expressive. A state declaring `scale 150` swells the
 * character as it lands, and because a removed transition travels back rather than vanishing, it
 * settles again when the state drops — an author gets the animation in both directions without
 * having written either.
 */
class TransitionMotionEffect
  extends MotionEffect
{
  /**
   * How many frames this effect has been travelling back toward its rest state.
   * @type {number}
   */
  #releaseFrames = 0;

  /**
   * The channel values held at the moment removal was requested.
   *
   * A transition can be cancelled before it ever arrived, so the journey home starts from wherever
   * it actually got to rather than from the target it was aiming at.
   * @type {Map<string, number|number[]>}
   */
  #releaseValues = new Map();

  /**
   * Extends {@link MotionEffect#tick}.<br/>
   * Advances the journey home once one is underway.
   */
  tick()
  {
    // perform original logic.
    super.tick();

    if (this.hasRemovalRequested() === true)
    {
      this.#releaseFrames++;
    }
  }

  /**
   * Extends {@link MotionEffect#requestRemoval}.<br/>
   * Captures where the channels currently sit, so the ease-out starts from there.
   */
  requestRemoval()
  {
    // already on the way home. asking again must not re-capture the starting point, because
    // `arrivingValue` reports where the outbound journey would be by now rather than where the
    // sprite has actually reached — so a second request would jump the channel back outward and
    // ease home from there a second time.
    if (this.hasRemovalRequested() === true) return;

    // capture the current position before the base class flips into removal.
    this.channels()
      .forEach(channel => this.#releaseValues.set(channel, this.arrivingValue(channel)), this);

    // perform original logic.
    super.requestRemoval();
  }

  /**
   * Extends {@link MotionEffect#cancelRemoval}.<br/>
   * Abandons the journey home, because there is somewhere to be again.
   */
  cancelRemoval()
  {
    // perform original logic.
    super.cancelRemoval();

    this.#releaseFrames = 0;
    this.#releaseValues.clear();
  }

  /**
   * Determines whether the composer may forget about this effect.
   *
   * Unlike the cycling motions, a transition parks a channel somewhere visible — an enemy at 150%
   * does not quietly return to normal if its effect is dropped, it snaps. So this one stays alive
   * after its declaration is gone, for exactly as long as it takes to get home.
   * @returns {boolean}
   */
  isDiscardable()
  {
    // still holding its target; nothing to wind down yet.
    if (this.hasRemovalRequested() === false) return false;

    const { duration } = this.parameters();

    return this.#releaseFrames >= duration;
  }

  /**
   * Writes this frame's position into the composition.
   * @param {MotionComposition} composition The composition being built for this character.
   */
  applyTo(composition)
  {
    this.channels()
      .forEach(channel => composition.contribute(this, channel, this.currentValue(channel)), this);
  }

  /**
   * The channels this transition drives.
   * @returns {string[]}
   */
  channels()
  {
    const motionType = this.declaration()
      .type();

    switch (motionType)
    {
      case 'scale':
        return [ MotionChannels.SCALE_X, MotionChannels.SCALE_Y ];
      case 'angle':
        return [ MotionChannels.ROTATION ];
      case 'fade':
        return [ MotionChannels.OPACITY ];
      case 'hue':
        return [ MotionChannels.HUE ];
      default:
        return [ MotionChannels.TINT ];
    }
  }

  /**
   * Where this transition's channels should sit once it has fully arrived.
   *
   * Scale and opacity are authored as percentages because that is how the engine's own zoom and
   * opacity controls read; angles are authored in degrees for the same reason. The conversion into
   * channel units happens here, once, rather than in every caller.
   *
   * A scale drives two channels and gives both the same target, which is why this is answered per
   * motion rather than per channel — nothing here needs to know which of the two it is answering
   * for.
   * @returns {number|number[]}
   */
  targetValue()
  {
    const parameters = this.parameters();
    const motionType = this.declaration()
      .type();

    switch (motionType)
    {
      case 'scale':
        return parameters.percent / 100;
      case 'angle':
        return (parameters.degrees * Math.PI) / 180;
      case 'fade':
        return parameters.percent / 100;
      case 'hue':
        return parameters.degrees;
      default:
        return parameters.color;
    }
  }

  /**
   * The value of a channel this frame, travelling out or travelling home.
   * @param {string} channel The channel being read.
   * @returns {number|number[]}
   */
  currentValue(channel)
  {
    // on the way home, from wherever it had got to, back to the rest state.
    if (this.hasRemovalRequested() === true) return this.releasingValue(channel);

    // on the way out, from the rest state toward the target.
    return this.arrivingValue(channel);
  }

  /**
   * The value while travelling toward the target.
   * @param {string} channel The channel being read.
   * @returns {number|number[]}
   */
  arrivingValue(channel)
  {
    const { duration } = this.parameters();
    const eased = MotionEasing.easeOutQuad(this.elapsedFrames() / duration);
    const identity = MotionChannels.identityFor(channel);
    const target = this.targetValue();

    return this.interpolate(channel, identity, target, eased);
  }

  /**
   * The value while travelling back toward the rest state.
   * @param {string} channel The channel being read.
   * @returns {number|number[]}
   */
  releasingValue(channel)
  {
    const { duration } = this.parameters();
    const eased = MotionEasing.easeOutQuad(this.#releaseFrames / duration);
    const identity = MotionChannels.identityFor(channel);
    const start = this.#releaseValues.get(channel);

    return this.interpolate(channel, start, identity, eased);
  }

  /**
   * Blends between two channel values.
   *
   * Whether a value is a number or a set of colour components is decided by which channel it
   * belongs to, so this dispatches on the channel rather than inspecting the value. Asking a value
   * what it is would work equally well today and would stop working the moment a channel changed
   * shape, with nothing to say why.
   * @param {string} channel The channel being blended.
   * @param {number|number[]} from The value at the start of the journey.
   * @param {number|number[]} to The value at the end of it.
   * @param {number} progress How far along, 0 to 1.
   * @returns {number|number[]}
   */
  interpolate(channel, from, to, progress)
  {
    // the tint is the only channel a transition drives that carries colour components.
    if (channel === MotionChannels.TINT)
    {
      return to.map((component, index) => this.interpolateScalar(from.at(index), component, progress));
    }

    return this.interpolateScalar(from, to, progress);
  }

  /**
   * Blends between two numbers.
   * @param {number} from The value at the start of the journey.
   * @param {number} to The value at the end of it.
   * @param {number} progress How far along, 0 to 1.
   * @returns {number}
   */
  interpolateScalar(from, to, progress)
  {
    return from + ((to - from) * progress);
  }
}

export default TransitionMotionEffect;
//endregion TransitionMotionEffect