//region plugins/extend/core/managers/data-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('DataManager ext/extend augments (direct src import)', () =>
{
  let FakeOverlayManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    FakeOverlayManager = { clearCache: vi.fn() };
    vi.doMock('../../../../../src/plugins/extend/core/managers/OverlayManager.js', () => ({ default: FakeOverlayManager }));

    globalThis.J = { EXTEND: { Aliased: { DataManager: new Map() } } };

    globalThis.DataManager = {
      setupNewGame: vi.fn(),
      extractSaveContents: vi.fn(),
      setupBattleTest: vi.fn(),
    };

    await import('../../../../../src/plugins/extend/core/managers/DataManager.js');
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  describe('setupNewGame', () =>
  {
    it('clears the overlay cache before calling through to the original aliased implementation', () =>
    {
      // Arrange
      const callOrder = [];
      FakeOverlayManager.clearCache.mockImplementation(() => callOrder.push('clear'));
      globalThis.J.EXTEND.Aliased.DataManager.get('setupNewGame').mockImplementation(() => callOrder.push('original'));

      // Act
      globalThis.DataManager.setupNewGame();

      // Assert
      expect(callOrder).toEqual([ 'clear', 'original' ]);
    });
  });

  describe('extractSaveContents', () =>
  {
    it('clears the overlay cache before calling through with the save contents', () =>
    {
      // Arrange
      const contents = {};

      // Act
      globalThis.DataManager.extractSaveContents(contents);

      // Assert
      expect(FakeOverlayManager.clearCache).toHaveBeenCalled();
      expect(globalThis.J.EXTEND.Aliased.DataManager.get('extractSaveContents')).toHaveBeenCalledWith(contents);
    });
  });

  describe('setupBattleTest', () =>
  {
    it('clears the overlay cache before calling through to the original aliased implementation', () =>
    {
      // Arrange/Act
      globalThis.DataManager.setupBattleTest();

      // Assert
      expect(FakeOverlayManager.clearCache).toHaveBeenCalled();
      expect(globalThis.J.EXTEND.Aliased.DataManager.get('setupBattleTest')).toHaveBeenCalled();
    });
  });
});
//endregion plugins/extend/core/managers/data-manager.test.js
