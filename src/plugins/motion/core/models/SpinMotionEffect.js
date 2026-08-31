//region SpinMotionEffect
import MotionEffect from './MotionEffect.js';
import MotionChannels from '../core/MotionChannels.js';

/**
 * Continuous rotation, for coins, orbs, puzzle pieces and anything else that turns rather than
 * rocks.
 *
 * This is its own effect rather than another oscillator binding because it accumulates instead of
 * cycling — the angle grows without bound and is only meaningful modulo a full turn, where an
 * oscillator's value always comes back to where it started.
 *
 * A spin also needs the sprite rotated about its middle. Character sprites are anchored at their
 * feet so they stand on a tile, and rotating about that point swings the character around like a
 * conker on a string rather than turning it in place.
 */
class SpinMotionEffect
  extends MotionEffect
{
  /**
   * Writes this frame's rotation into the composition.
   * @param {MotionComposition} composition The composition being built for this character.
   */
  applyTo(composition)
  {
    composition.contribute(this, MotionChannels.ROTATION, this.currentRotation());

    // the pivot only moves for a rotation that is actually being drawn. something else owning the
    // channel means this spin is invisible this frame, and moving the sprite's anchor for an
    // invisible rotation would shift it half its own height for no reason anyone could see.
    if (composition.accepts(this, MotionChannels.ROTATION) === false) return;

    composition.flagCenterRotation();
  }

  /**
   * The accumulated rotation in radians.
   *
   * The phase offset is included so that a row of identical spinning objects starts at different
   * angles; without it, a shelf of coins turns as one piece of scenery rather than as several
   * coins.
   * @returns {number}
   */
  currentRotation()
  {
    const { period } = this.parameters();
    const advanced = this.elapsedFrames() + this.phaseOffset();
    const revolutions = advanced / period;

    return 2 * Math.PI * this.directionSign() * revolutions;
  }

  /**
   * Which way round the spin goes, as a multiplier on the angle.
   *
   * Anything that is not explicitly counter-clockwise turns clockwise, because an unrecognised
   * direction is an authoring typo and a spinning object is a better outcome than a stationary one
   * that gives no clue anything was wrong.
   * @returns {number} `1` for clockwise, `-1` for counter-clockwise.
   */
  directionSign()
  {
    const { direction } = this.parameters();

    return direction === 'ccw'
      ? -1
      : 1;
  }
}

export default SpinMotionEffect;
//endregion SpinMotionEffect