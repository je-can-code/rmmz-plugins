//region JuiceCastingPulseMotionEffect
import JuiceMotionManager from './../managers/JuiceMotionManager.js';
import JuiceBaseEffect from './JuiceBaseEffect.js';
/**
 * Continuous scale shimmer while a caller-supplied predicate stays true (casting juice).
 */
class JuiceCastingPulseMotionEffect extends JuiceBaseEffect
{

  //region properties
  /**
   * Gets the sprite.
   * @returns {*} The sprite.
   */
  sprite()
  {
    // hand back the sprite.
    return this._sprite;
  }

  /**
   * Gets the base scale x.
   * @returns {number} The baseScaleX.
   */
  baseScaleX()
  {
    // hand back the base scale x.
    return this._baseScaleX;
  }

  /**
   * Gets the base scale y.
   * @returns {number} The baseScaleY.
   */
  baseScaleY()
  {
    // hand back the base scale y.
    return this._baseScaleY;
  }

  /**
   * Gets the base blend color.
   * @returns {*} The baseBlendColor.
   */
  baseBlendColor()
  {
    // hand back the base blend color.
    return this._baseBlendColor;
  }

  /**
   * Gets the base color tone.
   * @returns {*} The baseColorTone.
   */
  baseColorTone()
  {
    // hand back the base color tone.
    return this._baseColorTone;
  }

  /**
   * Gets the phase.
   * @returns {number} The phase.
   */
  phase()
  {
    // hand back the phase.
    return this._phase;
  }

  /**
   * Sets the phase.
   * @param {number} newPhase The new phase.
   */
  setPhase(newPhase)
  {
    // assign the phase.
    this._phase = newPhase;
  }

  /**
   * Gets the amplitude scale.
   * @returns {*} The amplitudeScale.
   */
  amplitudeScale()
  {
    // hand back the amplitude scale.
    return this._amplitudeScale;
  }
  //endregion properties

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
    // store  continue predicate on the instance for later reads.
    this._continuePredicate = continuePredicate;
    this._phase = 0;
    this._baseScaleX = sprite.scale.x;
    this._baseScaleY = sprite.scale.y;

    // capture the baseline tone + blend so we can restore it exactly after casting ends.
    this._baseBlendColor = sprite.getBlendColor();
    this._baseColorTone = sprite.getColorTone();
  }

  /**
   * Returns false when the target sprite's Pixi transform has been nulled out.
   *
   * Pixi sets {@code transform = null} when a sprite is destroyed; it does NOT reliably set
   * a {@code destroyed} boolean in all RMMZ-bundled versions, so checking transform directly
   * is the safe guard. A null transform means any scale or blend write would immediately throw.
   * @returns {boolean}
   */
  isSpriteAlive()
  {
    return !!this.sprite().transform;
  }

  /**
   * Snaps scale back to the baseline captured at construction time.
   */
  restore()
  {
    this.sprite().scale.x = this.baseScaleX();
    this.sprite().scale.y = this.baseScaleY();

    // restore original render modifiers.
    this.sprite().setBlendColor(this.baseBlendColor());
    this.sprite().setColorTone(this.baseColorTone());
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
      JuiceMotionManager.relinquishSpriteLock(this.sprite());
      return false;
    }

    // advance the pulse phase.
    this.setPhase(this.phase() + 1);

    // calculate the next scale multiplier.
    // this is a uniform "breathing" pulse rather than a squash/stretch, so it reads as a charge-up shimmer.
    // also, the pulse ramps from slow to faster over time, so it reads like building energy.
    const startPeriodFrames = 60;
    const endPeriodFrames = 24;
    const rampDurationFrames = 180;
    const t = Math.min(this.phase() / rampDurationFrames, 1);
    const periodFrames = Math.round(startPeriodFrames + ((endPeriodFrames - startPeriodFrames) * t));
    const phaseRadians = (this.phase() % periodFrames) / periodFrames * (Math.PI * 2);
    const wave = Math.sin(phaseRadians);
    const mul = 1 + (wave * this.amplitudeScale());

    // apply the pulse to both axes equally.
    this.sprite().scale.x = this.baseScaleX() * mul;
    this.sprite().scale.y = this.baseScaleY() * mul;

    // apply a lightweight casting glow.
    // this uses blendColor alpha pulsing to fake an additive-ish "charging" overlay.
    const glowMin = 0;
    const glowMax = 96;
    const glowAlpha = Math.round(((wave + 1) / 2) * (glowMax - glowMin) + glowMin);
    this.sprite().setBlendColor([ 180, 220, 255, glowAlpha ]);

    return true;
  }
}
export default JuiceCastingPulseMotionEffect;
//endregion JuiceCastingPulseMotionEffect