//region plugins/sks/_component/game-actor-slots.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installSksHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJSks,
  skillData,
  weaponData,
} from './fixtures/install-sks-host-globals.js';
import RPG_Skill from '../../../../src/plugins/_base/core/database/implementations/RPG_Skill.js';
import RPG_EquipItem from '../../../../src/plugins/_base/core/database/core/RPG_EquipItem.js';

describe('J-SkillSlots Game_Actor slots (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installSksHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/core/managers/RPGManager.js'));

    await import('../../../../src/plugins/_base/core/objects/Game_Battler.js');

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

  /**
   * Stubs the actor's note sources so `maxSlotPoints()` resolves to a specific budget, bypassing
   * the removed `setMaxSlotPoints` scaffolding. Mirrors the `getAllNotes` stub pattern already used
   * for `apr` in test/plugins/apt/core/_component/game-battler-objects-direct.test.js.
   * @param {Game_Actor} actor The actor to stub.
   * @param {number} amount The baseline slot point value to bake into the actor's notes.
   */
  function withMaxSlotPoints(actor, amount)
  {
    actor.getActorNotes = () => [ { note: `<baseSlotPoints:[${amount}]>` } ];
    actor.getAllNotes = () => [];
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

  describe('maxSlots', () =>
  {
    it('falls back to the plugin default when neither the actor nor class carries a baseline tag', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([]);
      actor.getActorNotes = () => [];
      actor.getAllNotes = () => [];

      // Act & Assert
      expect(actor.maxSlots()).toBe(4);
    });

    it('resolves the baseline from a <baseSlots:[FORMULA]> tag on the actor/class', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([]);
      actor.getActorNotes = () => [ { note: '<baseSlots:[6]>' } ];
      actor.getAllNotes = () => [];

      // Act & Assert
      expect(actor.maxSlots()).toBe(6);
    });

    it('adds bonus <maxSlots:[FORMULA]> tags from getAllNotes on top of the baseline', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([]);
      actor.getActorNotes = () => [ { note: '<baseSlots:[4]>' } ];
      actor.getAllNotes = () => [ { note: '<maxSlots:[1]>' } ];

      // Act & Assert
      expect(actor.maxSlots()).toBe(5);
    });

    it('clamps the combined total to a minimum of zero', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([]);
      actor.getActorNotes = () => [ { note: '<baseSlots:[1]>' } ];
      actor.getAllNotes = () => [ { note: '<maxSlots:[-10]>' } ];

      // Act & Assert
      expect(actor.maxSlots()).toBe(0);
    });
  });

  it('equipSkillToSlot spends points and blocks when over budget', () =>
  {
    // Arrange
    const actor = makeActorWithSkills([ 2, 5 ]);
    withMaxSlotPoints(actor, 4);

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
    withMaxSlotPoints(actor, 4);
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
    withMaxSlotPoints(actor, 4);
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
    withMaxSlotPoints(actor, 4);
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
    withMaxSlotPoints(actor, 4);
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
    withMaxSlotPoints(actor, 4);
    actor.equipSkillToSlot(1, 1);

    // Act
    actor.equipSkillToSlot(1, 1);

    // Assert
    expect(actor.getSkillIdInSlot(1)).toBe(1);
    expect(actor.getEquippedSkillIndex(1)).toBe(1);
  });

  //region taking skills back out and shuffling them around
  describe('unequipSkill', () =>
  {
    it('clears the slot the skill was occupying', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([ 1 ]);
      withMaxSlotPoints(actor, 10);
      actor.equipSkillToSlot(0, 1);

      // Act
      actor.unequipSkill(1);

      // Assert
      expect(actor.getSkillIdInSlot(0)).toBe(0);
    });

    it('does nothing for a skill that is not equipped anywhere', () =>
    {
      // Arrange- the menu offers unequip against any known skill, so being asked about one that is
      // not in a slot is ordinary rather than exceptional.
      const actor = makeActorWithSkills([ 1, 2 ]);
      withMaxSlotPoints(actor, 10);
      actor.equipSkillToSlot(0, 1);

      // Act
      actor.unequipSkill(2);

      // Assert
      expect(actor.getSkillIdInSlot(0)).toBe(1);
    });
  });

  describe('equipSkillToSlot displacement', () =>
  {
    it('vacates the previous slot when an equipped skill is placed into another one', () =>
    {
      // Arrange- equipping directly rather than through moveEquippedSkill, which clears the source
      // slot itself once the destination is set and would therefore mask a failure to vacate here.
      const actor = makeActorWithSkills([ 1 ]);
      withMaxSlotPoints(actor, 10);
      actor.equipSkillToSlot(0, 1);

      // Act
      actor.equipSkillToSlot(1, 1);

      // Assert- one occupant total, not the same skill sitting in two slots at once.
      expect(actor.getSkillIdInSlot(1)).toBe(1);
      expect(actor.getSkillIdInSlot(0)).toBe(0);
      expect(actor.slotMap().size).toBe(1);
    });
  });

  describe('equip change hooks', () =>
  {
    it('announces nothing unequipped when a fresh skill lands in an empty slot', () =>
    {
      // Arrange- two separate paths could announce an unequip during this equip and neither should
      // fire: the skill is not equipped anywhere, so no previous slot is being vacated, and the
      // target slot is empty, so nothing is being displaced out of it.
      const actor = makeActorWithSkills([ 1 ]);
      withMaxSlotPoints(actor, 10);
      const unequipped = vi.fn();
      actor.onSkillUnequipChange = unequipped;

      // Act
      actor.equipSkillToSlot(0, 1);

      // Assert- the equip landed, so the silence is the absence of a notification rather than the
      // absence of the operation.
      expect(actor.getSkillIdInSlot(0)).toBe(1);
      expect(unequipped).not.toHaveBeenCalled();
    });

    it('announces the displaced skill before a new one takes its slot', () =>
    {
      // Arrange- the incoming skill is not equipped anywhere else, so the only notification this
      // equip can produce is the one for the occupant being pushed out.
      const actor = makeActorWithSkills([ 1, 2 ]);
      withMaxSlotPoints(actor, 10);
      actor.equipSkillToSlot(0, 1);
      const unequipped = vi.fn();
      actor.onSkillUnequipChange = unequipped;

      // Act
      actor.equipSkillToSlot(0, 2);

      // Assert
      expect(unequipped).toHaveBeenCalledTimes(1);
      expect(unequipped).toHaveBeenCalledWith(0, 1);
    });

    it('announces nothing when asked to clear a slot that was already empty', () =>
    {
      // Arrange- the equip menu lets the cursor rest on an empty slot, so being asked to clear one
      // is ordinary rather than exceptional. Announcing the unequip of nothing would have every
      // observer redraw for a change that did not happen.
      const actor = makeActorWithSkills([ 1 ]);
      withMaxSlotPoints(actor, 10);
      actor.equipSkillToSlot(0, 1);
      const unequipped = vi.fn();
      actor.onSkillUnequipChange = unequipped;

      // Act
      actor.unequipSkillFromSlot(3);

      // Assert- the genuinely occupied slot is untouched, so nothing was cleared and nothing was
      // announced.
      expect(actor.getSkillIdInSlot(0)).toBe(1);
      expect(unequipped).not.toHaveBeenCalled();
    });
  });

  describe('moveEquippedSkill', () =>
  {
    it('moves the skill out of its old slot and into the new one', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([ 1 ]);
      withMaxSlotPoints(actor, 10);
      actor.equipSkillToSlot(0, 1);

      // Act
      actor.moveEquippedSkill(0, 1);

      // Assert
      expect(actor.getSkillIdInSlot(1)).toBe(1);
      expect(actor.getSkillIdInSlot(0)).toBe(0);
    });

    it('does nothing when the source slot is empty', () =>
    {
      // Arrange- dragging from an empty slot is something the equip menu allows the cursor to do.
      const actor = makeActorWithSkills([ 1 ]);
      withMaxSlotPoints(actor, 10);
      actor.equipSkillToSlot(1, 1);

      // Act
      actor.moveEquippedSkill(0, 1);

      // Assert
      expect(actor.getSkillIdInSlot(1)).toBe(1);
    });

    it('leaves a skill dropped back onto its own slot exactly where it was', () =>
    {
      // Arrange- dropping a skill on the slot it came from is an ordinary equip-menu gesture. The
      // source clear that follows a successful move would otherwise fire against the same slot the
      // skill was just written into, and the skill would vanish off the bar entirely.
      const actor = makeActorWithSkills([ 1 ]);
      withMaxSlotPoints(actor, 10);
      actor.equipSkillToSlot(0, 1);

      // Act
      actor.moveEquippedSkill(0, 0);

      // Assert
      expect(actor.getSkillIdInSlot(0)).toBe(1);
    });

    it('leaves the source slot filled when the destination refused the skill', () =>
    {
      // Arrange- a destination that cannot afford the skill rejects the equip, and the move must
      // not then clear the source: that would lose the skill instead of merely declining to move it.
      const actor = makeActorWithSkills([ 1, 2 ]);
      withMaxSlotPoints(actor, 10);
      actor.equipSkillToSlot(0, 1);
      actor.canEquipSkillToSlot = () => false;

      // Act
      actor.moveEquippedSkill(0, 1);

      // Assert
      expect(actor.getSkillIdInSlot(0)).toBe(1);
    });
  });
  //endregion taking skills back out and shuffling them around
});
//endregion plugins/sks/_component/game-actor-slots.test.js
