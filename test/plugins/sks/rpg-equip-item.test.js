//region plugins/sks/rpg-equip-item.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import RPGManager from '../../../src/plugins/_base/managers/RPGManager.js';

describe('RPG_EquipItem (src/plugins/sks/core/database/RPG_EquipItem.js)', () =>
{
  /** @type {typeof import('../../../src/plugins/sks/core/database/RPG_EquipItem.js')} */
  let RPG_EquipItem;

  beforeAll(async () =>
  {
    // RPG_EquipItem.js is a pure prototype-patch file: it references RPG_EquipItem, RPGManager, and
    // J.SKS.RegExp.SlotCostModifier as bare (undeclared) globals rather than importing them. Stub
    // those globals before the dynamic import evaluates the module, since a static import would be
    // hoisted ahead of any setup.
    globalThis.RPG_EquipItem = class RPG_EquipItem
    {
    };

    // use the genuine RPGManager implementation so this test exercises real note-parsing behavior.
    globalThis.RPGManager = RPGManager;

    globalThis.J = {
      SKS: {
        RegExp: {
          SlotCostModifier: /<slotCostModifier:[ ]?(-?\d+)>/i,
        },
      },
    };

    await import('../../../src/plugins/sks/core/database/RPG_EquipItem.js');

    RPG_EquipItem = globalThis.RPG_EquipItem;
  });

  afterAll(() =>
  {
    delete globalThis.RPG_EquipItem;
    delete globalThis.RPGManager;
    delete globalThis.J;
  });

  /**
   * Builds a plain object that behaves like an RPG_EquipItem instance for note-tag parsing purposes.
   * @param {object} props Properties to assign onto the equip item, most importantly `note`.
   * @returns {object}
   */
  function equipData(props)
  {
    return Object.assign(Object.create(RPG_EquipItem.prototype), props);
  }

  describe('slotCostModifier', () =>
  {
    it('parses a positive slotCostModifier notetag', () =>
    {
      const equip = equipData({ note: '<slotCostModifier:3>' });

      expect(equip.slotCostModifier).toBe(3);
    });

    it('parses a negative slotCostModifier notetag', () =>
    {
      const equip = equipData({ note: '<slotCostModifier:-1>' });

      expect(equip.slotCostModifier).toBe(-1);
    });

    it('defaults to 0 when no slotCostModifier notetag is present', () =>
    {
      const equip = equipData({ note: '' });

      expect(equip.slotCostModifier).toBe(0);
    });
  });
});
//endregion plugins/sks/rpg-equip-item.test.js
