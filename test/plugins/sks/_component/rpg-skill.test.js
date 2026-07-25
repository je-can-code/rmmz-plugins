//region plugins/sks/_component/rpg-skill.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import RPGManager from '../../../../src/plugins/_base/managers/RPGManager.js';

describe('RPG_Skill (src/plugins/sks/core/database/RPG_Skill.js)', () =>
{
  /** @type {typeof import('../../../../src/plugins/sks/core/database/RPG_Skill.js')} */
  let RPG_Skill;

  beforeAll(async () =>
  {
    // RPG_Skill.js is a pure prototype-patch file: it references RPG_Skill, RPGManager, and
    // J.SKS.RegExp/J.SKS.Metadata as bare (undeclared) globals rather than importing them, exactly
    // as the concatenated RMMZ plugin runtime would provide them. Stub those globals before the
    // dynamic import evaluates the module, since a static import would be hoisted ahead of any setup.
    globalThis.RPG_Skill = class RPG_SkillStub
    {
    };

    // RPGManager is a real, pure, cleanly importable class (no bare-global reliance of its own),
    // so we use the genuine implementation rather than a fake -- this is what gives real coverage
    // attribution to both this file and RPGManager's regex-parsing helpers.
    globalThis.RPGManager = RPGManager;

    // stand up the minimal J.SKS namespace shape this file reads from: the two regexes it scans
    // notes with, plus the equippableSkillTypeIds list consulted by the `unslotted` getter.
    globalThis.J = {
      SKS: {
        RegExp: {
          SlotCost: /<slotCost:[ ]?(-?\d+)>/i,
          Unslotted: /<unslotted>/i,
        },
        Metadata: {
          equippableSkillTypeIds: [],
        },
      },
    };

    // now that all bare globals it depends on exist, importing the file executes its
    // Object.defineProperty calls against the real RPG_Skill.prototype stub above.
    await import('../../../../src/plugins/sks/core/database/RPG_Skill.js');

    ({ RPG_Skill } = globalThis);
  });

  afterAll(() =>
  {
    // tear down the globals so later test files in the same worker start from a clean slate.
    delete globalThis.RPG_Skill;
    delete globalThis.RPGManager;
    delete globalThis.J;
  });

  /**
   * Builds a plain object that behaves like an RPG_Skill instance for note-tag parsing purposes.
   * @param {object} props Properties to assign onto the skill, most importantly `note` and `stypeId`.
   * @returns {object}
   */
  function skillData(props)
  {
    return Object.assign(Object.create(RPG_Skill.prototype), props);
  }

  describe('slotCost', () =>
  {
    it('parses a positive slotCost notetag', () =>
    {
      const skill = skillData({ note: '<slotCost:2>' });

      expect(skill.slotCost).toBe(2);
    });

    it('parses a negative slotCost notetag', () =>
    {
      const skill = skillData({ note: '<slotCost:-3>' });

      expect(skill.slotCost).toBe(-3);
    });

    it('defaults to 0 when no slotCost notetag is present', () =>
    {
      const skill = skillData({ note: '' });

      expect(skill.slotCost).toBe(0);
    });
  });

  describe('unslotted', () =>
  {
    it('is true when the skill carries the explicit <unslotted> notetag', () =>
    {
      const skill = skillData({ note: '<unslotted>', stypeId: 1 });

      expect(skill.unslotted).toBe(true);
    });

    it('is false for an untagged skill when no equippable type ids are configured', () =>
    {
      globalThis.J.SKS.Metadata.equippableSkillTypeIds = [];
      const skill = skillData({ note: '', stypeId: 1 });

      expect(skill.unslotted).toBe(false);
    });

    it('is true when equippable type ids are configured and this skill type is not among them', () =>
    {
      globalThis.J.SKS.Metadata.equippableSkillTypeIds = [ 2 ];
      const skill = skillData({ note: '', stypeId: 1 });

      expect(skill.unslotted).toBe(true);
    });

    it('is false when equippable type ids are configured and this skill type is among them', () =>
    {
      globalThis.J.SKS.Metadata.equippableSkillTypeIds = [ 1 ];
      const skill = skillData({ note: '', stypeId: 1 });

      expect(skill.unslotted).toBe(false);
    });
  });
});
//endregion plugins/sks/_component/rpg-skill.test.js
