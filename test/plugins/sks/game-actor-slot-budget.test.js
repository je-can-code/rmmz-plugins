//region plugins/sks/game-actor-slot-budget.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadSksPluginVm, resetSksPluginSandbox } from './sks-vm.js';

describe('J-SkillSlots Game_Actor slot point budget (out/sks/J-SkillSlots.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadSksPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    resetSksPluginSandbox(sandbox);
    const { skillData } = sandbox.__sksTestFixtures;
    sandbox.$dataSkills = [
      null,
      skillData({ id: 1, stypeId: 1, name: 'Cheap', note: '<slotCost:1>', damage: { elementId: 0 } }),
      skillData({ id: 2, stypeId: 1, name: 'Pricey', note: '<slotCost:3>', damage: { elementId: 0 } }),
      skillData({ id: 3, stypeId: 1, name: 'Free', note: '', damage: { elementId: 0 } }),
    ];
  });

  /**
   * Builds an actor that knows the given skill ids.
   * @param {object} s
   * @param {number[]} skillIds
   * @returns {object}
   */
  function makeActorWithSkills(s, skillIds)
  {
    const actor = new s.Game_Actor();
    actor.skills = function()
    {
      return skillIds.map(id => s.$dataSkills[id]).filter(Boolean);
    };
    actor.initMembers();
    return actor;
  }

  describe('maxSlotPoints / modifyMaxSlotPoints', () =>
  {
    it('setMaxSlotPoints and maxSlotPoints round-trip', () =>
    {
      const actor = makeActorWithSkills(sandbox, []);
      actor.setMaxSlotPoints(7);

      expect(actor.maxSlotPoints()).toBe(7);
    });

    it('modifyMaxSlotPoints adjusts by a positive or negative amount', () =>
    {
      const actor = makeActorWithSkills(sandbox, []);
      actor.setMaxSlotPoints(5);

      actor.modifyMaxSlotPoints(3);
      expect(actor.maxSlotPoints()).toBe(8);

      actor.modifyMaxSlotPoints(-2);
      expect(actor.maxSlotPoints()).toBe(6);
    });

    it('modifyMaxSlotPoints clamps at a minimum of zero', () =>
    {
      const actor = makeActorWithSkills(sandbox, []);
      actor.setMaxSlotPoints(2);

      actor.modifyMaxSlotPoints(-10);

      expect(actor.maxSlotPoints()).toBe(0);
    });
  });

  describe('remainingSlotPoints / hasSufficientSlotPoints', () =>
  {
    it('remainingSlotPoints reflects max minus spent', () =>
    {
      const actor = makeActorWithSkills(sandbox, [ 1, 2 ]);
      actor.setMaxSlotPoints(10);
      actor.equipSkillToSlot(0, 2);

      expect(actor.remainingSlotPoints()).toBe(7);
    });

    it('hasSufficientSlotPoints treats zero-or-negative cost as always affordable', () =>
    {
      const actor = makeActorWithSkills(sandbox, []);
      actor.setMaxSlotPoints(0);

      expect(actor.hasSufficientSlotPoints(0)).toBe(true);
    });

    it('hasSufficientSlotPoints is false with no remaining budget and a real cost', () =>
    {
      const actor = makeActorWithSkills(sandbox, [ 2 ]);
      actor.setMaxSlotPoints(3);
      actor.equipSkillToSlot(0, 2);

      expect(actor.hasSufficientSlotPoints(1)).toBe(false);
    });

    it('hasSufficientSlotPoints is true when the added cost still fits the budget', () =>
    {
      const actor = makeActorWithSkills(sandbox, [ 1 ]);
      actor.setMaxSlotPoints(5);

      expect(actor.hasSufficientSlotPoints(1)).toBe(true);
    });
  });

  describe('slot management primitives (assignSlot / deleteSlot / slotMap / slots)', () =>
  {
    it('assignSlot populates both the slots array and the slot map', () =>
    {
      const actor = makeActorWithSkills(sandbox, [ 1 ]);

      actor.assignSlot(2, 1);

      expect(actor.slotMap().get(2)).toBe(1);
      expect(actor.slots()[2].skillId).toBe(1);
      expect(actor.slots()[2].index).toBe(2);
    });

    it('deleteSlot removes the entry from both the slots array and the slot map', () =>
    {
      const actor = makeActorWithSkills(sandbox, [ 1 ]);
      actor.assignSlot(2, 1);

      actor.deleteSlot(2);

      expect(actor.slotMap().has(2)).toBe(false);
      expect(actor.slots()[2]).toBeUndefined();
    });

    it('clearSlotMap empties every tracked slot', () =>
    {
      const actor = makeActorWithSkills(sandbox, [ 1, 2 ]);
      actor.assignSlot(0, 1);
      actor.assignSlot(1, 2);

      actor.clearSlotMap();

      expect(actor.slotMap().size).toBe(0);
    });
  });

  describe('skillSlotCost / hasEquipSkillPoints', () =>
  {
    it('skillSlotCost returns 0 for a non-positive skill id', () =>
    {
      const actor = makeActorWithSkills(sandbox, []);

      expect(actor.skillSlotCost(0, 0)).toBe(0);
      expect(actor.skillSlotCost(-1, 0)).toBe(0);
    });

    it('skillSlotCost resolves the skill\'s own slotCost tag otherwise', () =>
    {
      const actor = makeActorWithSkills(sandbox, [ 2 ]);

      expect(actor.skillSlotCost(2, 0)).toBe(3);
    });

    it('hasEquipSkillPoints is true for free skills regardless of budget', () =>
    {
      const actor = makeActorWithSkills(sandbox, [ 3 ]);
      actor.setMaxSlotPoints(0);

      expect(actor.hasEquipSkillPoints(3)).toBe(true);
    });

    it('hasEquipSkillPoints is true when the skill is already equipped (move, not new spend)', () =>
    {
      const actor = makeActorWithSkills(sandbox, [ 2 ]);
      actor.setMaxSlotPoints(3);
      actor.equipSkillToSlot(0, 2);

      expect(actor.hasEquipSkillPoints(2)).toBe(true);
    });

    it('hasEquipSkillPoints is false when a new costly skill would exceed the budget', () =>
    {
      const actor = makeActorWithSkills(sandbox, [ 1, 2 ]);
      actor.setMaxSlotPoints(3);
      actor.equipSkillToSlot(0, 2);

      expect(actor.hasEquipSkillPoints(1)).toBe(false);
    });
  });
});
//endregion plugins/sks/game-actor-slot-budget.test.js
