//region plugins/abs/core/database/rpg-usable-item.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import RPGManager from '../../../../../src/plugins/_base/core/managers/RPGManager.js';

describe('RPG_UsableItem (src/plugins/abs/core/database/RPG_UsableItem.js)', () =>
{
  let RPG_UsableItem;

  beforeAll(async () =>
  {
    globalThis.RPG_UsableItem = class RPG_UsableItemStub
    {
    };

    globalThis.RPGManager = RPGManager;

    globalThis.J = {
      ABS: {
        RegExp: {
          Cooldown: /<cooldown:[ ]?(\d+)>/i,
          UniqueCooldown: /<uniqueCooldown>/i,
          Ogcd: /<ogcd>/i,
          GlobalCooldownFrames: /<gcd:[ ]?(\d+)>/i,
          Interrupt: /<interrupt:[ ]?(\d+)>/i,
          HideFromJabsMenu: /<hideFromJabsMenu>/i,
        },
      },
    };

    await import('../../../../../src/plugins/abs/core/database/RPG_UsableItem.js');

    ({ RPG_UsableItem } = globalThis);
  });

  afterAll(() =>
  {
    delete globalThis.RPG_UsableItem;
    delete globalThis.RPGManager;
    delete globalThis.J;
  });

  /**
   * Builds a plain object that behaves like an RPG_UsableItem instance for note-tag parsing.
   * @param {string} note
   * @returns {object}
   */
  function itemData(note = '')
  {
    return Object.assign(Object.create(RPG_UsableItem.prototype), { note });
  }

  describe('jabsCooldown', () =>
  {
    it('reads the tagged cooldown', () =>
    {
      expect(itemData('<cooldown:60>').jabsCooldown).toBe(60);
    });

    it('is null when untagged', () =>
    {
      expect(itemData('').jabsCooldown).toBeNull();
    });
  });

  describe('jabsUniqueCooldown', () =>
  {
    it('is true when tagged', () =>
    {
      expect(itemData('<uniqueCooldown>').jabsUniqueCooldown).toBe(true);
    });

    it('is null when untagged', () =>
    {
      expect(itemData('').jabsUniqueCooldown).toBeNull();
    });
  });

  describe('jabsIgnoresGlobalCooldown', () =>
  {
    it('is true when tagged', () =>
    {
      expect(itemData('<ogcd>').jabsIgnoresGlobalCooldown).toBe(true);
    });

    it('is false when untagged', () =>
    {
      expect(itemData('').jabsIgnoresGlobalCooldown).toBe(false);
    });
  });

  describe('jabsGlobalCooldownOverride', () =>
  {
    it('reads the tagged gcd override', () =>
    {
      expect(itemData('<gcd:30>').jabsGlobalCooldownOverride).toBe(30);
    });

    it('is null when untagged', () =>
    {
      expect(itemData('').jabsGlobalCooldownOverride).toBeNull();
    });
  });

  describe('jabsInterruptMagnifier', () =>
  {
    it('reads the tagged interrupt magnifier', () =>
    {
      expect(itemData('<interrupt:150>').jabsInterruptMagnifier).toBe(150);
    });

    it('defaults to 0 when untagged', () =>
    {
      expect(itemData('').jabsInterruptMagnifier).toBe(0);
    });
  });

  describe('jabsHiddenFromMenus', () =>
  {
    it('is true when tagged', () =>
    {
      expect(itemData('<hideFromJabsMenu>').jabsHiddenFromMenus).toBe(true);
    });

    it('is false when untagged', () =>
    {
      expect(itemData('').jabsHiddenFromMenus).toBe(false);
    });
  });
});
//endregion plugins/abs/core/database/rpg-usable-item.test.js
