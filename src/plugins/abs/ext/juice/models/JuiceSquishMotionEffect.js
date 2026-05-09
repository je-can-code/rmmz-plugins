//region JuiceSquishMotionEffect
/**
 * One-shot scale squash / stretch envelope on a sprite (body squish juice).
 */
class JuiceSquishMotionEffect extends JuiceBaseEffect
{
  /**
   * @param {Sprite} sprite The Pixi sprite being driven.
   * @param {number} intensityScale Max delta applied via sine envelope (e.g. 0.12).
   * @param {number} durationFrames Frames to run.
   */
  constructor(sprite, intensityScale, durationFrames)
  {
    super();
    this._sprite = sprite;
    this._intensityScale = intensityScale;
    this._durationFrames = durationFrames;
    this._frame = 0;
    this._baseScaleX = sprite.scale.x;
    this._baseScaleY = sprite.scale.y;
  }

  /**
   * Snaps the sprite back to the baseline captured at construction time.
   */
  restore()
  {
    this._sprite.scale.x = this._baseScaleX;
    this._sprite.scale.y = this._baseScaleY;
  }

  /**
   * Advances one frame of the squish envelope.
   * @returns {boolean} True while the effect should stay in the runner queue.
   */
  tick()
  {
    this._frame++;
    const t = this._frame / this._durationFrames;
    const envelope = Math.sin(t * Math.PI);
    const mul = 1 + envelope * this._intensityScale;
    this._sprite.scale.x = this._baseScaleX * mul;
    this._sprite.scale.y = this._baseScaleY * (1 / mul);

    if (this._frame >= this._durationFrames)
    {
      this.restore();
      JuiceMotionManager.relinquishSpriteLock(this._sprite);
      return false;
    }

    return true;
  }
}
//endregion JuiceSquishMotionEffect