//region plugins/abs/ext/juice/models/juice-flip-body-motion-effect.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Juice JuiceFlipBodyMotionEffect (unit, all downstream dependencies mocked)', () =>
{
  let JuiceFlipBodyMotionEffect;
  let JuiceMotionManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    vi.doMock('../../../../../../src/plugins/abs/ext/juice/managers/JuiceMotionManager.js', () => ({
      default: { relinquishSpriteLock: vi.fn() },
    }));

    ({ default: JuiceFlipBodyMotionEffect } = await import('../../../../../../src/plugins/abs/ext/juice/models/JuiceFlipBodyMotionEffect.js'));
    ({ default: JuiceMotionManager } = await import('../../../../../../src/plugins/abs/ext/juice/managers/JuiceMotionManager.js'));
  });

  beforeEach(() =>
  {
    JuiceMotionManager.relinquishSpriteLock.mockReset();
  });

  function buildSprite()
  {
    return { rotation: 0, anchor: { x: 0.5, y: 1 }, transform: {}, _juiceFlipping: false };
  }

  describe('constructor', () =>
  {
    it('re-centers the anchor to the visual midpoint for in-place rotation', () =>
    {
      const sprite = buildSprite();
      const effect = new JuiceFlipBodyMotionEffect(sprite, 1, 10);
      expect(effect).toBeInstanceOf(JuiceFlipBodyMotionEffect);
      expect(sprite.anchor.x).toBe(0.5);
      expect(sprite.anchor.y).toBe(0.5);
    });

    it('clamps a non-positive repeat count up to 1', () =>
    {
      const effect = new JuiceFlipBodyMotionEffect(buildSprite(), 1, 10, 0);
      expect(effect._repeatCount).toBe(1);
    });
  });

  describe('tick', () =>
  {
    it('flags the sprite as juice-flipping on the very first tick', () =>
    {
      const sprite = buildSprite();
      const effect = new JuiceFlipBodyMotionEffect(sprite, 1, 4);
      effect.tick();
      expect(sprite._juiceFlipping).toBe(true);
    });

    it('sweeps rotation clockwise for a positive direction sign', () =>
    {
      const sprite = buildSprite();
      const effect = new JuiceFlipBodyMotionEffect(sprite, 1, 4, 1);
      effect.tick();
      expect(sprite.rotation).toBeCloseTo(0.25 * Math.PI * 2);
    });

    it('sweeps rotation counter-clockwise for a negative direction sign', () =>
    {
      const sprite = buildSprite();
      const effect = new JuiceFlipBodyMotionEffect(sprite, -1, 4, 1);
      effect.tick();
      expect(sprite.rotation).toBeCloseTo(-0.25 * Math.PI * 2);
    });

    it('scales the total sweep by the repeat count', () =>
    {
      const sprite = buildSprite();
      const effect = new JuiceFlipBodyMotionEffect(sprite, 1, 4, 2);
      effect.tick();
      expect(sprite.rotation).toBeCloseTo(0.25 * Math.PI * 2 * 2);
    });

    it('restores rotation, anchor, and the flipping flag once the duration completes', () =>
    {
      const sprite = buildSprite();
      const effect = new JuiceFlipBodyMotionEffect(sprite, 1, 2);
      effect.tick();
      const result = effect.tick();
      expect(result).toBe(false);
      expect(sprite._juiceFlipping).toBe(false);
      expect(sprite.rotation).toBe(0);
      expect(sprite.anchor.y).toBe(1);
      expect(JuiceMotionManager.relinquishSpriteLock).toHaveBeenCalledWith(sprite);
    });
  });
});
//endregion plugins/abs/ext/juice/models/juice-flip-body-motion-effect.test.js
