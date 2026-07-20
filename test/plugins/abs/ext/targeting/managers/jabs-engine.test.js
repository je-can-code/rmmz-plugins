//region plugins/abs/ext/targeting/managers/jabs-engine.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Targeting JABS_Engine augments (direct src import)', () =>
{
  let JABS_Engine;
  let originalCanUpdateInput;
  let isActiveMock;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { TARGETING: { Aliased: { JABS_Engine: new Map() } } } } };

    function StubJABSEngine()
    {
    }
    originalCanUpdateInput = vi.fn(() => true);
    StubJABSEngine.prototype.canUpdateInput = originalCanUpdateInput;
    globalThis.JABS_Engine = StubJABSEngine;

    isActiveMock = vi.fn(() => false);
    vi.doMock('../../../../../../src/plugins/abs/ext/targeting/managers/JABS_TargetingManager.js', () => ({
      default: { isActive: isActiveMock },
    }));

    await import('../../../../../../src/plugins/abs/ext/targeting/managers/JABS_Engine.js');
    ({ JABS_Engine } = globalThis);
  });

  beforeEach(() =>
  {
    originalCanUpdateInput.mockClear().mockReturnValue(true);
    isActiveMock.mockClear().mockReturnValue(false);
  });

  describe('canUpdateInput', () =>
  {
    it('is false when a targeting session is active, without calling through', () =>
    {
      isActiveMock.mockReturnValue(true);
      const engine = new JABS_Engine();

      expect(engine.canUpdateInput()).toBe(false);
      expect(originalCanUpdateInput).not.toHaveBeenCalled();
    });

    it('falls through to the original logic when no targeting session is active', () =>
    {
      isActiveMock.mockReturnValue(false);
      originalCanUpdateInput.mockReturnValue(true);
      const engine = new JABS_Engine();

      expect(engine.canUpdateInput()).toBe(true);
      expect(originalCanUpdateInput).toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/abs/ext/targeting/managers/jabs-engine.test.js
