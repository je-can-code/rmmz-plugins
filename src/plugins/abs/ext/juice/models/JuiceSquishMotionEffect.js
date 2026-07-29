//region JuiceSquishMotionEffect
import JuiceMotionManager from './../managers/JuiceMotionManager.js';
import JuiceBaseEffect from './JuiceBaseEffect.js';
/**
 * One-shot scale squash / stretch envelope on a sprite (body squish juice).
 */
class JuiceSquishMotionEffect extends JuiceBaseEffect
{
  /**
   * @param {Sprite} sprite The Pixi sprite being driven.
   * @param {number} intensityScale Max delta applied via sine envelope (e.g. 0.12).
   * @param {number} durationFrames Frames to run per repeat cycle.
   * @param {number} [repeatCount=1] How many times to cycle the squish envelope before finishing.
   */
  

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
   * @returns {*} The baseScaleX.
   */
  baseScaleX()
  {
    // hand back the base scale x.
    return this._baseScaleX;
  }

  /**
   * Gets the base scale y.
   * @returns {*} The baseScaleY.
   */
  baseScaleY()
  {
    // hand back the base scale y.
    return this._baseScaleY;
  }

  /**
   * Gets the frame.
   * @returns {*} The frame.
   */
  frame()
  {
    // hand back the frame.
    return this._frame;
  }

  /**
   * Sets the frame.
   * @param {*} newFrame The new frame.
   */
  setFrame(newFrame)
  {
    // assign the frame.
    this._frame = newFrame;
  }

  /**
   * Gets the duration frames.
   * @returns {*} The durationFrames.
   */
  durationFrames()
  {
    // hand back the duration frames.
    return this._durationFrames;
  }

  /**
   * Gets the intensity scale.
   * @returns {*} The intensityScale.
   */
  intensityScale()
  {
    // hand back the intensity scale.
    return this._intensityScale;
  }

  /**
   * Gets the repeats remaining.
   * @returns {*} The repeatsRemaining.
   */
  repeatsRemaining()
  {
    // hand back the repeats remaining.
    return this._repeatsRemaining;
  }

  /**
   * Sets the repeats remaining.
   * @param {*} newRepeatsRemaining The new repeatsRemaining.
   */
  setRepeatsRemaining(newRepeatsRemaining)
  {
    // assign the repeats remaining.
    this._repeatsRemaining = newRepeatsRemaining;
  }
  //endregion properties

  constructor(sprite, intensityScale, durationFrames, repeatCount = 1)
  {
    super();
    this._sprite = sprite;
    this._intensityScale = intensityScale;
    // store duration frames on the instance for later reads.
    this._durationFrames = durationFrames;
    this._repeatCount = Math.max(1, repeatCount);
    this._repeatsRemaining = this._repeatCount;
    this._frame = 0;
    this._baseScaleX = sprite.scale.x;
    this._baseScaleY = sprite.scale.y;
  }

  /**
   * Returns false when the target sprite's Pixi transform has been nulled out.
   *
   * Pixi sets {@code transform = null} when a sprite is destroyed; it does NOT reliably set
   * a {@code destroyed} boolean in all RMMZ-bundled versions, so checking transform directly
   * is the safe guard. A null transform means any scale/rotation write would immediately
   * throw "Cannot read properties of null (reading 'scale')".
   * @returns {boolean}
   */
  isSpriteAlive()
  {
    return !!this.sprite().transform;
  }

  /**
   * Snaps the sprite back to the baseline captured at construction time.
   */
  restore()
  {
    this.sprite().scale.x = this.baseScaleX();
    this.sprite().scale.y = this.baseScaleY();
  }

  /**
   * Advances one frame of the squish envelope.
   * @returns {boolean} True while the effect should stay in the runner queue.
   */
  tick()
  {
    this.setFrame(this.frame() + 1);
    const t = this.frame() / this.durationFrames();
    const envelope = Math.sin(t * Math.PI);
    const mul = 1 + envelope * this.intensityScale();
    this.sprite().scale.x = this.baseScaleX() * mul;
    this.sprite().scale.y = this.baseScaleY() * (1 / mul);

    if (this.frame() >= this.durationFrames())
    {
      this.setRepeatsRemaining(this.repeatsRemaining() - 1);

      // more cycles remain — reset the frame counter and continue.
      if (this.repeatsRemaining() > 0)
      {
        this.setFrame(0);
        return true;
      }

      // all cycles exhausted — restore and release the sprite lock.
      this.restore();
      JuiceMotionManager.relinquishSpriteLock(this.sprite());
      return false;
    }

    return true;
  }
}
export default JuiceSquishMotionEffect;
//endregion JuiceSquishMotionEffect