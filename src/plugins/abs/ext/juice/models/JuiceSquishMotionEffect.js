//region JuiceSquishMotionEffect
/**
 * The body squash a battler gives when it hits something or gets hit.
 *
 * A sine envelope, which matters more than it sounds: the shape starts and ends at exactly no
 * deformation, so a squish can be handed to the composer with a frame budget and simply stop being
 * declared when the budget runs out. There is no snap back to normal because the last frame it drew
 * was already normal.
 *
 * Width swells as height compresses rather than both shrinking together. That is the whole trick to
 * making it read as impact — something being flattened rather than something being scaled down.
 *
 * `MotionEffect` and `MotionChannels` are reached as globals rather than imports: they ship inside
 * J-Motion's bundle and are hoisted by the time this one loads.
 */
class JuiceSquishMotionEffect
  extends MotionEffect
{
  /**
   * The channels a squish takes exclusive ownership of.
   *
   * Scale, and only scale. A combat reaction has to read at the size the designer tuned it to, so
   * it replaces an ambient breathe for its duration rather than multiplying against it — two
   * compounding scale motions produce an amplitude neither of them asked for.
   * @returns {string[]}
   */
  claims()
  {
    return [
      MotionChannels.SCALE_X,
      MotionChannels.SCALE_Y,
    ];
  }

  /**
   * How far through the current squish cycle this frame is, from 0 to 1.
   *
   * Cycles are counted by wrapping the elapsed frames rather than by resetting a counter, so a
   * repeated squish needs no per-cycle bookkeeping and cannot drift.
   * @returns {number}
   */
  cycleProgress()
  {
    const { duration } = this.parameters();

    return (this.elapsedFrames() % duration) / duration;
  }

  /**
   * Writes this frame of the squish into the composition.
   * @param {MotionComposition} composition The composition being built for this character.
   */
  applyTo(composition)
  {
    const { intensity } = this.parameters();
    const envelope = Math.sin(this.cycleProgress() * Math.PI);
    const swell = 1 + (envelope * intensity);

    composition.contribute(this, MotionChannels.SCALE_X, swell);
    composition.contribute(this, MotionChannels.SCALE_Y, 1 / swell);
  }
}

export default JuiceSquishMotionEffect;
//endregion JuiceSquishMotionEffect