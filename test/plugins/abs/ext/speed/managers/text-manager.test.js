//region plugins/abs/ext/speed/managers/text-manager.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('J-ABS-Speed TextManager (unit, no downstream dependencies)', () =>
{
  beforeAll(async () =>
  {
    globalThis.TextManager = {};
    await import('../../../../../../src/plugins/abs/ext/speed/managers/TextManager.js');
  });

  describe('movespeed', () =>
  {
    it('returns the display name for move speed boost', () =>
    {
      expect(globalThis.TextManager.movespeed()).toBe('Move Boost');
    });
  });

  describe('moveSpeedDescription', () =>
  {
    it('returns the description lines for move speed boost', () =>
    {
      expect(globalThis.TextManager.moveSpeedDescription()).toEqual([
        "The percentage modifier against this character's base movespeed.",
        'Higher amounts of this result in faster walk and run speeds.',
      ]);
    });
  });
});
//endregion plugins/abs/ext/speed/managers/text-manager.test.js
