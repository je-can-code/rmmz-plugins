//region JuiceCastingPulseMotionEffect
/**
 * The shimmer a battler gives off while it is charging a skill.
 *
 * Unlike every other juice reaction this one has no duration, because a cast has no duration either
 * — it lasts until the caster finishes, is interrupted, or dies. It animates for exactly as long as
 * something keeps declaring it, which is the composer's ordinary contract and needs no clock.
 *
 * The pulse accelerates as it runs, from a slow swell to a fast one over about three seconds. That
 * ramp is the whole reason this is not just a `pulse` oscillator: a steady rhythm reads as ambient
 * and this needs to read as building toward something.
 *
 * `MotionEffect`, `MotionChannels` and `MotionEasing` are reached as globals rather than imports:
 * they ship inside J-Motion's bundle and are hoisted by the time this one loads.
 */
class JuiceCastingPulseMotionEffect
  extends MotionEffect
{
  /**
   * The channels a casting pulse takes exclusive ownership of.
   *
   * Scale only. The glow is deliberately left unclaimed so that it resolves against every other
   * flash on the character by strength — a caster who is also bleeding should show whichever of the
   * two is currently brighter, rather than the charge-up suppressing the injury outright.
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
   * How many frames one swell currently takes.
   *
   * The period contracts as the cast goes on, which is what turns a rhythm into a build-up. It stops
   * contracting once the ramp is spent so that a very long cast settles into an urgent pulse rather
   * than accelerating into a vibration.
   * @returns {number}
   */
  periodFrames()
  {
    const startPeriodFrames = 60;
    const endPeriodFrames = 24;
    const rampDurationFrames = 180;
    const ramp = MotionEasing.normalize(this.elapsedFrames() / rampDurationFrames);

    return Math.round(startPeriodFrames + ((endPeriodFrames - startPeriodFrames) * ramp));
  }

  /**
   * Where in the current swell this frame sits, from -1 to 1.
   * @returns {number}
   */
  wave()
  {
    const period = this.periodFrames();
    const phaseRadians = ((this.elapsedFrames() % period) / period) * (Math.PI * 2);

    return Math.sin(phaseRadians);
  }

  /**
   * The charge glow for a point in the swell.
   *
   * A cold blue-white, at up to roughly a third strength. Anything stronger stops reading as energy
   * gathering around a caster and starts reading as the sprite being washed out.
   * @param {number} wave Where in the swell this frame sits, from -1 to 1.
   * @returns {number[]} The `[r, g, b, a]` blend colour.
   */
  glowFor(wave)
  {
    const peakAlpha = 96;
    const strength = (wave + 1) / 2;

    return [ 180, 220, 255, Math.round(strength * peakAlpha) ];
  }

  /**
   * Writes this frame of the casting pulse into the composition.
   * @param {MotionComposition} composition The composition being built for this character.
   */
  applyTo(composition)
  {
    const { amplitude } = this.parameters();
    const wave = this.wave();
    const swell = 1 + (wave * amplitude);

    // both axes swell together: this is a charge-up, not an impact, so nothing is being deformed.
    composition.contribute(this, MotionChannels.SCALE_X, swell);
    composition.contribute(this, MotionChannels.SCALE_Y, swell);
    composition.contribute(this, MotionChannels.FLASH, this.glowFor(wave));
  }
}

export default JuiceCastingPulseMotionEffect;
//endregion JuiceCastingPulseMotionEffect