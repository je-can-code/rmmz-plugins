//region plugins/abs/core/database/rpg-equip-item.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import RPGManager from '../../../../../src/plugins/_base/managers/RPGManager.js';

describe('RPG_EquipItem (src/plugins/abs/core/database/RPG_EquipItem.js)', () =>
{
  let RPG_EquipItem;

  beforeAll(async () =>
  {
    globalThis.RPG_EquipItem = class RPG_EquipItemStub
    {
    };

    globalThis.RPGManager = RPGManager;

    globalThis.J = {
      ABS: {
        RegExp: {
          SkillId: /<skillId:[ ]?(\d+)>/i,
          OffhandSkillId: /<offhandSkillId:[ ]?(\d+)>/i,
          GuardSkillId: /<guardSkillId:[ ]?(\d+)>/i,
          Expires: /<expires:[ ]?(\d+)>/i,
          SkillTransform: /<skillTransform:(\[\d+,[ ]?\d+])>/gi,
        },
      },
    };

    await import('../../../../../src/plugins/abs/core/database/RPG_EquipItem.js');

    ({ RPG_EquipItem } = globalThis);
  });

  afterAll(() =>
  {
    delete globalThis.RPG_EquipItem;
    delete globalThis.RPGManager;
    delete globalThis.J;
  });

  /**
   * Builds a plain object that behaves like an RPG_EquipItem instance for note-tag parsing purposes.
   * @param {string} note
   * @returns {object}
   */
  function equipData(note = '')
  {
    return Object.assign(Object.create(RPG_EquipItem.prototype), { note });
  }

  describe('jabsSkillId', () =>
  {
    it('reads the tagged skill id', () =>
    {
      expect(equipData('<skillId:5>').jabsSkillId).toBe(5);
    });

    it('is null when untagged', () =>
    {
      expect(equipData('').jabsSkillId).toBeNull();
    });
  });

  describe('jabsOffhandSkillId', () =>
  {
    it('reads the tagged offhand skill id', () =>
    {
      expect(equipData('<offhandSkillId:6>').jabsOffhandSkillId).toBe(6);
    });

    it('is null when untagged', () =>
    {
      expect(equipData('').jabsOffhandSkillId).toBeNull();
    });
  });

  describe('jabsGuardSkillId', () =>
  {
    it('reads the tagged guard skill id', () =>
    {
      expect(equipData('<guardSkillId:211>').jabsGuardSkillId).toBe(211);
    });

    it('is null when untagged', () =>
    {
      expect(equipData('').jabsGuardSkillId).toBeNull();
    });
  });

  describe('jabsUseOnPickup', () =>
  {
    it('is always false since equipment cannot be "used"', () =>
    {
      expect(equipData('').jabsUseOnPickup).toBe(false);
    });
  });

  describe('jabsExpiration', () =>
  {
    it('reads the tagged expiration frame count', () =>
    {
      expect(equipData('<expires:300>').jabsExpiration).toBe(300);
    });

    it('is null when untagged', () =>
    {
      expect(equipData('').jabsExpiration).toBeNull();
    });
  });

  describe('jabsSkillTransforms', () =>
  {
    it('parses a list of [base, transformed] pairs', () =>
    {
      const equip = equipData('<skillTransform:[1, 2]>\n<skillTransform:[3, 4]>');
      expect(equip.jabsSkillTransforms).toEqual([ [ 1, 2 ], [ 3, 4 ] ]);
    });

    it('is an empty array when untagged', () =>
    {
      expect(equipData('').jabsSkillTransforms).toEqual([]);
    });
  });
});
//endregion plugins/abs/core/database/rpg-equip-item.test.js
