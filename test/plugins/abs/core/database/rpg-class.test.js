//region plugins/abs/core/database/rpg-class.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import RPGManager from '../../../../../src/plugins/_base/managers/RPGManager.js';

describe('RPG_Class (src/plugins/abs/core/database/RPG_Class.js)', () =>
{
  let RPG_Class;

  beforeAll(async () =>
  {
    globalThis.RPG_Class = class RPG_ClassStub
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

    await import('../../../../../src/plugins/abs/core/database/RPG_Class.js');

    ({ RPG_Class } = globalThis);
  });

  afterAll(() =>
  {
    delete globalThis.RPG_Class;
    delete globalThis.RPGManager;
    delete globalThis.J;
  });

  /**
   * Builds a plain object that behaves like an RPG_Class instance for note-tag parsing.
   * @param {string} note
   * @returns {object}
   */
  function classData(note = '')
  {
    return Object.assign(Object.create(RPG_Class.prototype), { note });
  }

  describe('bonus hits scopes', () =>
  {
    it('jabsBonusHitsScopeGlobal reads the tagged value', () =>
    {
      expect(classData('<bonusHitsGlobal:2>').jabsBonusHitsScopeGlobal).toBe(2);
    });

    it('jabsBonusHitsScopeBasic reads the tagged value', () =>
    {
      expect(classData('<bonusHitsBasic:3>').jabsBonusHitsScopeBasic).toBe(3);
    });

    it('jabsBonusHitsScopeSkill reads the tagged value', () =>
    {
      expect(classData('<bonusHitsSkill:4>').jabsBonusHitsScopeSkill).toBe(4);
    });

    it('defaults to 0 when untagged', () =>
    {
      expect(classData('').jabsBonusHitsScopeGlobal).toBe(0);
    });
  });

  describe('jabsSkillTransforms', () =>
  {
    it('parses a list of [base, transformed] pairs', () =>
    {
      const clazz = classData('<skillTransform:[1, 2]>\n<skillTransform:[3, 4]>');
      expect(clazz.jabsSkillTransforms).toEqual([ [ 1, 2 ], [ 3, 4 ] ]);
    });

    it('is an empty array when untagged', () =>
    {
      expect(classData('').jabsSkillTransforms).toEqual([]);
    });
  });
});
//endregion plugins/abs/core/database/rpg-class.test.js
