//region JitterMotionEffect
import MotionEffect from './MotionEffect.js';
import MotionChannels from '../core/MotionChannels.js';

/**
 * Discontinuous motion: hold a random value for a moment, then jump to another one.
 *
 * Shaking and flickering are the same effect on different channels. Both are defined by what
 * separates them from their smooth cousins — a shake is not a sway and a flicker is not a ghost,
 * because the value jumps rather than travels, and that jumping is the entire read.
 *
 * The `interval` is what turns one into the other in feel: re-rolling every frame buzzes like a
 * held tool, while re-rolling every sixth frame reads as a stutter or a failing lamp.
 */
class JitterMotionEffect
  extends MotionEffect
{
  /**
   * The value currently being held, per channel this effect writes.
   * @type {Map<string, number>}
   */
  #heldValues = new Map();

  /**
   * How many frames the current values have been held for.
   * @type {number}
   */
  #framesHeld = 0;

  /**
   * Whether any value has been rolled yet.
   *
   * A jitter has to produce something on its very first frame — waiting for the first interval to
   * elapse would leave the character conspicuously still for a moment after being hit.
   * @type {boolean}
   */
  #hasRolled = false;

  /**
   * Extends {@link MotionEffect#tick}.<br/>
   * Counts down toward the next re-roll.
   */
  tick()
  {
    // perform original logic.
    super.tick();

    this.#framesHeld++;
  }

  /**
   * Writes the currently held jitter into the composition, rolling fresh values when due.
   * @param {MotionComposition} composition The composition being built for this character.
   */
  applyTo(composition)
  {
    if (this.isRollDue() === true)
    {
      this.roll();
    }

    this.#heldValues.forEach((value, channel) => composition.contribute(this, channel, value), this);
  }

  /**
   * Determines whether the held values have gone stale.
   * @returns {boolean}
   */
  isRollDue()
  {
    // the very first frame always rolls, so the effect is visible immediately.
    if (this.#hasRolled === false) return true;

    const { interval } = this.parameters();

    return this.#framesHeld >= interval;
  }

  /**
   * Rolls a fresh set of values and starts holding them.
   */
  roll()
  {
    const motionType = this.declaration()
      .type();

    if (motionType === 'shake')
    {
      this.rollShake();
    }
    else
    {
      this.rollFlicker();
    }

    this.#hasRolled = true;
    this.#framesHeld = 0;
  }

  /**
   * Rolls a positional jitter on whichever axes the author enabled.
   */
  rollShake()
  {
    const { strength, axis } = this.parameters();

    this.#heldValues.clear();

    if (this.isAxisEnabled(axis, 'x') === true)
    {
      this.#heldValues.set(MotionChannels.OFFSET_X, this.randomDeflection(strength));
    }

    if (this.isAxisEnabled(axis, 'y') === true)
    {
      this.#heldValues.set(MotionChannels.OFFSET_Y, this.randomDeflection(strength));
    }
  }

  /**
   * Rolls an opacity somewhere between the authored bounds.
   */
  rollFlicker()
  {
    const { min, max } = this.parameters();
    const span = max - min;

    this.#heldValues.set(MotionChannels.OPACITY, min + (Math.random() * span));
  }

  /**
   * Determines whether a shake should move along a given axis.
   * @param {string} authored The axis the author asked for: `x`, `y`, or `both`.
   * @param {string} candidate The axis being tested.
   * @returns {boolean}
   */
  isAxisEnabled(authored, candidate)
  {
    if (authored === 'both') return true;

    return authored === candidate;
  }

  /**
   * A random deflection either side of centre.
   *
   * Deflection is symmetric so the character vibrates around where it stands rather than creeping
   * off in one direction over the life of the shake.
   * @param {number} strength The maximum deflection in pixels.
   * @returns {number}
   */
  randomDeflection(strength)
  {
    return ((Math.random() * 2) - 1) * strength;
  }
}

export default JitterMotionEffect;
//endregion JitterMotionEffect