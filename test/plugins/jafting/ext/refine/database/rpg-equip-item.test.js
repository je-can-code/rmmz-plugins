//region plugins/jafting/ext/refine/database/rpg-equip-item.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('RPG_EquipItem ext/refine augments (direct src import)', () =>
{
  let RPG_EquipItem;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      JAFTING: {
        EXT: {
          REFINE: {
            Aliased: { RPG_EquipItem: new Map() },
            RegExp: {
              NotRefinementBase: /<notRefinementBase>/i,
              NotRefinementMaterial: /<notRefinementMaterial>/i,
              Unrefinable: /<unrefinable>/i,
              MaxRefineCount: /<maxRefineCount:(\d+)>/i,
              MaxTraitCount: /<maxTraitCount:(\d+)>/i,
            },
          },
        },
      },
    };

    function StubRPGEquipItem()
    {
    }

    StubRPGEquipItem.prototype.initMembers = vi.fn();
    globalThis.RPG_EquipItem = StubRPGEquipItem;

    globalThis.RPGManager = {
      checkForBooleanFromNoteByRegex: vi.fn().mockReturnValue(false),
      getNumberFromNoteByRegex: vi.fn().mockReturnValue(0),
    };

    await import('../../../../../../src/plugins/jafting/ext/refine/database/RPG_EquipItem.js');
    ({ RPG_EquipItem } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(false);
    globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(0);
  });

  describe('initMembers', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const equip = new RPG_EquipItem();
      const baseItem = {};

      // Act
      equip.initMembers(baseItem);

      // Assert
      expect(globalThis.J.JAFTING.EXT.REFINE.Aliased.RPG_EquipItem.get('initMembers')).toHaveBeenCalledWith(baseItem);
    });

    it('carries the salvage ledger forward from the base item', () =>
    {
      // Arrange
      const equip = new RPG_EquipItem();
      const ledger = {};

      // Act
      equip.initMembers({ _jaftingSalvageLedger: ledger });

      // Assert
      expect(equip._jaftingSalvageLedger).toBe(ledger);
    });

    it('defaults the salvage ledger to null for a non-refined base row', () =>
    {
      // Arrange
      const equip = new RPG_EquipItem();

      // Act
      equip.initMembers({});

      // Assert
      expect(equip._jaftingSalvageLedger).toEqual(null);
    });
  });

  describe('jaftingRefinedCount', () =>
  {
    it('defaults to 0', () =>
    {
      // Arrange/Act
      const equip = new RPG_EquipItem();

      // Assert
      expect(equip.jaftingRefinedCount).toEqual(0);
    });
  });

  describe('jaftingNotRefinementBase/jaftingNotRefinementMaterial', () =>
  {
    it('reads the NotRefinementBase note tag', () =>
    {
      // Arrange
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(true);
      const equip = new RPG_EquipItem();

      // Act
      const result = equip.jaftingNotRefinementBase;

      // Assert
      expect(result).toEqual(true);
    });

    it('reads the NotRefinementMaterial note tag', () =>
    {
      // Arrange
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(true);
      const equip = new RPG_EquipItem();

      // Act
      const result = equip.jaftingNotRefinementMaterial;

      // Assert
      expect(result).toEqual(true);
    });
  });

  describe('jaftingUnrefinable/getJaftingUnrefinable', () =>
  {
    it('is true when the explicit Unrefinable tag is present', () =>
    {
      // Arrange
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(true);
      const equip = new RPG_EquipItem();

      // Act
      const result = equip.jaftingUnrefinable;

      // Assert
      expect(result).toEqual(true);
    });

    it('is true when both notRefinementBase and notRefinementMaterial are set, absent the explicit tag', () =>
    {
      // Arrange
      const equip = new RPG_EquipItem();
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockImplementation((_, regex) =>
      {
        if (regex === globalThis.J.JAFTING.EXT.REFINE.RegExp.Unrefinable) return false;
        return true;
      });

      // Act
      const result = equip.getJaftingUnrefinable();

      // Assert
      expect(result).toEqual(true);
    });

    it('is false when only one of notRefinementBase/notRefinementMaterial is set', () =>
    {
      // Arrange
      const equip = new RPG_EquipItem();
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockImplementation((_, regex) =>
      {
        if (regex === globalThis.J.JAFTING.EXT.REFINE.RegExp.NotRefinementBase) return true;
        return false;
      });

      // Act
      const result = equip.getJaftingUnrefinable();

      // Assert
      expect(result).toEqual(false);
    });

    it('is false when none of the tags are present', () =>
    {
      // Arrange
      const equip = new RPG_EquipItem();

      // Act
      const result = equip.getJaftingUnrefinable();

      // Assert
      expect(result).toEqual(false);
    });
  });

  describe('jaftingMaxRefineCount', () =>
  {
    it('reads the MaxRefineCount note tag', () =>
    {
      // Arrange
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(5);
      const equip = new RPG_EquipItem();

      // Act
      const result = equip.jaftingMaxRefineCount;

      // Assert
      expect(result).toEqual(5);
    });
  });

  describe('jaftingMaxTraitCount', () =>
  {
    it('reads the MaxTraitCount note tag', () =>
    {
      // Arrange
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(3);
      const equip = new RPG_EquipItem();

      // Act
      const result = equip.jaftingMaxTraitCount;

      // Assert
      expect(result).toEqual(3);
    });
  });
});
//endregion plugins/jafting/ext/refine/database/rpg-equip-item.test.js
