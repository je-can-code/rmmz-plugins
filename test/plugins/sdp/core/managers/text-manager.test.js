//region plugins/sdp/core/managers/text-manager.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('TextManager ext/sdp augments (direct src import)', () =>
{
  beforeAll(async () =>
  {
    globalThis.TextManager = {};
    globalThis.J = { SDP: { Metadata: { sdpPointsDisplayName: 'Node Points' } } };

    await import('../../../../../src/plugins/sdp/core/managers/TextManager.js');
  });

  describe('sdpPoints', () =>
  {
    it('reads the configured points display name from plugin metadata', () =>
    {
      // Arrange/Act
      const result = globalThis.TextManager.sdpPoints();

      // Assert
      expect(result).toEqual('Node Points');
    });
  });

  describe('sdpMultiplier', () =>
  {
    it('returns the fixed multiplier label', () =>
    {
      // Arrange/Act
      const result = globalThis.TextManager.sdpMultiplier();

      // Assert
      expect(result).toEqual('Node Points UP');
    });
  });

  describe('sdpMultiplierDescription', () =>
  {
    it('returns the two-line description', () =>
    {
      // Arrange/Act
      const result = globalThis.TextManager.sdpMultiplierDescription();

      // Assert
      expect(result).toHaveLength(2);
    });
  });
});
//endregion plugins/sdp/core/managers/text-manager.test.js
