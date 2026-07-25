//region plugins/diff/core/managers/data-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('DataManager ext/diff augments (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { DIFFICULTY: { Aliased: { DataManager: new Map() } } };
    globalThis.DataManager = { setupNewGame: vi.fn() };

    await import('../../../../../src/plugins/diff/core/managers/DataManager.js');
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.$gameTemp = { setupDifficultySystem: vi.fn() };
  });

  describe('setupNewGame', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange/Act
      globalThis.DataManager.setupNewGame();

      // Assert
      expect(globalThis.J.DIFFICULTY.Aliased.DataManager.get('setupNewGame')).toHaveBeenCalled();
    });

    it('sets up the difficulty system in the temp data', () =>
    {
      // Arrange/Act
      globalThis.DataManager.setupNewGame();

      // Assert
      expect(globalThis.$gameTemp.setupDifficultySystem).toHaveBeenCalled();
    });
  });
});
//endregion plugins/diff/core/managers/data-manager.test.js
