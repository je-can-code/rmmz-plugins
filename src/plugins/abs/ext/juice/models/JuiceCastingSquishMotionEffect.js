//region JuiceCastingSquishMotionEffect
/**
 * The frantic squat a battler does while it is working something off mid-cast.
 *
 * Like the casting pulse, this has no duration: a cast lasts until the caster finishes, is
 * interrupted, or dies, and this animates for exactly as long as something keeps declaring it. What
 * differs is the shape. The pulse swells both axes together because it is a charge-up, and nothing is
 * being deformed. This compresses height as it widens, which is the squish grammar for impact, and it
 * does so on a fixed fast period rather than a ramp. A steady, rapid squat reads as effort being spent;
 * a build-up would read as energy gathering, which is the opposite of the fiction.
 *
 * The envelope only ever squashes. A sine over half a cycle sits at zero on both ends and peaks in the
 * middle, so every squat starts and ends at the sprite's true size and nothing snaps back.
 *
 * `MotionEffect` and `MotionChannels` are reached as globals rather than imports: they ship inside
 * J-Motion's bundle and are hoisted by the time this one loads.
 */
class JuiceCastingSquishMotionEffect
  extends MotionEffect
{
  /**
   * The channels a casting squish takes exclusive ownership of.
   *
   * Scale only, like every other body reaction. No glow is claimed or contributed: the charge glow
   * belongs to gathering energy, and a battler doing squats is spending it.
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
   * How far through the current squat this frame is, from 0 to 1.
   *
   * Counted by wrapping elapsed frames rather than resetting a counter, so a squat that runs for the
   * length of a long cast needs no bookkeeping and cannot drift.
   * @returns {number}
   */
  cycleProgress()
  {
    const { period } = this.parameters();

    return (this.elapsedFrames() % period) / period;
  }

  /**
   * Writes this frame of the squat into the composition.
   * @param {MotionComposition} composition The composition being built for this character.
   */
  applyTo(composition)
  {
    const { intensity } = this.parameters();
    const envelope = Math.sin(this.cycleProgress() * Math.PI);
    const swell = 1 + (envelope * intensity);

    // width swells as height compresses: something being flattened, not something being scaled.
    composition.contribute(this, MotionChannels.SCALE_X, swell);
    composition.contribute(this, MotionChannels.SCALE_Y, 1 / swell);
  }
}

export default JuiceCastingSquishMotionEffect;
//endregion JuiceCastingSquishMotionEffect