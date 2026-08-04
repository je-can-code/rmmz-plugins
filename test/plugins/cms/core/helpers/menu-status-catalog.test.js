//region plugins/cms/core/helpers/menu-status-catalog.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('MenuStatusCatalog (direct src import)', () =>
{
  let MenuStatusCatalog;

  beforeAll(async () =>
  {
    vi.resetModules();

    // the catalog resolves slot names through TextManager, which is a J-Base augmentation of an
    // engine global; only the one method it actually calls is worth standing up here.
    globalThis.TextManager = {
      equipType: vi.fn(id => `slot-${id}`),
    };

    ({ default: MenuStatusCatalog } =
      await import('../../../../../src/plugins/cms/core/helpers/MenuStatusCatalog.js'));
  });

  beforeEach(() =>
  {
    globalThis.TextManager.equipType.mockClear();
  });

  /**
   * Builds an actor shaped the way the catalog's callers actually see one: slots and equipment are
   * two index-aligned arrays, and an unfilled slot arrives as a null rather than being absent.
   * @param {number[]} slotTypeIds The equip type ids this actor wears, in slot order.
   * @param {Array<object|null>} equips What occupies each of those slots.
   * @returns {object}
   */
  const buildActor = (slotTypeIds, equips) => ({
    equipSlots: vi.fn()
      .mockReturnValue(slotTypeIds),
    equips: vi.fn()
      .mockReturnValue(equips),
  });

  /**
   * Builds an actor shaped for the experience readout.
   * @param {boolean} isMaxLevel Whether this actor has run out of levels to earn.
   * @param {number} currentExp The experience earned so far.
   * @param {number} nextLevelExp The experience total the next level begins at.
   * @returns {object}
   */
  const buildLevelingActor = (isMaxLevel, currentExp, nextLevelExp) => ({
    isMaxLevel: vi.fn()
      .mockReturnValue(isMaxLevel),
    currentExp: vi.fn()
      .mockReturnValue(currentExp),
    nextLevelExp: vi.fn()
      .mockReturnValue(nextLevelExp),
  });

  describe('buildEquipmentRow', () =>
  {
    it('marks a slot holding an item as equipped', () =>
    {
      // Arrange
      const item = {
        name: 'Rusty Shortsword',
        iconIndex: 96,
      };

      // Act
      const row = MenuStatusCatalog.buildEquipmentRow(1, item);

      // Assert
      expect(row.isEquipped)
        .toBe(true);
      expect(row.item)
        .toBe(item);
    });

    it('marks a slot holding nothing as unequipped', () =>
    {
      // Arrange
      const emptySlotTypeId = 4;

      // Act
      const row = MenuStatusCatalog.buildEquipmentRow(emptySlotTypeId, null);

      // Assert
      expect(row.isEquipped)
        .toBe(false);
      expect(row.item)
        .toBeNull();
    });

    it('resolves the slot name so an empty row still knows what it stands for', () =>
    {
      // Arrange
      const feetSlotTypeId = 4;

      // Act
      const row = MenuStatusCatalog.buildEquipmentRow(feetSlotTypeId, null);

      // Assert
      expect(globalThis.TextManager.equipType)
        .toHaveBeenCalledWith(feetSlotTypeId);
      expect(row.slotName)
        .toBe('slot-4');
    });
  });

  describe('equipmentRows', () =>
  {
    it('keeps empty slots rather than dropping them', () =>
    {
      // Arrange
      const weapon = {
        name: 'Rusty Shortsword',
        iconIndex: 96,
      };
      const actor = buildActor([ 1, 2, 3 ], [ weapon, null, null ]);

      // Act
      const rows = MenuStatusCatalog.equipmentRows(actor);

      // Assert
      expect(rows)
        .toHaveLength(3);
      expect(rows.map(row => row.isEquipped))
        .toEqual([ true, false, false ]);
    });

    it('pairs each slot with the equipment sharing its index', () =>
    {
      // Arrange
      const body = {
        name: "Traveler's Vest",
        iconIndex: 128,
      };
      const boots = {
        name: 'Cloth Boots',
        iconIndex: 135,
      };
      const actor = buildActor([ 1, 3, 4 ], [ null, body, boots ]);

      // Act
      const rows = MenuStatusCatalog.equipmentRows(actor);

      // Assert
      expect(rows.map(row => row.item))
        .toEqual([ null, body, boots ]);
      expect(rows.map(row => row.slotName))
        .toEqual([ 'slot-1', 'slot-3', 'slot-4' ]);
    });

    it('returns no rows for an actor wearing no slots at all', () =>
    {
      // Arrange
      const actor = buildActor([], []);

      // Act
      const rows = MenuStatusCatalog.equipmentRows(actor);

      // Assert
      expect(rows)
        .toEqual([]);
    });

    it('repeats a duplicated slot type once per slot', () =>
    {
      // Arrange - CA grants a second accessory slot by repeating equip type 5.
      const actor = buildActor([ 5, 5 ], [ null, null ]);

      // Act
      const rows = MenuStatusCatalog.equipmentRows(actor);

      // Assert
      expect(rows)
        .toHaveLength(2);
      expect(rows.map(row => row.slotName))
        .toEqual([ 'slot-5', 'slot-5' ]);
    });
  });

  describe('experienceLabel', () =>
  {
    it('reports the remaining distance for an actor with levels left to earn', () =>
    {
      // Arrange
      const actor = buildLevelingActor(false, 740, 1000);

      // Act
      const label = MenuStatusCatalog.experienceLabel(actor);

      // Assert
      expect(label)
        .toBe('260 to next level');
    });

    it('derives the remaining distance rather than assuming a fixed level size', () =>
    {
      // Arrange - a curve nothing like the flat 1000 J-Level-Flat currently configures.
      const actor = buildLevelingActor(false, 112_550, 141_000);

      // Act
      const label = MenuStatusCatalog.experienceLabel(actor);

      // Assert
      expect(label)
        .toBe('28450 to next level');
    });

    it('reports a maxed actor as having nothing left to earn', () =>
    {
      // Arrange
      const actor = buildLevelingActor(true, 99_000, 99_000);

      // Act
      const label = MenuStatusCatalog.experienceLabel(actor);

      // Assert
      expect(label)
        .toBe(MenuStatusCatalog.MAX_LEVEL_TEXT);
    });

    it('never consults the curve for a maxed actor', () =>
    {
      // Arrange
      const actor = buildLevelingActor(true, 99_000, 99_000);

      // Act
      MenuStatusCatalog.experienceLabel(actor);

      // Assert
      expect(actor.nextLevelExp)
        .not
        .toHaveBeenCalled();
    });
  });
});
//endregion plugins/cms/core/helpers/menu-status-catalog.test.js