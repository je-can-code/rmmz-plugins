//region JuiceTiltMotionEffect
import JuiceMotionManager from './../managers/JuiceMotionManager.js';
import JuiceBaseEffect from './JuiceBaseEffect.js';
/**
 * One-shot rotation wobble (strike tilt juice) on a sprite.
 */
class JuiceTiltMotionEffect extends JuiceBaseEffect
{
  /**
   * @param {Sprite} sprite The Pixi sprite being driven.
   * @param {number} peakRadians Peak rotation magnitude (radians).
   * @param {number} durationFrames Frames to run.
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
   * Gets the base rotation.
   * @returns {*} The baseRotation.
   */
  baseRotation()
  {
    // hand back the base rotation.
    return this._baseRotation;
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
   * Gets the peak radians.
   * @returns {*} The peakRadians.
   */
  peakRadians()
  {
    // hand back the peak radians.
    return this._peakRadians;
  }
  //endregion properties

  constructor(sprite, peakRadians, durationFrames)
  {
    super();
    this._sprite = sprite;
    this._peakRadians = peakRadians;
    // store  duration frames on the instance for later reads.
    this._durationFrames = durationFrames;
    this._frame = 0;
    this._baseRotation = sprite.rotation;
  }

  /**
   * Returns false when the target sprite's Pixi transform has been nulled out.
   *
   * Pixi sets {@code transform = null} when a sprite is destroyed; it does NOT reliably set
   * a {@code destroyed} boolean in all RMMZ-bundled versions, so checking transform directly
   * is the safe guard. A null transform means any rotation write would immediately throw.
   * @returns {boolean}
   */
  isSpriteAlive()
  {
    return !!this.sprite().transform;
  }

  /**
   * Snaps rotation back to the baseline captured at construction time.
   */
  restore()
  {
    this.sprite().rotation = this.baseRotation();
  }

  /**
   * Advances one frame of the tilt envelope.
   * @returns {boolean} True while the effect should stay in the runner queue.
   */
  tick()
  {
    this.setFrame(this.frame() + 1);
    const t = this.frame() / this.durationFrames();
    const envelope = Math.sin(t * Math.PI);
    this.sprite().rotation = this.baseRotation() + envelope * this.peakRadians();

    if (this.frame() >= this.durationFrames())
    {
      this.restore();
      JuiceMotionManager.relinquishSpriteLock(this.sprite());
      return false;
    }

    return true;
  }
}
export default JuiceTiltMotionEffect;
//endregion JuiceTiltMotionEffect