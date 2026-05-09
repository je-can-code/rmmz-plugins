//region JuiceTiltMotionEffect
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
  constructor(sprite, peakRadians, durationFrames)
  {
    super();
    this._sprite = sprite;
    this._peakRadians = peakRadians;
    this._durationFrames = durationFrames;
    this._frame = 0;
    this._baseRotation = sprite.rotation;
  }

  /**
   * Snaps rotation back to the baseline captured at construction time.
   */
  restore()
  {
    this._sprite.rotation = this._baseRotation;
  }

  /**
   * Advances one frame of the tilt envelope.
   * @returns {boolean} True while the effect should stay in the runner queue.
   */
  tick()
  {
    this._frame++;
    const t = this._frame / this._durationFrames;
    const envelope = Math.sin(t * Math.PI);
    this._sprite.rotation = this._baseRotation + envelope * this._peakRadians;

    if (this._frame >= this._durationFrames)
    {
      this.restore();
      JuiceMotionManager.relinquishSpriteLock(this._sprite);
      return false;
    }

    return true;
  }
}
//endregion JuiceTiltMotionEffect