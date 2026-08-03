//region JuiceFlipBodyMotionEffect
import JuiceMotionManager from './../managers/JuiceMotionManager.js';
import JuiceBaseEffect from './JuiceBaseEffect.js';
/**
 * Full-rotation body spin on a sprite — drives `rotation` through N × 2π over the total duration.
 * Direction is controlled by the sign of {@link directionSign}: +1 = clockwise, -1 = counter-clockwise.
 *
 * Sprite_Character anchors at (0.5, 1). Shifting to (0.5, 0.5) re-centers the rotation pivot
 * but causes a visible drop of ~half the sprite height on entry because RMMZ's updatePosition
 * writes screenY() every frame (calibrated for anchor.y=1) and cannot be compensated.
 * This is a known limitation of the current approach.
 */
class JuiceFlipBodyMotionEffect extends JuiceBaseEffect
{

  //region properties
  /**
   * Gets the sprite.
   * @returns {Sprite} The sprite.
   */
  sprite()
  {
    // hand back the sprite.
    return this._sprite;
  }

  /**
   * Gets the base rotation.
   * @returns {number} The baseRotation.
   */
  baseRotation()
  {
    // hand back the base rotation.
    return this._baseRotation;
  }

  /**
   * Gets the base anchor x.
   * @returns {number} The baseAnchorX.
   */
  baseAnchorX()
  {
    // hand back the base anchor x.
    return this._baseAnchorX;
  }

  /**
   * Gets the base anchor y.
   * @returns {number} The baseAnchorY.
   */
  baseAnchorY()
  {
    // hand back the base anchor y.
    return this._baseAnchorY;
  }

  /**
   * Gets the frame.
   * @returns {number} The frame.
   */
  frame()
  {
    // hand back the frame.
    return this._frame;
  }

  /**
   * Sets the frame.
   * @param {number} newFrame The new frame.
   */
  setFrame(newFrame)
  {
    // assign the frame.
    this._frame = newFrame;
  }

  /**
   * Gets the duration frames.
   * @returns {number} The durationFrames.
   */
  durationFrames()
  {
    // hand back the duration frames.
    return this._durationFrames;
  }

  /**
   * Gets the direction sign.
   * @returns {number} The directionSign.
   */
  directionSign()
  {
    // hand back the direction sign.
    return this._directionSign;
  }

  /**
   * Gets the repeat count.
   * @returns {number} The repeatCount.
   */
  repeatCount()
  {
    // hand back the repeat count.
    return this._repeatCount;
  }
  //endregion properties

  /**
   * @param {Sprite} sprite The Pixi sprite being driven.
   * @param {number} directionSign +1 for clockwise (flip), -1 for counter-clockwise (flip-reverse).
   * @param {number} durationFrames Total frames for the entire animation (all rotations).
   * @param {number} [repeatCount=1] Number of full 360° rotations to complete.
   */
  constructor(sprite, directionSign, durationFrames, repeatCount = 1)
  {
    super();
    this._sprite = sprite;
    this._directionSign = directionSign;
    this._durationFrames = durationFrames;
    this._repeatCount = Math.max(1, repeatCount);
    this._frame = 0;
    this._baseRotation = sprite.rotation;
    this._baseAnchorX = sprite.anchor.x;
    this._baseAnchorY = sprite.anchor.y;

    // shift pivot to visual center so rotation flips in place rather than orbiting the feet.
    // _juiceFlipping is set on the first tick() so the updatePosition compensation is always
    // in sync with the anchor — setting it here would cause a one-frame drop before tick runs.
    sprite.anchor.x = 0.5;
    sprite.anchor.y = 0.5;
  }

  /**
   * Returns false when the target sprite's Pixi transform has been nulled out.
   * @returns {boolean}
   */
  isSpriteAlive()
  {
    return !!this.sprite().transform;
  }

  /**
   * Snaps rotation and anchor back to the baselines captured at construction time.
   */
  restore()
  {
    this.sprite()._juiceFlipping = false;
    this.sprite().rotation = this.baseRotation();
    this.sprite().anchor.x = this.baseAnchorX();
    this.sprite().anchor.y = this.baseAnchorY();
  }

  /**
   * Advances one frame of the flip envelope.
   * Rotation sweeps linearly through repeatCount × 2π over the total duration.
   * @returns {boolean} True while the effect should stay in the runner queue.
   */
  tick()
  {
    this.sprite()._juiceFlipping = true;
    this.setFrame(this.frame() + 1);
    const t = this.frame() / this.durationFrames();
    this.sprite().rotation = this.baseRotation() + this.directionSign() * t * (Math.PI * 2) * this.repeatCount();

    if (this.frame() >= this.durationFrames())
    {
      this.restore();
      JuiceMotionManager.relinquishSpriteLock(this.sprite());
      return false;
    }

    return true;
  }
}
export default JuiceFlipBodyMotionEffect;
//endregion JuiceFlipBodyMotionEffect
