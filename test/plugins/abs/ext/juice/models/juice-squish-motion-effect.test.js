//region plugins/abs/ext/juice/models/juice-squish-motion-effect.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Juice JuiceSquishMotionEffect (unit, all downstream dependencies mocked)', () =>
{
  let JuiceSquishMotionEffect;
  let JuiceMotionManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    vi.doMock('../../../../../../src/plugins/abs/ext/juice/managers/JuiceMotionManager.js', () => ({
      default: { relinquishSpriteLock: vi.fn() },
    }));

    ({ default: JuiceSquishMotionEffect } = await import('../../../../../../src/plugins/abs/ext/juice/models/JuiceSquishMotionEffect.js'));
    ({ default: JuiceMotionManager } = await import('../../../../../../src/plugins/abs/ext/juice/managers/JuiceMotionManager.js'));
  });

  beforeEach(() =>
  {
    JuiceMotionManager.relinquishSpriteLock.mockReset();
  });

  function buildSprite()
  {
    return { scale: { x: 1, y: 1 }, transform: {} };
  }

  describe('constructor', () =>
  {
    it('clamps a non-positive repeat count up to 1', () =>
    {
      const effect = new JuiceSquishMotionEffect(buildSprite(), 0.1, 10, 0);
      expect(effect._repeatCount).toBe(1);
    });

    it('defaults repeat count to 1 when omitted', () =>
    {
      const effect = new JuiceSquishMotionEffect(buildSprite(), 0.1, 10);
      expect(effect._repeatCount).toBe(1);
    });
  });

  describe('isSpriteAlive', () =>
  {
    it('is false once the sprite transform has been nulled', () =>
    {
      const sprite = buildSprite();
      const effect = new JuiceSquishMotionEffect(sprite, 0.1, 10);
      sprite.transform = null;
      expect(effect.isSpriteAlive()).toBe(false);
    });
  });

  describe('restore', () =>
  {
    it('snaps both scale axes back to their captured baselines', () =>
    {
      const sprite = buildSprite();
      const effect = new JuiceSquishMotionEffect(sprite, 0.1, 10);
      sprite.scale.x = 5;
      sprite.scale.y = 5;
      effect.restore();
      expect(sprite.scale.x).toBe(1);
      expect(sprite.scale.y).toBe(1);
    });
  });

  describe('tick', () =>
  {
    it('scales x and y inversely (squash on one axis, stretch on the other)', () =>
    {
      const sprite = buildSprite();
      const effect = new JuiceSquishMotionEffect(sprite, 0.2, 4);
      effect.tick();
      const envelope = Math.sin(0.25 * Math.PI);
      const mul = 1 + envelope * 0.2;
      expect(sprite.scale.x).toBeCloseTo(mul);
      expect(sprite.scale.y).toBeCloseTo(1 / mul);
    });

    it('resets the frame counter and continues when more repeat cycles remain', () =>
    {
      const sprite = buildSprite();
      const effect = new JuiceSquishMotionEffect(sprite, 0.2, 2, 2);
      effect.tick();
      const result = effect.tick();
      expect(result).toBe(true);
      expect(effect._frame).toBe(0);
      expect(JuiceMotionManager.relinquishSpriteLock).not.toHaveBeenCalled();
    });

    it('restores, releases the sprite lock, and returns false once all repeats are exhausted', () =>
    {
      const sprite = buildSprite();
      const effect = new JuiceSquishMotionEffect(sprite, 0.2, 2, 1);
      effect.tick();
      const result = effect.tick();
      expect(result).toBe(false);
      expect(sprite.scale.x).toBe(1);
      expect(JuiceMotionManager.relinquishSpriteLock).toHaveBeenCalledWith(sprite);
    });
  });
});
//endregion plugins/abs/ext/juice/models/juice-squish-motion-effect.test.js
