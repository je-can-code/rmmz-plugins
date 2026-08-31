//region plugins/abs/ext/juice/models/juice-base-effect.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('J-ABS-Juice JuiceBaseEffect (unit, pure class, no downstream dependencies)', () =>
{
  let JuiceBaseEffect;

  beforeAll(async () =>
  {
    ({ default: JuiceBaseEffect } = await import('../../../../../../src/plugins/abs/ext/juice/models/JuiceBaseEffect.js'));
  });

  describe('tick', () =>
  {
    it('throws, requiring subclasses to implement it', () =>
    {
      const effect = new JuiceBaseEffect();
      expect(() => effect.tick()).toThrow('JuiceBaseEffect.tick must be implemented by subclass.');
    });
  });

  describe('restore', () =>
  {
    it('leaves the effect untouched by default, so a subclass opts in rather than out', () =>
    {
      // Arrange- snapshotting the instance is what makes this load-bearing. `not.toThrow` alone
      // passes for a restore() that quietly mutates the effect, which is the whole thing the
      // default is promising not to do.
      const effect = new JuiceBaseEffect();
      const before = { ...effect };

      // Act
      effect.restore();

      // Assert
      expect({ ...effect }).toStrictEqual(before);
      expect(Object.keys(effect)).toHaveLength(0);
    });
  });

  describe('isSpriteAlive', () =>
  {
    it('is true by default', () =>
    {
      const effect = new JuiceBaseEffect();
      expect(effect.isSpriteAlive()).toBe(true);
    });
  });
});
//endregion plugins/abs/ext/juice/models/juice-base-effect.test.js
