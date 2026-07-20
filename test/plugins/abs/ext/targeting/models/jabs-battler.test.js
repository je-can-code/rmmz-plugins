//region plugins/abs/ext/targeting/models/jabs-battler.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Targeting JABS_Battler augments (direct src import)', () =>
{
  let JABS_Battler;
  let originalCanUpdateEngagement;
  let isActiveMock;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { TARGETING: { Aliased: { JABS_Battler: new Map() } } } } };

    function StubJABSBattler()
    {
    }
    originalCanUpdateEngagement = vi.fn(() => true);
    StubJABSBattler.prototype.canUpdateEngagement = originalCanUpdateEngagement;
    globalThis.JABS_Battler = StubJABSBattler;

    isActiveMock = vi.fn(() => false);
    vi.doMock('../../../../../../src/plugins/abs/ext/targeting/managers/JABS_TargetingManager.js', () => ({
      default: { isActive: isActiveMock },
    }));

    await import('../../../../../../src/plugins/abs/ext/targeting/models/JABS_Battler.js');
    ({ JABS_Battler } = globalThis);
  });

  beforeEach(() =>
  {
    originalCanUpdateEngagement.mockClear().mockReturnValue(true);
    isActiveMock.mockClear().mockReturnValue(false);
  });

  describe('canUpdateEngagement', () =>
  {
    it('is false when a targeting session is active, without calling through', () =>
    {
      isActiveMock.mockReturnValue(true);
      const battler = new JABS_Battler();

      expect(battler.canUpdateEngagement()).toBe(false);
      expect(originalCanUpdateEngagement).not.toHaveBeenCalled();
    });

    it('falls through to the original logic when no targeting session is active', () =>
    {
      isActiveMock.mockReturnValue(false);
      originalCanUpdateEngagement.mockReturnValue(true);
      const battler = new JABS_Battler();

      expect(battler.canUpdateEngagement()).toBe(true);
      expect(originalCanUpdateEngagement).toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/abs/ext/targeting/models/jabs-battler.test.js
