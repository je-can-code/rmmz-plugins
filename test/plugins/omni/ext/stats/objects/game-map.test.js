//region plugins/omni/ext/stats/objects/game-map.test.js
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-OMNI-Stats Game_Map hooks (direct src import)', () =>
{
  /**
   * The original this plugin aliases, spied on to prove the chain is not broken.
   * @type {Function}
   */
  let originalSetup;

  /**
   * The stand-in for the party's records.
   * @type {object}
   */
  let records;

  beforeEach(async () =>
  {
    vi.resetModules();

    globalThis.J = { OMNI: { EXT: { STATS: { Aliased: { Game_Map: new Map() } } } } };

    records = { addVisitedMap: vi.fn() };
    globalThis.$gameParty = { getStatistopediaRecords: () => records };

    originalSetup = vi.fn();

    function Game_Map() {}

    Game_Map.prototype.setup = originalSetup;
    globalThis.Game_Map = Game_Map;

    await import('../../../../../../src/plugins/omni/ext/stats/objects/Game_Map.js');
  });

  it('leaves the setup chain it extends intact', () =>
  {
    // Arrange.
    const map = new globalThis.Game_Map();

    // Act.
    map.setup(19);

    // Assert.
    expect(originalSetup).toHaveBeenCalledWith(19);
  });

  it('files the map the party just arrived on', () =>
  {
    // Arrange.
    const map = new globalThis.Game_Map();

    // Act.
    map.setup(19);

    // Assert.
    expect(records.addVisitedMap).toHaveBeenCalledWith(19);
  });
});
//endregion plugins/omni/ext/stats/objects/game-map.test.js
