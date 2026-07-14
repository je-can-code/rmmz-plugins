//region plugins/abs/ext/shield/managers/jabs-engine.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Shield JABS_Engine (unit, all downstream dependencies mocked)', () =>
{
  let originalRefreshJabsState;
  let originalExtendJabsState;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { SHIELD: { Aliased: { JABS_Engine: new Map() } } } } };

    function JABS_Engine()
    {
    }

    originalRefreshJabsState = vi.fn();
    originalExtendJabsState = vi.fn();
    JABS_Engine.prototype.refreshJabsState = originalRefreshJabsState;
    JABS_Engine.prototype.extendJabsState = originalExtendJabsState;
    globalThis.JABS_Engine = JABS_Engine;

    await import('../../../../../../src/plugins/abs/ext/shield/managers/JABS_Engine.js');
  });

  beforeEach(() =>
  {
    originalRefreshJabsState.mockReset();
    originalExtendJabsState.mockReset();
  });

  function buildEngine()
  {
    return Object.create(globalThis.JABS_Engine.prototype);
  }

  function buildJabsState()
  {
    return { recalculateShield: vi.fn(), refreshShield: vi.fn() };
  }

  describe('refreshJabsState', () =>
  {
    it('recalculates and refreshes the shield before performing the original logic', () =>
    {
      // Arrange
      const engine = buildEngine();
      const jabsState = buildJabsState();
      const newJabsState = { id: 'new' };
      const callOrder = [];
      jabsState.recalculateShield.mockImplementation(() => callOrder.push('recalculate'));
      jabsState.refreshShield.mockImplementation(() => callOrder.push('refresh'));
      originalRefreshJabsState.mockImplementation(() => callOrder.push('original'));

      // Act
      engine.refreshJabsState(jabsState, newJabsState);

      // Assert
      expect(callOrder).toEqual([ 'recalculate', 'refresh', 'original' ]);
      expect(originalRefreshJabsState).toHaveBeenCalledWith(jabsState, newJabsState);
    });
  });

  describe('extendJabsState', () =>
  {
    it('recalculates and refreshes the shield before performing the original logic', () =>
    {
      // Arrange
      const engine = buildEngine();
      const jabsState = buildJabsState();
      const newJabsState = { id: 'new' };
      const callOrder = [];
      jabsState.recalculateShield.mockImplementation(() => callOrder.push('recalculate'));
      jabsState.refreshShield.mockImplementation(() => callOrder.push('refresh'));
      originalExtendJabsState.mockImplementation(() => callOrder.push('original'));

      // Act
      engine.extendJabsState(jabsState, newJabsState);

      // Assert
      expect(callOrder).toEqual([ 'recalculate', 'refresh', 'original' ]);
      expect(originalExtendJabsState).toHaveBeenCalledWith(jabsState, newJabsState);
    });
  });
});
//endregion plugins/abs/ext/shield/managers/jabs-engine.test.js
