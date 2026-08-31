//region JuiceFlipBodyMotionEffect
/**
 * A full body rotation, for skills whose whole idea is that the caster went end over end.
 *
 * The rotation sweeps linearly rather than easing, because a flip that slows into its landing reads
 * as a stumble. It travels a whole number of turns over its duration, so it finishes pointing
 * exactly where it started and can be withdrawn on its final frame without a snap.
 *
 * Rotating a character sprite is not free: they are anchored at the feet so they stand on a tile,
 * and turning about that point swings the body around like a conker on a string. Asking the
 * composition for centred rotation is the entire fix — the view owns the anchor and the height
 * compensation, so nothing about that problem lives here.
 *
 * `MotionEffect`, `MotionChannels` and `MotionEasing` are reached as globals rather than imports:
 * they ship inside J-Motion's bundle and are hoisted by the time this one loads.
 */
class JuiceFlipBodyMotionEffect
  extends MotionEffect
{
  /**
   * The channel a flip takes exclusive ownership of.
   * @returns {string[]}
   */
  claims()
  {
    return [ MotionChannels.ROTATION ];
  }

  /**
   * How far through the flip this frame is, from 0 to 1.
   * @returns {number}
   */
  progress()
  {
    const { duration } = this.parameters();

    return MotionEasing.normalize(this.elapsedFrames() / duration);
  }

  /**
   * Which way round the flip goes, as a multiplier on the angle.
   *
   * Anything that is not explicitly counter-clockwise turns clockwise, matching how a spin reads its
   * own direction — an unrecognised value is an authoring typo, and a flip going the wrong way is a
   * better outcome than a caster that stands still with no clue anything was wrong.
   * @returns {number} `1` for clockwise, `-1` for counter-clockwise.
   */
  directionSign()
  {
    const { direction } = this.parameters();

    return direction === 'ccw'
      ? -1
      : 1;
  }

  /**
   * The angle this frame sits at, in radians.
   * @returns {number}
   */
  currentRotation()
  {
    const { turns } = this.parameters();

    return 2 * Math.PI * turns * this.directionSign() * this.progress();
  }

  /**
   * Writes this frame of the flip into the composition.
   * @param {MotionComposition} composition The composition being built for this character.
   */
  applyTo(composition)
  {
    composition.contribute(this, MotionChannels.ROTATION, this.currentRotation());

    // a battler killed mid-flip is the case this guards. the collapse claims rotation and topples
    // it about its feet on purpose, so a flip that keeps asking for a centred pivot would hoist the
    // corpse half a body-height into the air for the whole death animation.
    if (composition.accepts(this, MotionChannels.ROTATION) === false) return;

    composition.flagCenterRotation();
  }
}

export default JuiceFlipBodyMotionEffect;
//endregion JuiceFlipBodyMotionEffect