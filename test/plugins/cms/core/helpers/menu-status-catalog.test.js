//region plugins/cms/core/helpers/menu-status-catalog.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('MenuStatusCatalog (direct src import)', () =>
{
  let MenuStatusCatalog;

  beforeAll(async () =>
  {
    vi.resetModules();

    // the catalog resolves slot names, resource abbreviations, and the level term through
    // TextManager, which is a J-Base augmentation of an engine global; only what it actually reads
    // is worth standing up here.
    globalThis.TextManager = {
      equipType: vi.fn(id => `slot-${id}`),
      level: 'Level',
      hpA: 'LP',
      mpA: 'MP',
      tpA: 'TP',
    };

    // the database decides whether tech is shown at all, so the catalog has to consult it.
    globalThis.$dataSystem = { optDisplayTp: true };

    ({ default: MenuStatusCatalog } =
      await import('../../../../../src/plugins/cms/core/helpers/MenuStatusCatalog.js'));
  });

  beforeEach(() =>
  {
    globalThis.TextManager.equipType.mockClear();
    globalThis.$dataSystem.optDisplayTp = true;
  });

  /**
   * Builds an actor shaped the way the resource catalog's callers see one: the engine exposes the
   * current values as plain properties and the tech ceiling as a method.
   * @param {{hp: number, mhp: number, mp: number, mmp: number, tp: number, maxTp: number}} values
   * @returns {object}
   */
  const buildResourcefulActor = values => ({
    hp: values.hp,
    mhp: values.mhp,
    mp: values.mp,
    mmp: values.mmp,
    tp: values.tp,
    maxTp: vi.fn()
      .mockReturnValue(values.maxTp),
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

  describe('levelValue', () =>
  {
    it('reports the level as a bare number, leaving its icon to name it', () =>
    {
      // Arrange
      const actor = { level: 7 };

      // Act
      const value = MenuStatusCatalog.levelValue(actor);

      // Assert
      expect(value)
        .toBe('7');
    });
  });

  describe('resourceRows', () =>
  {
    it('reports life and magic for every actor', () =>
    {
      // Arrange
      const actor = buildResourcefulActor({
        hp: 220,
        mhp: 380,
        mp: 140,
        mmp: 155,
        tp: 0,
        maxTp: 100,
      });

      // Act
      const rows = MenuStatusCatalog.resourceRows(actor);

      // Assert
      expect(rows.map(row => row.key)
        .slice(0, 2))
        .toEqual([ 'hp', 'mp' ]);
      expect(rows[0].label)
        .toBe('LP');
    });

    it('computes the fill rate from the current value against the maximum', () =>
    {
      // Arrange
      const actor = buildResourcefulActor({
        hp: 190,
        mhp: 380,
        mp: 0,
        mmp: 100,
        tp: 0,
        maxTp: 100,
      });

      // Act
      const rows = MenuStatusCatalog.resourceRows(actor);

      // Assert
      expect(rows[0].rate)
        .toBe(0.5);
    });

    it('reads a resource with no capacity as empty rather than dividing by zero', () =>
    {
      // Arrange - an actor with no magic at all has a maximum of zero.
      const actor = buildResourcefulActor({
        hp: 220,
        mhp: 380,
        mp: 0,
        mmp: 0,
        tp: 0,
        maxTp: 100,
      });

      // Act
      const rows = MenuStatusCatalog.resourceRows(actor);

      // Assert
      expect(rows[1].rate)
        .toBe(0);
    });

    it('includes tech when the database displays it', () =>
    {
      // Arrange
      globalThis.$dataSystem.optDisplayTp = true;
      const actor = buildResourcefulActor({
        hp: 1,
        mhp: 1,
        mp: 1,
        mmp: 1,
        tp: 185,
        maxTp: 300,
      });

      // Act
      const rows = MenuStatusCatalog.resourceRows(actor);

      // Assert
      expect(rows)
        .toHaveLength(3);
      expect(rows[2].key)
        .toBe('tp');
    });

    it('omits tech when the database hides it', () =>
    {
      // Arrange
      globalThis.$dataSystem.optDisplayTp = false;
      const actor = buildResourcefulActor({
        hp: 1,
        mhp: 1,
        mp: 1,
        mmp: 1,
        tp: 185,
        maxTp: 300,
      });

      // Act
      const rows = MenuStatusCatalog.resourceRows(actor);

      // Assert
      expect(rows)
        .toHaveLength(2);
    });
  });

  describe('stateIcons', () =>
  {
    it('reports the icon of every afflicting state', () =>
    {
      // Arrange
      const actor = {
        states: vi.fn()
          .mockReturnValue([ { iconIndex: 4 }, { iconIndex: 12 } ]),
      };

      // Act
      const icons = MenuStatusCatalog.stateIcons(actor);

      // Assert
      expect(icons)
        .toEqual([ 4, 12 ]);
    });

    it('drops a state that declares no icon rather than drawing a gap', () =>
    {
      // Arrange
      const actor = {
        states: vi.fn()
          .mockReturnValue([ { iconIndex: 4 }, { iconIndex: 0 } ]),
      };

      // Act
      const icons = MenuStatusCatalog.stateIcons(actor);

      // Assert
      expect(icons)
        .toEqual([ 4 ]);
    });

    it('reports nothing for an actor suffering no states', () =>
    {
      // Arrange
      const actor = {
        states: vi.fn()
          .mockReturnValue([]),
      };

      // Act
      const icons = MenuStatusCatalog.stateIcons(actor);

      // Assert
      expect(icons)
        .toEqual([]);
    });
  });
});
//endregion plugins/cms/core/helpers/menu-status-catalog.test.js