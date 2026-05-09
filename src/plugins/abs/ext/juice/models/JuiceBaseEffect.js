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
}
//endregion JuiceBaseEffect