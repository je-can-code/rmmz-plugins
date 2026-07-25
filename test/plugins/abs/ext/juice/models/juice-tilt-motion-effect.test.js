//region plugins/abs/ext/juice/models/juice-tilt-motion-effect.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Juice JuiceTiltMotionEffect (unit, all downstream dependencies mocked)', () =>
{
  let JuiceTiltMotionEffect;
  let JuiceMotionManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    vi.doMock('../../../../../../src/plugins/abs/ext/juice/managers/JuiceMotionManager.js', () => ({
      default: { relinquishSpriteLock: vi.fn() },
    }));

    ({ default: JuiceTiltMotionEffect } = await import('../../../../../../src/plugins/abs/ext/juice/models/JuiceTiltMotionEffect.js'));
    ({ default: JuiceMotionManager } = await import('../../../../../../src/plugins/abs/ext/juice/managers/JuiceMotionManager.js'));
  });

  beforeEach(() =>
  {
    JuiceMotionManager.relinquishSpriteLock.mockReset();
  });

  function buildSprite()
  {
    return { rotation: 0.5, transform: {} };
  }

  describe('constructor', () =>
  {
    it('captures the sprite\'s current rotation as the baseline', () =>
    {
      const sprite = buildSprite();
      const effect = new JuiceTiltMotionEffect(sprite, 0.3, 10);
      expect(effect._baseRotation).toBe(0.5);
    });
  });

  describe('isSpriteAlive', () =>
  {
    it('is true while the sprite has a transform', () =>
    {
      const effect = new JuiceTiltMotionEffect(buildSprite(), 0.3, 10);
      expect(effect.isSpriteAlive()).toBe(true);
    });

    it('is false once the sprite transform has been nulled', () =>
    {
      const sprite = buildSprite();
      const effect = new JuiceTiltMotionEffect(sprite, 0.3, 10);
      sprite.transform = null;
      expect(effect.isSpriteAlive()).toBe(false);
    });
  });

  describe('restore', () =>
  {
    it('snaps rotation back to the captured baseline', () =>
    {
      const sprite = buildSprite();
      const effect = new JuiceTiltMotionEffect(sprite, 0.3, 10);
      sprite.rotation = 99;
      effect.restore();
      expect(sprite.rotation).toBe(0.5);
    });
  });

  describe('tick', () =>
  {
    it('applies a sine envelope of the peak rotation on top of the baseline', () =>
    {
      const sprite = buildSprite();
      const effect = new JuiceTiltMotionEffect(sprite, 1, 4);
      effect.tick();
      expect(sprite.rotation).toBeCloseTo(0.5 + Math.sin(0.25 * Math.PI) * 1);
    });

    it('returns true while frames remain', () =>
    {
      const effect = new JuiceTiltMotionEffect(buildSprite(), 0.3, 4);
      expect(effect.tick()).toBe(true);
    });

    it('restores, releases the sprite lock, and returns false once the duration completes', () =>
    {
      const sprite = buildSprite();
      const effect = new JuiceTiltMotionEffect(sprite, 0.3, 2);
      effect.tick();
      const result = effect.tick();
      expect(result).toBe(false);
      expect(sprite.rotation).toBe(0.5);
      expect(JuiceMotionManager.relinquishSpriteLock).toHaveBeenCalledWith(sprite);
    });
  });
});
//endregion plugins/abs/ext/juice/models/juice-tilt-motion-effect.test.js
