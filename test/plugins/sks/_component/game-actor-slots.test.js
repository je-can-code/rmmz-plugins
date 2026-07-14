//region plugins/sks/_component/game-actor-slots.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installSksHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJSks,
  skillData,
  weaponData,
} from './fixtures/install-sks-host-globals.js';
import RPG_Skill from '../../../../src/plugins/_base/database/implementations/RPG_Skill.js';
import RPG_EquipItem from '../../../../src/plugins/_base/database/core/RPG_EquipItem.js';

describe('J-SkillSlots Game_Actor slots (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installSksHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/managers/RPGManager.js'));

    await import('../../../../src/plugins/_base/objects/Game_Battler.js');

    setPluginContextToJSks();
    await import('../../../../src/plugins/sks/core/_metadata/initialization.js');

    globalThis.RPG_Skill = RPG_Skill;
    globalThis.RPG_EquipItem = RPG_EquipItem;

    await import('../../../../src/plugins/sks/core/database/RPG_Skill.js');
    await import('../../../../src/plugins/sks/core/database/RPG_EquipItem.js');
    await import('../../../../src/plugins/sks/core/objects/Game_Actor.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
    globalThis.$dataSkills = [
      null,
      skillData({
        id: 1, stypeId: 1, name: 'Cheap', note: '<slotCost:1>', damage: { elementId: 0 },
      }),
      skillData({
        id: 2, stypeId: 1, name: 'Pricey', note: '<slotCost:3>', damage: { elementId: 0 },
      }),
      skillData({
        id: 3, stypeId: 1, name: 'Freeish', note: '', damage: { elementId: 0 },
      }),
      skillData({
        id: 4, stypeId: 1, name: 'AlwaysOn', note: '<unslotted>', damage: { elementId: 0 },
      }),
      skillData({
        id: 5, stypeId: 1, name: 'Medium', note: '<slotCost:2>', damage: { elementId: 0 },
      }),
    ];
  });

  function makeActorWithSkills(skillIds)
  {
    const actor = new globalThis.Game_Actor();
    actor.skills = function()
    {
      return skillIds.map(id => globalThis.$dataSkills[id]).filter(Boolean);
    };
    actor.initMembers();
    return actor;
  }

  it('slotCost and unslotted reflect skill notetags', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.$dataSkills[1].slotCost).toBe(1);
    expect(globalThis.$dataSkills[2].slotCost).toBe(3);
    expect(globalThis.$dataSkills[3].slotCost).toBe(0);
    expect(globalThis.$dataSkills[4].unslotted).toBe(true);
    expect(globalThis.$dataSkills[1].unslotted).toBe(false);
  });

  it('equipSkillToSlot spends points and blocks when over budget', () =>
  {
    // Arrange
    const actor = makeActorWithSkills([ 2, 5 ]);
    actor.setMaxSlotPoints(4);

    // Act
    actor.equipSkillToSlot(0, 2);

    // Assert
    expect(actor.spentSlotPoints()).toBe(3);
    expect(actor.canEquipSkillToSlot(1, 5)).toBe(false);
    actor.equipSkillToSlot(1, 5);
    expect(actor.getSkillIdInSlot(1)).toBe(0);
  });

  it('equipSkillToSlot allows a second costly skill when replacing cheaper occupant within budget', () =>
  {
    // Arrange
    const actor = makeActorWithSkills([ 1, 2 ]);
    actor.setMaxSlotPoints(4);
    actor.equipSkillToSlot(0, 1);

    // Act
    actor.equipSkillToSlot(0, 2);

    // Assert
    expect(actor.getSkillIdInSlot(0)).toBe(2);
    expect(actor.spentSlotPoints()).toBe(3);
  });

  it('equippedSkills returns only slotted learned skills', () =>
  {
    // Arrange
    const actor = makeActorWithSkills([ 1, 3, 4 ]);
    actor.equipSkillToSlot(0, 1);

    // Act
    const equipped = actor.equippedSkills();

    // Assert
    expect(equipped.map(s => s.id)).toEqual([ 1 ]);
  });

  it('unequipSkillFromSlot frees slot points', () =>
  {
    // Arrange
    const actor = makeActorWithSkills([ 2 ]);
    actor.setMaxSlotPoints(4);
    actor.equipSkillToSlot(2, 2);

    // Act
    actor.unequipSkillFromSlot(2);

    // Assert
    expect(actor.spentSlotPoints()).toBe(0);
  });

  it('RPG_Weapon slotCostModifier parses from equipment notes', () =>
  {
    // Arrange
    const weapon = weaponData({
      id: 1, name: 'LightGrip', note: '<slotCostModifier:-1>', wtypeId: 1,
    });

    // Act & Assert
    expect(weapon.slotCostModifier).toBe(-1);
  });

  it('moveEquippedSkill relocates a skill between slots', () =>
  {
    // Arrange
    const actor = makeActorWithSkills([ 1 ]);
    actor.setMaxSlotPoints(4);
    actor.equipSkillToSlot(0, 1);

    // Act
    actor.moveEquippedSkill(0, 3);

    // Assert
    expect(actor.getSkillIdInSlot(0)).toBe(0);
    expect(actor.getSkillIdInSlot(3)).toBe(1);
  });

  it('equipSkillToSlot is a no-op when moving the same skill into its current slot', () =>
  {
    // Arrange
    const actor = makeActorWithSkills([ 1, 2 ]);
    actor.setMaxSlotPoints(4);
    actor.equipSkillToSlot(1, 1);

    // Act
    actor.equipSkillToSlot(1, 1);

    // Assert
    expect(actor.getSkillIdInSlot(1)).toBe(1);
    expect(actor.getEquippedSkillIndex(1)).toBe(1);
  });
});
//endregion plugins/sks/_component/game-actor-slots.test.js
