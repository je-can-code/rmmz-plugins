//region plugins/sdp/core/managers/icon-manager.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('IconManager ext/sdp augments (direct src import)', () =>
{
  beforeAll(async () =>
  {
    globalThis.IconManager = {};
    await import('../../../../../src/plugins/sdp/core/managers/IconManager.js');
  });

  describe('sdpMultiplier', () =>
  {
    it('returns the fixed sdp multiplier icon index', () =>
    {
      // Arrange/Act
      const result = globalThis.IconManager.sdpMultiplier();

      // Assert
      expect(result).toEqual(2229);
    });
  });
});
//endregion plugins/sdp/core/managers/icon-manager.test.js
