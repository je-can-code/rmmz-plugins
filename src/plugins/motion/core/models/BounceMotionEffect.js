//region BounceMotionEffect
import MotionEffect from './MotionEffect.js';
import MotionChannels from '../core/MotionChannels.js';

/**
 * A repeating hop: an arc into the air, a pause on the ground, and away again.
 *
 * This is not an oscillator with a different waveform, because the pause is the point. A sine wave
 * spends every frame somewhere, so a character animated by one is never quite still; a hopping
 * creature is defined as much by the beat it sits out as by the arc it travels. Setting `rest` to
 * zero collapses this back into a continuously bouncing ball, which is the less interesting of the
 * two and is why it is not the default.
 */
class BounceMotionEffect
  extends MotionEffect
{
  /**
   * Writes this frame's height into the composition.
   * @param {MotionComposition} composition The composition being built for this character.
   */
  applyTo(composition)
  {
    composition.contribute(this, MotionChannels.OFFSET_Y, this.currentHeight());
  }

  /**
   * How high off the ground the character is this frame, in screen pixels.
   *
   * Negative is upward, and the character is never below its own tile — a hop leaves the ground
   * and returns to it, and there is nothing to sink into.
   * @returns {number}
   */
  currentHeight()
  {
    const { height, duration } = this.parameters();
    const positionInCycle = this.positionInCycle();

    // the character is sitting out this beat, back on the ground.
    if (positionInCycle >= duration) return 0;

    const progress = positionInCycle / duration;

    return -(height * Math.sin(Math.PI * progress));
  }

  /**
   * How far into the current arc-then-rest cycle this frame falls.
   *
   * The phase offset is folded in so that a clutch of identical creatures does not hop in
   * formation.
   * @returns {number}
   */
  positionInCycle()
  {
    const { duration, rest } = this.parameters();
    const cycleLength = duration + rest;
    const advanced = this.elapsedFrames() + this.phaseOffset();

    return advanced % cycleLength;
  }
}

export default BounceMotionEffect;
//endregion BounceMotionEffect