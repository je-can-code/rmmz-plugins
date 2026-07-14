//region plugins/abs/ext/speed/managers/icon-manager.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('J-ABS-Speed IconManager (unit, no downstream dependencies)', () =>
{
  beforeAll(async () =>
  {
    globalThis.IconManager = {};
    await import('../../../../../../src/plugins/abs/ext/speed/managers/IconManager.js');
  });

  describe('movespeed', () =>
  {
    it('returns the move-speed-boost icon index', () =>
    {
      expect(globalThis.IconManager.movespeed()).toBe(978);
    });
  });
});
//endregion plugins/abs/ext/speed/managers/icon-manager.test.js
