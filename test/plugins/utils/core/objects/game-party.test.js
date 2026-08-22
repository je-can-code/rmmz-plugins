//region plugins/utils/core/objects/game-party.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Party ext/utils augments (direct src import)', () =>
{
  let Game_Party;
  let realIsInvalidInventoryDatum;

  beforeAll(async () =>
  {
    vi.resetModules();

    function StubGameParty()
    {
    }

    // J-Base owns the raw container accessors this file prunes through.
    StubGameParty.prototype.rawItems = function() { return this._items; };
    StubGameParty.prototype.rawWeapons = function() { return this._weapons; };
    StubGameParty.prototype.rawArmors = function() { return this._armors; };

    globalThis.Game_Party = StubGameParty;

    await import('../../../../../src/plugins/utils/core/objects/Game_Party.js');
    ({ Game_Party } = globalThis);
    realIsInvalidInventoryDatum = Game_Party.isInvalidInventoryDatum;
  });

  beforeEach(() =>
  {
    globalThis.$dataItems = {};
    globalThis.$dataWeapons = {};
    globalThis.$dataArmors = {};
    globalThis.$gameMap = { requestRefresh: vi.fn() };
    Game_Party.isInvalidInventoryDatum = realIsInvalidInventoryDatum;
  });

  describe('isInvalidInventoryDatum', () =>
  {
    it('is true for undefined', () =>
    {
      // Arrange/Act
      const result = Game_Party.isInvalidInventoryDatum(undefined);

      // Assert
      expect(result).toEqual(true);
    });

    it('is true for null', () =>
    {
      // Arrange/Act
      const result = Game_Party.isInvalidInventoryDatum(null);

      // Assert
      expect(result).toEqual(true);
    });

    it('is true when the name is null', () =>
    {
      // Arrange/Act
      const result = Game_Party.isInvalidInventoryDatum({ name: null });

      // Assert
      expect(result).toEqual(true);
    });

    it('is true when the row carries no name property at all', () =>
    {
      // Arrange/Act- a row whose name never arrives is the separate half of the null check, and it is
      // the dangerous half: `String(undefined)` is the perfectly ordinary word "undefined", so a row
      // that fell through here would read as a legitimately named item rather than as junk.
      const result = Game_Party.isInvalidInventoryDatum({ id: 7 });

      // Assert
      expect(result).toEqual(true);
    });

    it('is true when the trimmed name is blank', () =>
    {
      // Arrange/Act
      const result = Game_Party.isInvalidInventoryDatum({ name: '   ' });

      // Assert
      expect(result).toEqual(true);
    });

    it('is true when the name starts with "==="', () =>
    {
      // Arrange/Act
      const result = Game_Party.isInvalidInventoryDatum({ name: '=== Section ===' });

      // Assert
      expect(result).toEqual(true);
    });

    it('is false for a normal named datum', () =>
    {
      // Arrange/Act
      const result = Game_Party.isInvalidInventoryDatum({ name: 'Potion' });

      // Assert
      expect(result).toEqual(false);
    });
  });

  describe('removeInvalidItemsFromParty', () =>
  {
    it('purges invalid rows from items/weapons/armors while keeping valid ones', () =>
    {
      // Arrange
      const party = new Game_Party();
      party._items = { 1: 5, 2: 3 };
      party._weapons = { 1: 1 };
      party._armors = {};
      globalThis.$dataItems = { 1: { name: 'Potion' }, 2: undefined };
      globalThis.$dataWeapons = { 1: { name: '=== Divider ===' } };
      party.members = vi.fn().mockReturnValue([]);

      // Act
      party.removeInvalidItemsFromParty();

      // Assert
      expect(party._items).toEqual({ 1: 5 });
      expect(party._weapons).toEqual({});
    });

    it('discards invalid equipped equips from each member and refreshes them', () =>
    {
      // Arrange
      const party = new Game_Party();
      party._items = {};
      party._weapons = {};
      party._armors = {};
      const invalidEquip = { name: 'invalid' };
      const validEquip = { name: 'valid' };
      globalThis.$dataItems = {};
      globalThis.$dataWeapons = {};
      globalThis.$dataArmors = {};
      const actor = {
        equips: vi.fn().mockReturnValue([ invalidEquip, validEquip, null ]),
        discardEquip: vi.fn(),
        refresh: vi.fn(),
      };
      party.members = vi.fn().mockReturnValue([ actor ]);

      // stub isInvalidInventoryDatum to flag only the first equip as invalid.
      Game_Party.isInvalidInventoryDatum = vi.fn(datum => datum === invalidEquip);

      // Act
      party.removeInvalidItemsFromParty();

      // Assert
      expect(actor.discardEquip).toHaveBeenCalledWith(invalidEquip);
      expect(actor.discardEquip).not.toHaveBeenCalledWith(validEquip);
      expect(actor.refresh).toHaveBeenCalled();
    });

    it('requests a map refresh after cleanup', () =>
    {
      // Arrange
      const party = new Game_Party();
      party._items = {};
      party._weapons = {};
      party._armors = {};
      party.members = vi.fn().mockReturnValue([]);

      // Act
      party.removeInvalidItemsFromParty();

      // Assert
      expect(globalThis.$gameMap.requestRefresh).toHaveBeenCalled();
    });
  });
});
//endregion plugins/utils/core/objects/game-party.test.js
