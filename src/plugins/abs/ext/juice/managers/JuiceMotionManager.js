//region JuiceMotionManager
/**
 * Owns lightweight per-frame juice tweens on Pixi sprites (scale / rotation).
 */
class JuiceMotionManager
{
  /**
   * @type {JuiceBaseEffect[]}
   */
  static #effects = [];

  /**
   * @type {WeakMap<Sprite, JuiceBaseEffect>}
   */
  static #spriteLocks = new WeakMap();

  /**
   * Clears the active sprite lock after a bound effect finishes its own teardown.
   * Motion effect instances call this from {@link JuiceBaseEffect#tick} when they return false.
   *
   * @param {Sprite} sprite The sprite that was exclusively owned by a juice motion.
   */
  static relinquishSpriteLock(sprite)
  {
    JuiceMotionManager.#spriteLocks.delete(sprite);
  }

  /**
   * Schedules a one-shot body squish on a sprite (scale pulse).
   * @param {Sprite} sprite The Pixi sprite.
   * @param {number} intensityScale Max delta applied via sine envelope (e.g. 0.12).
   * @param {number} durationFrames Frames to run.
   */
  static scheduleSquish(sprite, intensityScale, durationFrames)
  {
    JuiceMotionManager.#cancelSpriteLock(sprite);

    const effect = new JuiceSquishMotionEffect(sprite, intensityScale, durationFrames);

    JuiceMotionManager.#spriteLocks.set(sprite, effect);
    JuiceMotionManager.#effects.push(effect);
  }

  /**
   * Schedules a short tilt on the sprite (rotation around anchor).
   * @param {Sprite} sprite The Pixi sprite.
   * @param {number} peakRadians Peak rotation magnitude (radians).
   * @param {number} durationFrames Frames to run.
   */
  static scheduleTilt(sprite, peakRadians, durationFrames)
  {
    JuiceMotionManager.#cancelSpriteLock(sprite);

    const effect = new JuiceTiltMotionEffect(sprite, peakRadians, durationFrames);

    JuiceMotionManager.#spriteLocks.set(sprite, effect);
    JuiceMotionManager.#effects.push(effect);
  }

  /**
   * Schedules a casting pulse while {@link code frameFn} returns true (caller-driven envelope).
   * @param {Sprite} sprite The Pixi sprite.
   * @param {number} amplitudeScale Scale wobble amplitude (small, e.g. 0.04).
   * @param {function(): boolean} continuePredicate While true, pulse continues.
   */
  static scheduleCastingPulse(sprite, amplitudeScale, continuePredicate)
  {
    JuiceMotionManager.#cancelSpriteLock(sprite);

    const effect = new JuiceCastingPulseMotionEffect(sprite, amplitudeScale, continuePredicate);

    JuiceMotionManager.#spriteLocks.set(sprite, effect);
    JuiceMotionManager.#effects.push(effect);
  }

  /**
   * Cancels any active juice motion tied to this sprite.
   * @param {Sprite} sprite The Pixi sprite.
   */
  static cancelForSprite(sprite)
  {
    JuiceMotionManager.#cancelSpriteLock(sprite);
  }

  /**
   * Registers an external effect (usually a {@link JuiceBaseEffect} subclass) on the global queue.
   * @param {JuiceBaseEffect} effect The effect instance.
   */
  static pushExternalEffect(effect)
  {
    JuiceMotionManager.#effects.push(effect);
  }

  /**
   * Runs every frame while on the map (via {@link Scene_Map#update} alias).
   */
  static frameTick()
  {
    if (!JuiceMotionManager.#effects.length)
    {
      return;
    }

    const survivors = [];
    for (let i = 0; i < JuiceMotionManager.#effects.length; i++)
    {
      const effect = JuiceMotionManager.#effects[i];
      if (effect.tick())
      {
        survivors.push(effect);
      }
    }

    JuiceMotionManager.#effects.length = 0;
    survivors.forEach(s => JuiceMotionManager.#effects.push(s));
  }

  /**
   * Forces restoration if we still hold a lock on the sprite.
   * @param {Sprite} sprite The Pixi sprite.
   */
  static #cancelSpriteLock(sprite)
  {
    const held = JuiceMotionManager.#spriteLocks.get(sprite);
    if (!held)
    {
      return;
    }

    held.restore();

    JuiceMotionManager.#effects = JuiceMotionManager.#effects.filter(e => e !== held);
    JuiceMotionManager.#spriteLocks.delete(sprite);
  }
}
//endregion JuiceMotionManager