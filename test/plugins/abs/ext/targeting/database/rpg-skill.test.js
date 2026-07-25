//region plugins/abs/ext/targeting/database/rpg-skill.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import RPGManager from '../../../../../../src/plugins/_base/managers/RPGManager.js';

describe('J-ABS-Targeting RPG_Skill augments (src/plugins/abs/ext/targeting/database/RPG_Skill.js)', () =>
{
  let RPG_Skill;

  beforeAll(async () =>
  {
    globalThis.RPG_Skill = class RPG_SkillStub
    {
    };

    globalThis.RPGManager = RPGManager;

    globalThis.J = { ABS: { EXT: { TARGETING: { RegExp: { Targeted: /<targeted>/i } } } } };

    await import('../../../../../../src/plugins/abs/ext/targeting/database/RPG_Skill.js');

    ({ RPG_Skill } = globalThis);
  });

  afterAll(() =>
  {
    delete globalThis.RPG_Skill;
    delete globalThis.RPGManager;
    delete globalThis.J;
  });

  /**
   * Builds a plain object that behaves like an RPG_Skill instance for note-tag parsing.
   * @param {string} note
   * @returns {object}
   */
  function skillData(note = '')
  {
    return Object.assign(Object.create(RPG_Skill.prototype), { note });
  }

  describe('targeted', () =>
  {
    it('is true when tagged', () =>
    {
      expect(skillData('<targeted>').targeted).toBe(true);
    });

    it('is false when untagged', () =>
    {
      expect(skillData('').targeted).toBe(false);
    });
  });
});
//endregion plugins/abs/ext/targeting/database/rpg-skill.test.js
