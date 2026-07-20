//region plugins/abs/ext/targeting/managers/jabs-ai-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Targeting JABS_AiManager augments (direct src import)', () =>
{
  let JABS_AiManager;
  let originalCanUpdate;
  let isActiveMock;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { TARGETING: { Aliased: { JABS_AiManager: new Map() } } } } };

    originalCanUpdate = vi.fn(() => true);
    globalThis.JABS_AiManager = { canUpdate: originalCanUpdate };

    isActiveMock = vi.fn(() => false);
    vi.doMock('../../../../../../src/plugins/abs/ext/targeting/managers/JABS_TargetingManager.js', () => ({
      default: { isActive: isActiveMock },
    }));

    ({ JABS_AiManager } = globalThis);
    await import('../../../../../../src/plugins/abs/ext/targeting/managers/JABS_AiManager.js');
  });

  beforeEach(() =>
  {
    originalCanUpdate.mockClear().mockReturnValue(true);
    isActiveMock.mockClear().mockReturnValue(false);
  });

  describe('canUpdate', () =>
  {
    it('is false when a targeting session is active, without calling through', () =>
    {
      isActiveMock.mockReturnValue(true);

      expect(JABS_AiManager.canUpdate()).toBe(false);
      expect(originalCanUpdate).not.toHaveBeenCalled();
    });

    it('falls through to the original logic when no targeting session is active', () =>
    {
      isActiveMock.mockReturnValue(false);
      originalCanUpdate.mockReturnValue(true);

      expect(JABS_AiManager.canUpdate()).toBe(true);
      expect(originalCanUpdate).toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/abs/ext/targeting/managers/jabs-ai-manager.test.js
