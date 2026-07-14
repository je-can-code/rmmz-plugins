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
    it('is a no-op by default', () =>
    {
      const effect = new JuiceBaseEffect();
      expect(() => effect.restore()).not.toThrow();
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
