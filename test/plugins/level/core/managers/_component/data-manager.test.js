//region plugins/level/core/managers/_component/data-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('DataManager level augments (direct src import)', () =>
{
  let DataManager;
  let originalSetupNewGame;

  beforeAll(async () =>
  {
    vi.resetModules();

    originalSetupNewGame = vi.fn();

    globalThis.J = { LEVEL: { Aliased: { DataManager: new Map() } } };
    globalThis.DataManager = { setupNewGame: originalSetupNewGame };

    await import('../../../../../../src/plugins/level/core/managers/DataManager.js');
    ({ DataManager } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.$gameTemp = { buildBeyondMaxData: vi.fn() };
  });

  it('calls through to original logic and builds the beyond-max data', () =>
  {
    // Act
    DataManager.setupNewGame();

    // Assert
    expect(originalSetupNewGame).toHaveBeenCalled();
    expect(globalThis.$gameTemp.buildBeyondMaxData).toHaveBeenCalled();
  });
});
//endregion plugins/level/core/managers/_component/data-manager.test.js
