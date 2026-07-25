//region plugins/abs/core/database/rpg-item.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import RPGManager from '../../../../../src/plugins/_base/managers/RPGManager.js';

describe('RPG_Item (src/plugins/abs/core/database/RPG_Item.js)', () =>
{
  let RPG_Item;

  beforeAll(async () =>
  {
    globalThis.RPG_Item = class RPG_ItemStub
    {
    };

    globalThis.RPGManager = RPGManager;

    globalThis.J = {
      ABS: {
        RegExp: {
          SkillId: /<skillId:[ ]?(\d+)>/i,
          UseOnPickup: /<useOnPickup>/i,
          Expires: /<expires:[ ]?(\d+)>/i,
          JabsTool: /<jabsTool>/i,
        },
      },
    };

    await import('../../../../../src/plugins/abs/core/database/RPG_Item.js');

    ({ RPG_Item } = globalThis);
  });

  afterAll(() =>
  {
    delete globalThis.RPG_Item;
    delete globalThis.RPGManager;
    delete globalThis.J;
  });

  /**
   * Builds a plain object that behaves like an RPG_Item instance for note-tag parsing.
   * @param {string} note
   * @returns {object}
   */
  function itemData(note = '')
  {
    return Object.assign(Object.create(RPG_Item.prototype), { note });
  }

  describe('jabsSkillId', () =>
  {
    it('reads the tagged skill id', () =>
    {
      expect(itemData('<skillId:5>').jabsSkillId).toBe(5);
    });

    it('is null when untagged', () =>
    {
      expect(itemData('').jabsSkillId).toBeNull();
    });
  });

  describe('jabsUseOnPickup', () =>
  {
    it('is true when tagged', () =>
    {
      expect(itemData('<useOnPickup>').jabsUseOnPickup).toBe(true);
    });

    it('is null when untagged', () =>
    {
      expect(itemData('').jabsUseOnPickup).toBeNull();
    });
  });

  describe('jabsExpiration', () =>
  {
    it('reads the tagged expiration frame count', () =>
    {
      expect(itemData('<expires:300>').jabsExpiration).toBe(300);
    });

    it('is null when untagged', () =>
    {
      expect(itemData('').jabsExpiration).toBeNull();
    });
  });

  describe('jabsTool', () =>
  {
    it('is true when tagged', () =>
    {
      expect(itemData('<jabsTool>').jabsTool).toBe(true);
    });

    it('is null when untagged', () =>
    {
      expect(itemData('').jabsTool).toBeNull();
    });
  });
});
//endregion plugins/abs/core/database/rpg-item.test.js
