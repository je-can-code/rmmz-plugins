//region plugins/abs/ext/hitstop/managers/data-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Hitstop DataManager (unit, all downstream dependencies mocked)', () =>
{
  /** @type {import('vitest').Mock} the "original" (aliased) extractSaveContents. */
  let originalExtractSaveContents;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        EXT: {
          HITSTOP: {
            Aliased: { DataManager: new Map() },
          },
        },
      },
    };

    originalExtractSaveContents = vi.fn();
    globalThis.DataManager = { extractSaveContents: originalExtractSaveContents };

    // the file under test- patches globalThis.DataManager directly, no vm involved.
    await import('../../../../../../src/plugins/abs/ext/hitstop/managers/DataManager.js');
  });

  beforeEach(() =>
  {
    originalExtractSaveContents.mockReset();
  });

  describe('extractSaveContents', () =>
  {
    it('performs the original logic then reinitializes hitstop members on every character', () =>
    {
      // Arrange
      const follower = { initHitstopMembers: vi.fn() };
      const event = { initHitstopMembers: vi.fn() };
      const playerInitHitstopMembers = vi.fn();
      globalThis.$gamePlayer = {
        initHitstopMembers: playerInitHitstopMembers,
        followers: () => ({ data: () => [ follower ] }),
      };
      globalThis.$gameMap = { events: () => [ event ] };
      const contents = { id: 'save-contents' };

      // Act
      globalThis.DataManager.extractSaveContents(contents);

      // Assert
      expect(originalExtractSaveContents).toHaveBeenCalledWith(contents);
      expect(playerInitHitstopMembers).toHaveBeenCalledTimes(1);
      expect(follower.initHitstopMembers).toHaveBeenCalledTimes(1);
      expect(event.initHitstopMembers).toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/abs/ext/hitstop/managers/data-manager.test.js
