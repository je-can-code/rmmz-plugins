//region plugins/abs/ext/juice/managers/juice-motion-manager.test.js
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Juice JuiceMotionManager (unit, all downstream dependencies mocked)', () =>
{
  /** duck-typed stand-in shared by every scheduled-effect mock- carries what frameTick reads. */
  function buildFakeEffect(overrides = {})
  {
    return Object.assign({
      isSpriteAlive: vi.fn(() => true),
      tick: vi.fn(() => true),
      restore: vi.fn(),
    }, overrides);
  }

  /** @type {typeof import('../../../../../../src/plugins/abs/ext/juice/managers/JuiceMotionManager.js').default} */
  let JuiceMotionManager;
  let FakeTilt;
  let FakeSquish;
  let FakeCastingPulse;
  let FakeFlipBody;

  beforeEach(async () =>
  {
    vi.resetModules();

    // plain (non-arrow) functions invoked with `new` return their explicit object return value
    // instead of `this`- that lets these mocks work as constructors while still being vi.fn()s
    // whose per-call return value can be swapped out via mockImplementationOnce.
    FakeTilt = vi.fn(function() { return buildFakeEffect(); });
    FakeSquish = vi.fn(function() { return buildFakeEffect(); });
    FakeCastingPulse = vi.fn(function() { return buildFakeEffect(); });
    FakeFlipBody = vi.fn(function() { return buildFakeEffect(); });

    vi.doMock('../../../../../../src/plugins/abs/ext/juice/models/JuiceTiltMotionEffect.js', () => ({ default: FakeTilt }));
    vi.doMock('../../../../../../src/plugins/abs/ext/juice/models/JuiceSquishMotionEffect.js', () => ({ default: FakeSquish }));
    vi.doMock('../../../../../../src/plugins/abs/ext/juice/models/JuiceCastingPulseMotionEffect.js', () => ({ default: FakeCastingPulse }));
    vi.doMock('../../../../../../src/plugins/abs/ext/juice/models/JuiceFlipBodyMotionEffect.js', () => ({ default: FakeFlipBody }));
    vi.doMock('../../../../../../src/plugins/abs/ext/juice/models/JuiceBaseEffect.js', () => ({ default: class {} }));

    ({ default: JuiceMotionManager } = await import('../../../../../../src/plugins/abs/ext/juice/managers/JuiceMotionManager.js'));
  });

  describe('scheduling', () =>
  {
    it('scheduleSquish constructs and queues a squish effect for the sprite', () =>
    {
      const sprite = {};
      JuiceMotionManager.scheduleSquish(sprite, 0.1, 10, 2);
      expect(FakeSquish).toHaveBeenCalledWith(sprite, 0.1, 10, 2);
    });

    it('scheduleTilt constructs and queues a tilt effect for the sprite', () =>
    {
      const sprite = {};
      JuiceMotionManager.scheduleTilt(sprite, 0.2, 8);
      expect(FakeTilt).toHaveBeenCalledWith(sprite, 0.2, 8);
    });

    it('scheduleFlipBody constructs and queues a flip effect for the sprite', () =>
    {
      const sprite = {};
      JuiceMotionManager.scheduleFlipBody(sprite, 1, 20, 2);
      expect(FakeFlipBody).toHaveBeenCalledWith(sprite, 1, 20, 2);
    });

    it('scheduleCastingPulse constructs and queues a casting pulse effect for the sprite', () =>
    {
      const sprite = {};
      const predicate = () => true;
      JuiceMotionManager.scheduleCastingPulse(sprite, 0.04, predicate);
      expect(FakeCastingPulse).toHaveBeenCalledWith(sprite, 0.04, predicate);
    });

    it('cancels and restores any prior effect already locking the sprite before scheduling a new one', () =>
    {
      const sprite = {};
      const priorEffect = buildFakeEffect();
      FakeTilt.mockImplementationOnce(function() { return priorEffect; });

      JuiceMotionManager.scheduleTilt(sprite, 0.2, 8);
      JuiceMotionManager.scheduleSquish(sprite, 0.1, 10);

      expect(priorEffect.restore).toHaveBeenCalledTimes(1);
    });
  });

  describe('cancelForSprite', () =>
  {
    it('restores and removes the active effect for the given sprite', () =>
    {
      const sprite = {};
      const effect = buildFakeEffect();
      FakeTilt.mockImplementationOnce(function() { return effect; });
      JuiceMotionManager.scheduleTilt(sprite, 0.2, 8);

      JuiceMotionManager.cancelForSprite(sprite);

      expect(effect.restore).toHaveBeenCalledTimes(1);
    });

    it('does nothing when the sprite has no active effect', () =>
    {
      expect(() => JuiceMotionManager.cancelForSprite({})).not.toThrow();
    });
  });

  describe('pushExternalEffect', () =>
  {
    it('adds the external effect to the frame-tick queue', () =>
    {
      const effect = buildFakeEffect();
      JuiceMotionManager.pushExternalEffect(effect);

      JuiceMotionManager.frameTick();

      expect(effect.tick).toHaveBeenCalledTimes(1);
    });
  });

  describe('frameTick', () =>
  {
    it('does nothing when there are no queued effects', () =>
    {
      expect(() => JuiceMotionManager.frameTick()).not.toThrow();
    });

    it('ticks every alive queued effect', () =>
    {
      const sprite = {};
      const effect = buildFakeEffect();
      FakeTilt.mockImplementationOnce(function() { return effect; });
      JuiceMotionManager.scheduleTilt(sprite, 0.2, 8);

      JuiceMotionManager.frameTick();

      expect(effect.tick).toHaveBeenCalledTimes(1);
    });

    it('skips ticking (and silently discards) an effect whose sprite has died', () =>
    {
      const sprite = {};
      const effect = buildFakeEffect({ isSpriteAlive: () => false });
      FakeTilt.mockImplementationOnce(function() { return effect; });
      JuiceMotionManager.scheduleTilt(sprite, 0.2, 8);

      JuiceMotionManager.frameTick();

      expect(effect.tick).not.toHaveBeenCalled();
    });

    it('keeps an effect in the queue for the next frame when tick() returns true', () =>
    {
      const sprite = {};
      const effect = buildFakeEffect({ tick: vi.fn(() => true) });
      FakeTilt.mockImplementationOnce(function() { return effect; });
      JuiceMotionManager.scheduleTilt(sprite, 0.2, 8);

      JuiceMotionManager.frameTick();
      JuiceMotionManager.frameTick();

      expect(effect.tick).toHaveBeenCalledTimes(2);
    });

    it('drops an effect from the queue once tick() returns false', () =>
    {
      const sprite = {};
      const effect = buildFakeEffect({ tick: vi.fn(() => false) });
      FakeTilt.mockImplementationOnce(function() { return effect; });
      JuiceMotionManager.scheduleTilt(sprite, 0.2, 8);

      JuiceMotionManager.frameTick();
      JuiceMotionManager.frameTick();

      expect(effect.tick).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearAll', () =>
  {
    it('empties the queue so a subsequent frameTick ticks nothing', () =>
    {
      const sprite = {};
      const effect = buildFakeEffect();
      FakeTilt.mockImplementationOnce(function() { return effect; });
      JuiceMotionManager.scheduleTilt(sprite, 0.2, 8);

      JuiceMotionManager.clearAll();
      JuiceMotionManager.frameTick();

      expect(effect.tick).not.toHaveBeenCalled();
    });

    it('clears sprite locks too, so a fresh schedule on the same sprite does not restore a stale effect', () =>
    {
      const sprite = {};
      const effect = buildFakeEffect();
      FakeTilt.mockImplementationOnce(function() { return effect; });
      JuiceMotionManager.scheduleTilt(sprite, 0.2, 8);

      JuiceMotionManager.clearAll();
      JuiceMotionManager.scheduleSquish(sprite, 0.1, 10);

      expect(effect.restore).not.toHaveBeenCalled();
    });
  });

  describe('relinquishSpriteLock', () =>
  {
    it('releases the lock so a subsequent cancelForSprite call finds nothing to restore', () =>
    {
      const sprite = {};
      const effect = buildFakeEffect();
      FakeTilt.mockImplementationOnce(function() { return effect; });
      JuiceMotionManager.scheduleTilt(sprite, 0.2, 8);

      JuiceMotionManager.relinquishSpriteLock(sprite);
      JuiceMotionManager.cancelForSprite(sprite);

      expect(effect.restore).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/abs/ext/juice/managers/juice-motion-manager.test.js
