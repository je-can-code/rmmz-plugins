//region plugins/abs/core/database/rpg-base-battler.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import RPGManager from '../../../../../src/plugins/_base/managers/RPGManager.js';

describe('RPG_BaseBattler (src/plugins/abs/core/database/RPG_BaseBattler.js)', () =>
{
  let RPG_BaseBattler;

  beforeAll(async () =>
  {
    globalThis.RPG_BaseBattler = class RPG_BaseBattlerStub
    {
    };

    globalThis.RPGManager = RPGManager;

    globalThis.J = {
      ABS: {
        RegExp: {
          BonusHitsScopeGlobal: /<bonusHitsGlobal:[ ]?(-?\d+)>/i,
          BonusHitsScopeBasic: /<bonusHitsBasic:[ ]?(-?\d+)>/i,
          BonusHitsScopeSkill: /<bonusHitsSkill:[ ]?(-?\d+)>/i,
          SkillTransform: /<skillTransform:(\[\d+,[ ]?\d+])>/gi,
        },
      },
    };

    await import('../../../../../src/plugins/abs/core/database/RPG_BaseBattler.js');

    ({ RPG_BaseBattler } = globalThis);
  });

  afterAll(() =>
  {
    delete globalThis.RPG_BaseBattler;
    delete globalThis.RPGManager;
    delete globalThis.J;
  });

  /**
   * Builds a plain object that behaves like an RPG_BaseBattler instance for note-tag parsing.
   * @param {string} note
   * @returns {object}
   */
  function battlerData(note = '')
  {
    return Object.assign(Object.create(RPG_BaseBattler.prototype), { note });
  }

  describe('bonus hits scopes', () =>
  {
    it('jabsBonusHitsScopeGlobal reads the tagged value', () =>
    {
      expect(battlerData('<bonusHitsGlobal:2>').jabsBonusHitsScopeGlobal).toBe(2);
    });

    it('jabsBonusHitsScopeGlobal is 0 when untagged', () =>
    {
      expect(battlerData('').jabsBonusHitsScopeGlobal).toBe(0);
    });

    it('jabsBonusHitsScopeBasic reads the tagged value', () =>
    {
      expect(battlerData('<bonusHitsBasic:3>').jabsBonusHitsScopeBasic).toBe(3);
    });

    it('jabsBonusHitsScopeSkill reads the tagged value', () =>
    {
      expect(battlerData('<bonusHitsSkill:4>').jabsBonusHitsScopeSkill).toBe(4);
    });
  });

  describe('jabsSkillTransforms', () =>
  {
    it('parses a list of [base, transformed] pairs', () =>
    {
      const battler = battlerData('<skillTransform:[1, 2]>\n<skillTransform:[3, 4]>');
      expect(battler.jabsSkillTransforms).toEqual([ [ 1, 2 ], [ 3, 4 ] ]);
    });

    it('is an empty array when untagged', () =>
    {
      expect(battlerData('').jabsSkillTransforms).toEqual([]);
    });
  });
});
//endregion plugins/abs/core/database/rpg-base-battler.test.js
