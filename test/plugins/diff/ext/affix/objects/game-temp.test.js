//region plugins/diff/ext/affix/objects/game-temp.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Which layers are enabled is the one genuinely runtime part of this extension, so the cached pools
 * have to be rebuilt whenever that set changes. This alias is the single seam every such path passes
 * through - new game, save load, and toggling a layer in the difficulty scene all reach it - which
 * is why it is aliased here rather than at any of the three individually.
 */
describe('Game_Temp affix pool invalidation (direct src import)', () =>
{
  let originalCalls;
  let rebuildCalls;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      DIFFICULTY: { EXT: { AFFIX: { Aliased: { Game_Temp: new Map() } } } },
    };

    globalThis.Game_Temp = function Game_Temp()
    {
    };

    globalThis.Game_Temp.prototype.refreshAppliedDifficulty = function()
    {
      originalCalls.push('original');
    };

    await import('../../../../../../src/plugins/diff/ext/affix/objects/Game_Temp.js');
  });

  beforeEach(() =>
  {
    originalCalls = [];
    rebuildCalls = [];

    globalThis.J.DIFFICULTY.EXT.AFFIX.Metadata = {
      buildEffectivePools: () => rebuildCalls.push('rebuild'),
    };
  });

  it('rebuilds the pools when the applied difficulty is refreshed', () =>
  {
    // Arrange
    const gameTemp = new globalThis.Game_Temp();

    // Act
    gameTemp.refreshAppliedDifficulty();

    // Assert
    expect(rebuildCalls.length).toBe(1);
  });

  it('still performs the original refresh', () =>
  {
    // Arrange- the alias adds to the base behavior rather than replacing it; dropping the original
    // would leave every parameter effect stale while the affixes updated.
    const gameTemp = new globalThis.Game_Temp();

    // Act
    gameTemp.refreshAppliedDifficulty();

    // Assert
    expect(originalCalls.length).toBe(1);
  });

  it('rebuilds again on a second refresh', () =>
  {
    // Arrange- toggling a layer off has to invalidate as surely as toggling one on, so the rebuild
    // cannot be a one-time initialization dressed up as an alias.
    const gameTemp = new globalThis.Game_Temp();

    // Act
    gameTemp.refreshAppliedDifficulty();
    gameTemp.refreshAppliedDifficulty();

    // Assert
    expect(rebuildCalls.length).toBe(2);
  });
});
//endregion plugins/diff/ext/affix/objects/game-temp.test.js