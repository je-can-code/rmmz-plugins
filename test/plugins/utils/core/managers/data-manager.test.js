//region plugins/utils/core/managers/data-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('DataManager ext/utils augments (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      UTILS: {
        Aliased: { DataManager: new Map() },
        Metadata: { useCircularSaveDataCheck: false },
        Helpers: { depth: vi.fn().mockReturnValue(0) },
      },
    };

    globalThis.DataManager = { makeSaveContents: vi.fn() };

    await import('../../../../../src/plugins/utils/core/managers/DataManager.js');
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.J.UTILS.Metadata.useCircularSaveDataCheck = false;
  });

  describe('makeSaveContents', () =>
  {
    it('always calls through to the original aliased implementation and returns its contents', () =>
    {
      // Arrange
      const contents = { map: { _events: [] } };
      globalThis.J.UTILS.Aliased.DataManager.get('makeSaveContents').mockReturnValue(contents);

      // Act
      const result = globalThis.DataManager.makeSaveContents();

      // Assert
      expect(globalThis.J.UTILS.Aliased.DataManager.get('makeSaveContents')).toHaveBeenCalled();
      expect(result).toBe(contents);
    });

    it('does not log the circular-check diagnostics when the metadata flag is disabled', () =>
    {
      // Arrange
      globalThis.J.UTILS.Metadata.useCircularSaveDataCheck = false;
      globalThis.J.UTILS.Aliased.DataManager.get('makeSaveContents').mockReturnValue({ map: { _events: [ {} ] } });
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Act
      globalThis.DataManager.makeSaveContents();

      // Assert
      expect(logSpy).not.toHaveBeenCalled();
      logSpy.mockRestore();
    });

    it('logs the circular-check diagnostics for each map event when the metadata flag is enabled', () =>
    {
      // Arrange
      globalThis.J.UTILS.Metadata.useCircularSaveDataCheck = true;
      const mapEvent = {};
      globalThis.J.UTILS.Aliased.DataManager.get('makeSaveContents').mockReturnValue({ map: { _events: [ mapEvent ] } });
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Act
      globalThis.DataManager.makeSaveContents();

      // Assert
      expect(globalThis.J.UTILS.Helpers.depth).toHaveBeenCalledWith(mapEvent);
      logSpy.mockRestore();
    });
  });
});
//endregion plugins/utils/core/managers/data-manager.test.js
