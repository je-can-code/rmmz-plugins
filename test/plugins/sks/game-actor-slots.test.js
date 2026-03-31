//region plugins/sks/game-actor-slots.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadSksPluginVm, resetSksPluginSandbox } from './sks-vm.js';

describe('J-SkillSlots Game_Actor slots (out/J-SkillSlots.js)', () =>
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
      skillData({
        id: 1,
        stypeId: 1,
        name: 'Cheap',
        note: '<slotCost:1>',
        damage: { elementId: 0 },
      }),
      skillData({
        id: 2,
        stypeId: 1,
        name: 'Pricey',
        note: '<slotCost:3>',
        damage: { elementId: 0 },
      }),
      skillData({
        id: 3,
        stypeId: 1,
        name: 'Freeish',
        note: '',
        damage: { elementId: 0 },
      }),
      skillData({
        id: 4,
        stypeId: 1,
        name: 'AlwaysOn',
        note: '<unslotted>',
        damage: { elementId: 0 },
      }),
      skillData({
        id: 5,
        stypeId: 1,
        name: 'Medium',
        note: '<slotCost:2>',
        damage: { elementId: 0 },
      }),
    ];
  });

  function makeActorWithSkills(s, skillIds)
  {
    const actor = new s.Game_Actor();
    actor.skills = function()
    {
      return skillIds
        .map(id => s.$dataSkills[id])
        .filter(Boolean);
    };
    actor.initMembers();
    return actor;
  }

  it('slotCost and unslotted reflect skill notetags', () =>
  {
    expect(sandbox.$dataSkills[1].slotCost).toBe(1);
    expect(sandbox.$dataSkills[2].slotCost).toBe(3);
    expect(sandbox.$dataSkills[3].slotCost).toBe(0);
    expect(sandbox.$dataSkills[4].unslotted).toBe(true);
    expect(sandbox.$dataSkills[1].unslotted).toBe(false);
  });

  it('equipSkillToSlot spends points and blocks when over budget', () =>
  {
    const actor = makeActorWithSkills(sandbox, [ 2, 5 ]);
    actor.setMaxSlotPoints(4);
    actor.equipSkillToSlot(0, 2);
    expect(actor.spentSlotPoints()).toBe(3);
    expect(actor.canEquipSkillToSlot(1, 5)).toBe(false);
    actor.equipSkillToSlot(1, 5);
    expect(actor.getSkillIdInSlot(1)).toBe(0);
  });

  it('equipSkillToSlot allows a second costly skill when replacing cheaper occupant within budget', () =>
  {
    const actor = makeActorWithSkills(sandbox, [ 1, 2 ]);
    actor.setMaxSlotPoints(4);
    actor.equipSkillToSlot(0, 1);
    expect(actor.spentSlotPoints()).toBe(1);
    actor.equipSkillToSlot(0, 2);
    expect(actor.getSkillIdInSlot(0)).toBe(2);
    expect(actor.spentSlotPoints()).toBe(3);
  });

  it('equippedSkills returns only slotted learned skills', () =>
  {
    const actor = makeActorWithSkills(sandbox, [ 1, 3, 4 ]);
    actor.equipSkillToSlot(0, 1);
    const equipped = actor.equippedSkills();
    expect(equipped.map(s => s.id)).toEqual([ 1 ]);
  });

  it('unequipSkillFromSlot frees slot points', () =>
  {
    const actor = makeActorWithSkills(sandbox, [ 2 ]);
    actor.setMaxSlotPoints(4);
    actor.equipSkillToSlot(2, 2);
    expect(actor.spentSlotPoints()).toBe(3);
    actor.unequipSkillFromSlot(2);
    expect(actor.spentSlotPoints()).toBe(0);
  });

  it('RPG_Weapon slotCostModifier parses from equipment notes', () =>
  {
    const { weaponData } = sandbox.__sksTestFixtures;
    const weapon = weaponData({
      id: 1,
      name: 'LightGrip',
      note: '<slotCostModifier:-1>',
      wtypeId: 1,
    });
    expect(weapon.slotCostModifier).toBe(-1);
  });

  it('moveEquippedSkill relocates a skill between slots', () =>
  {
    const actor = makeActorWithSkills(sandbox, [ 1 ]);
    actor.setMaxSlotPoints(4);
    actor.equipSkillToSlot(0, 1);
    expect(actor.getSkillIdInSlot(0)).toBe(1);
    actor.moveEquippedSkill(0, 3);
    expect(actor.getSkillIdInSlot(0)).toBe(0);
    expect(actor.getSkillIdInSlot(3)).toBe(1);
  });

  it('equipSkillToSlot is a no-op when moving the same skill into its current slot', () =>
  {
    const actor = makeActorWithSkills(sandbox, [ 1, 2 ]);
    actor.setMaxSlotPoints(4);
    actor.equipSkillToSlot(1, 1);
    actor.equipSkillToSlot(1, 1);
    expect(actor.getSkillIdInSlot(1)).toBe(1);
    expect(actor.getEquippedSkillIndex(1)).toBe(1);
  });
});
//endregion plugins/sks/game-actor-slots.test.js
