//region JuiceCastingPulseMotionEffect
/**
 * Continuous scale shimmer while a caller-supplied predicate stays true (casting juice).
 */
class JuiceCastingPulseMotionEffect extends JuiceBaseEffect
{
  /**
   * @param {Sprite} sprite The Pixi sprite being driven.
   * @param {number} amplitudeScale Scale wobble amplitude (small, e.g. 0.04).
   * @param {function(): boolean} continuePredicate While true, pulse continues.
   */
  constructor(sprite, amplitudeScale, continuePredicate)
  {
    super();
    this._sprite = sprite;
    this._amplitudeScale = amplitudeScale;
    this._continuePredicate = continuePredicate;
    this._phase = 0;
    this._baseScaleX = sprite.scale.x;
    this._baseScaleY = sprite.scale.y;

    // capture the baseline tone + blend so we can restore it exactly after casting ends.
    this._baseBlendColor = sprite.getBlendColor();
    this._baseColorTone = sprite.getColorTone();
  }

  /**
   * Snaps scale back to the baseline captured at construction time.
   */
  restore()
  {
    this._sprite.scale.x = this._baseScaleX;
    this._sprite.scale.y = this._baseScaleY;

    // restore original render modifiers.
    this._sprite.setBlendColor(this._baseBlendColor);
    this._sprite.setColorTone(this._baseColorTone);
  }

  /**
   * Advances one frame of the casting pulse.
   * @returns {boolean} True while the effect should stay in the runner queue.
   */
  tick()
  {
    if (this._continuePredicate() === false)
    {
      this.restore();
      JuiceMotionManager.relinquishSpriteLock(this._sprite);
      return false;
    }

    // advance the pulse phase.
    this._phase++;

    // calculate the next scale multiplier.
    // this is a uniform "breathing" pulse rather than a squash/stretch, so it reads as a charge-up shimmer.
    // also, the pulse ramps from slow to faster over time, so it reads like building energy.
    const startPeriodFrames = 60;
    const endPeriodFrames = 24;
    const rampDurationFrames = 180;
    const t = Math.min(this._phase / rampDurationFrames, 1);
    const periodFrames = Math.round(startPeriodFrames + ((endPeriodFrames - startPeriodFrames) * t));
    const phaseRadians = (this._phase % periodFrames) / periodFrames * (Math.PI * 2);
    const wave = Math.sin(phaseRadians);
    const mul = 1 + (wave * this._amplitudeScale);

    // apply the pulse to both axes equally.
    this._sprite.scale.x = this._baseScaleX * mul;
    this._sprite.scale.y = this._baseScaleY * mul;

    // apply a lightweight casting glow.
    // this uses blendColor alpha pulsing to fake an additive-ish "charging" overlay.
    const glowMin = 0;
    const glowMax = 96;
    const glowAlpha = Math.round(((wave + 1) / 2) * (glowMax - glowMin) + glowMin);
    this._sprite.setBlendColor([ 180, 220, 255, glowAlpha ]);

    return true;
  }
}
//endregion JuiceCastingPulseMotionEffect