//region JuiceTiltMotionEffect
/**
 * The lean a battler takes as it swings a weapon.
 *
 * This is the caster half of a strike — the weapon overlay does the arc, and this tips the body
 * into it so the swing looks like it came from somewhere. On its own it is barely visible, which is
 * the point: a strike that reads as a whole-body action is a dozen small things agreeing, not one
 * large one.
 *
 * Like the squish it rides a sine envelope, so it begins and ends at no rotation at all and can be
 * withdrawn on any frame without the sprite jumping.
 *
 * `MotionEffect`, `MotionChannels` and `MotionEasing` are reached as globals rather than imports:
 * they ship inside J-Motion's bundle and are hoisted by the time this one loads.
 */
class JuiceTiltMotionEffect
  extends MotionEffect
{
  /**
   * The channel a tilt takes exclusive ownership of.
   *
   * A strike lean has to be the only thing rotating the body while it runs, or an ambient swing
   * adds an angle the designer never tuned for and the strike stops reading as deliberate.
   * @returns {string[]}
   */
  claims()
  {
    return [ MotionChannels.ROTATION ];
  }

  /**
   * How far through the tilt this frame is, from 0 to 1.
   * @returns {number}
   */
  progress()
  {
    const { duration } = this.parameters();

    return MotionEasing.normalize(this.elapsedFrames() / duration);
  }

  /**
   * Writes this frame of the tilt into the composition.
   * @param {MotionComposition} composition The composition being built for this character.
   */
  applyTo(composition)
  {
    const { peak } = this.parameters();
    const envelope = Math.sin(this.progress() * Math.PI);

    composition.contribute(this, MotionChannels.ROTATION, envelope * peak);
  }
}

export default JuiceTiltMotionEffect;
//endregion JuiceTiltMotionEffect