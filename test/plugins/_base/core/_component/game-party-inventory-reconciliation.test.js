//region plugins/_base/_component/game-party-inventory-reconciliation.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installJabsOnChanceEffectGlobalStub } from './fixtures/install-jabs-onchance-stub.js';
import { installJBaseHostGlobals } from './fixtures/install-j-base-host-globals.js';

/**
 * A savefile outlives the database it was written against. Deleting a row mid-development is ordinary and often
 * correct - a whole family of weapons stops being part of the game - but every save written beforehand still holds
 * that row in its containers, which store quantities against keys. A deleted row therefore leaves a key resolving to
 * nothing, and `Game_Party.weapons` hands that back as `undefined`.
 *
 * Vanilla escapes this by luck: `DataManager.isItem` reads `item && …`, so engine windows silently skip the gaps.
 * Plugin code that asks the row a question first - `datum.isArmor()` - dies instead, in a system with no connection
 * to the deletion that caused it.
 *
 * The rule these cover is narrower than "drop what looks broken": **a key goes only when the datastore genuinely has
 * nothing at that position.** A row that exists but is blank stays, because a reclaimed dynamic slot is a hydrated
 * blank rather than a hole and the player may still be holding one.
 */
describe('Game_Party inventory reconciliation (direct src import)', () =>
{
  let RPGManager;

  beforeAll(async () =>
  {
    // fresh module registry so re-running this file doesn't double-apply J.BASE setup.
    vi.resetModules();

    installJBaseHostGlobals();

    Number.prototype.clamp = function(min, max)
    {
      return Math.min(Math.max(this, min), max);
    };

    installJabsOnChanceEffectGlobalStub(globalThis);

    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));
    globalThis.RPGManager = RPGManager;

    // patches globalThis.Game_Party.prototype directly, so coverage lands on the source file rather than a bundle.
    await import('../../../../../src/plugins/_base/core/objects/Game_Party.js');
  });

  afterAll(() =>
  {
    RPGManager.clearCache();
    vi.unstubAllGlobals();
  });

  beforeEach(() =>
  {
    RPGManager.clearCache();

    globalThis.$dataItems = [ null, { id: 1, name: 'Potion' } ];
    globalThis.$dataWeapons = [ null, { id: 1, name: 'Iron Sword' } ];
    globalThis.$dataArmors = [ null, { id: 1, name: 'Leather Vest' } ];
  });

  /**
   * Builds a party holding exactly the container contents handed over.
   * @param {object} [holdings] Raw container maps, keyed the way the live containers are keyed.
   * @returns {Game_Party}
   */
  function buildParty(holdings = {})
  {
    const party = new globalThis.Game_Party();

    party._items = holdings.items ?? {};
    party._weapons = holdings.weapons ?? {};
    party._armors = holdings.armors ?? {};

    return party;
  }

  /**
   * Silences and records the reconciliation report.
   * @returns {import('vitest').MockInstance}
   */
  function captureWarnings()
  {
    return vi.spyOn(console, 'warn')
      .mockImplementation(() => {});
  }

  describe('pruneMissingFromContainer', () =>
  {
    it('drops a key the datastore has nothing at', () =>
    {
      // Arrange - exactly the shape a save carries after a family of weapons is cut: the key outlives the row.
      const party = buildParty({ weapons: { 200: 1 } });
      const warn = captureWarnings();

      // Act
      party.pruneMissingInventoryEntries();

      // Assert
      expect(party.rawWeapons()[200]).toBeUndefined();
      warn.mockRestore();
    });

    it('keeps a key whose row still resolves', () =>
    {
      // Arrange
      const party = buildParty({ weapons: { 1: 4 } });

      // Act
      party.pruneMissingInventoryEntries();

      // Assert
      expect(party.rawWeapons()[1]).toBe(4);
    });

    it('keeps a row that exists but is blank', () =>
    {
      // Arrange - a reclaimed dynamic slot is a hydrated blank, not a hole, and may still be held.
      globalThis.$dataWeapons[2002] = { id: 2002, name: '' };
      const party = buildParty({ weapons: { 2002: 1 } });

      // Act
      party.pruneMissingInventoryEntries();

      // Assert
      expect(party.rawWeapons()[2002]).toBe(1);
    });

    it('reports the quantity that was held, not merely the key', () =>
    {
      // Arrange - enough to judge whether the loss matters without opening a save file.
      const party = buildParty({ weapons: { 200: 7 } });
      const warn = captureWarnings();

      // Act
      party.pruneMissingInventoryEntries();

      // Assert
      const said = warn.mock.calls.flat()
        .join('\n');

      expect(said).toContain('weapon #200');
      expect(said).toContain('x7');
      warn.mockRestore();
    });
  });

  describe('pruneMissingInventoryEntries', () =>
  {
    it('reconciles the item container', () =>
    {
      // Arrange
      const party = buildParty({ items: { 900: 3 } });
      const warn = captureWarnings();

      // Act
      party.pruneMissingInventoryEntries();

      // Assert
      expect(party.rawItems()[900]).toBeUndefined();
      warn.mockRestore();
    });

    it('reconciles the armor container', () =>
    {
      // Arrange
      const party = buildParty({ armors: { 777: 2 } });
      const warn = captureWarnings();

      // Act
      party.pruneMissingInventoryEntries();

      // Assert
      expect(party.rawArmors()[777]).toBeUndefined();
      warn.mockRestore();
    });

    it('reconciles all three containers in one pass', () =>
    {
      // Arrange
      const party = buildParty({ items: { 900: 1 }, weapons: { 200: 1 }, armors: { 777: 1 } });
      const warn = captureWarnings();

      // Act
      party.pruneMissingInventoryEntries();

      // Assert
      const said = warn.mock.calls.flat()
        .join('\n');

      expect(said).toContain('dropped 3 entries');
      warn.mockRestore();
    });

    it('says nothing at all when every key resolves', () =>
    {
      // Arrange - the overwhelmingly common case. Reporting on every map entry would train the reader to ignore
      // the one message that matters.
      const party = buildParty({ items: { 1: 1 }, weapons: { 1: 1 }, armors: { 1: 1 } });
      const warn = captureWarnings();

      // Act
      party.pruneMissingInventoryEntries();

      // Assert
      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });

    it('says nothing when the containers are empty', () =>
    {
      // Arrange - a fresh game, which reaches this on its very first map.
      const party = buildParty();
      const warn = captureWarnings();

      // Act
      party.pruneMissingInventoryEntries();

      // Assert
      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });
  });

  describe('reportPrunedInventoryEntries', () =>
  {
    it('speaks in the singular for exactly one loss', () =>
    {
      // Arrange
      const party = buildParty({ weapons: { 200: 1 } });
      const warn = captureWarnings();

      // Act
      party.pruneMissingInventoryEntries();

      // Assert
      const said = warn.mock.calls.flat()
        .join('\n');

      expect(said).toContain('dropped 1 entry');
      warn.mockRestore();
    });

    it('names each kind of container it dropped from', () =>
    {
      // Arrange
      const party = buildParty({ items: { 900: 1 }, armors: { 777: 1 } });
      const warn = captureWarnings();

      // Act
      party.pruneMissingInventoryEntries();

      // Assert
      const said = warn.mock.calls.flat()
        .join('\n');

      expect(said).toContain('item #900');
      expect(said).toContain('armor #777');
      warn.mockRestore();
    });
  });
});
//endregion plugins/_base/_component/game-party-inventory-reconciliation.test.js