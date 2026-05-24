//region JuiceBaseEffect
/**
 * Queued per-frame juice work driven by {@link JuiceMotionManager#frameTick}.
 * Subclasses implement {@link #tick}; override {@link #restore} when a cancel must snap baselines.
 */
class JuiceBaseEffect
{
  /**
   * Advances this effect by one frame.
   * @returns {boolean} True while this instance should stay in the motion queue.
   */
  tick()
  {
    throw new Error('JuiceBaseEffect.tick must be implemented by subclass.');
  }

  /**
   * Baseline restore when the motion manager tears an effect down early (default: no-op).
   */
  restore()
  {
  }

  /**
   * Returns whether the target sprite for this effect is still alive and safe to write to.
   *
   * The base implementation always returns {@code true} (for non-sprite effects that do not
   * hold a sprite reference). Sprite-bound subclasses override this to check the Pixi
   * {@code destroyed} flag on their sprite; {@link JuiceMotionManager.frameTick} uses this
   * to skip effects whose sprite was destroyed mid-flight (e.g. during scene transitions).
   * @returns {boolean}
   */
  isSpriteAlive()
  {
    return true;
  }
}
export default JuiceBaseEffect;
//endregion JuiceBaseEffect