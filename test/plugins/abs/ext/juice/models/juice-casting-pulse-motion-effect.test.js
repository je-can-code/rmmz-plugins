//region plugins/abs/ext/juice/models/juice-casting-pulse-motion-effect.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Juice JuiceCastingPulseMotionEffect (unit, all downstream dependencies mocked)', () =>
{
  let JuiceCastingPulseMotionEffect;
  let JuiceMotionManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    vi.doMock('../../../../../../src/plugins/abs/ext/juice/managers/JuiceMotionManager.js', () => ({
      default: { relinquishSpriteLock: vi.fn() },
    }));

    ({ default: JuiceCastingPulseMotionEffect } = await import('../../../../../../src/plugins/abs/ext/juice/models/JuiceCastingPulseMotionEffect.js'));
    ({ default: JuiceMotionManager } = await import('../../../../../../src/plugins/abs/ext/juice/managers/JuiceMotionManager.js'));
  });

  beforeEach(() =>
  {
    JuiceMotionManager.relinquishSpriteLock.mockReset();
  });

  function buildSprite()
  {
    return {
      scale: { x: 1, y: 1 },
      transform: {},
      getBlendColor: vi.fn(() => [ 0, 0, 0, 0 ]),
      getColorTone: vi.fn(() => [ 0, 0, 0, 0 ]),
      setBlendColor: vi.fn(),
      setColorTone: vi.fn(),
    };
  }

  describe('isSpriteAlive', () =>
  {
    it('is false once the sprite transform has been nulled', () =>
    {
      const sprite = buildSprite();
      const effect = new JuiceCastingPulseMotionEffect(sprite, 0.04, () => true);
      sprite.transform = null;
      expect(effect.isSpriteAlive()).toBe(false);
    });
  });

  describe('restore', () =>
  {
    it('resets scale and reapplies the captured blend/tone baselines', () =>
    {
      const sprite = buildSprite();
      const effect = new JuiceCastingPulseMotionEffect(sprite, 0.04, () => true);
      sprite.scale.x = 5;
      effect.restore();
      expect(sprite.scale.x).toBe(1);
      expect(sprite.setBlendColor).toHaveBeenCalledWith([ 0, 0, 0, 0 ]);
      expect(sprite.setColorTone).toHaveBeenCalledWith([ 0, 0, 0, 0 ]);
    });
  });

  describe('tick', () =>
  {
    it('stops, restores, and releases the sprite lock once the predicate goes false', () =>
    {
      const sprite = buildSprite();
      const effect = new JuiceCastingPulseMotionEffect(sprite, 0.04, () => false);

      const result = effect.tick();

      expect(result).toBe(false);
      expect(sprite.scale.x).toBe(1);
      expect(JuiceMotionManager.relinquishSpriteLock).toHaveBeenCalledWith(sprite);
    });

    it('continues pulsing while the predicate stays true', () =>
    {
      const sprite = buildSprite();
      const effect = new JuiceCastingPulseMotionEffect(sprite, 0.04, () => true);

      const result = effect.tick();

      expect(result).toBe(true);
      expect(JuiceMotionManager.relinquishSpriteLock).not.toHaveBeenCalled();
    });

    it('applies a symmetric scale pulse to both axes equally', () =>
    {
      const sprite = buildSprite();
      const effect = new JuiceCastingPulseMotionEffect(sprite, 0.04, () => true);

      effect.tick();

      expect(sprite.scale.x).toBe(sprite.scale.y);
      expect(sprite.scale.x).not.toBe(1);
    });

    it('applies a glow blend color scaled by the pulse wave', () =>
    {
      const sprite = buildSprite();
      const effect = new JuiceCastingPulseMotionEffect(sprite, 0.04, () => true);

      effect.tick();

      expect(sprite.setBlendColor).toHaveBeenCalledWith([ 180, 220, 255, expect.any(Number) ]);
    });
  });
});
//endregion plugins/abs/ext/juice/models/juice-casting-pulse-motion-effect.test.js
