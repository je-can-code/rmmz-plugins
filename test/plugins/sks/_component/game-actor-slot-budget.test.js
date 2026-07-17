//region plugins/sks/_component/game-actor-slot-budget.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installSksHostGlobals, setPluginContextToJBase, setPluginContextToJSks, skillData } from './fixtures/install-sks-host-globals.js';
import RPG_Skill from '../../../../src/plugins/_base/database/implementations/RPG_Skill.js';

describe('J-SkillSlots Game_Actor slot point budget (direct src import)', () =>
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

    await import('../../../../src/plugins/sks/core/database/RPG_Skill.js');
    await import('../../../../src/plugins/sks/core/objects/Game_Actor.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
    globalThis.$dataSkills = [
      null,
      skillData({ id: 1, stypeId: 1, name: 'Cheap', note: '<slotCost:1>', damage: { elementId: 0 } }),
      skillData({ id: 2, stypeId: 1, name: 'Pricey', note: '<slotCost:3>', damage: { elementId: 0 } }),
      skillData({ id: 3, stypeId: 1, name: 'Free', note: '', damage: { elementId: 0 } }),
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

  describe('maxSlotPoints', () =>
  {
    it('falls back to the plugin default when neither the actor nor class carries a baseline tag', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([]);
      actor.getActorNotes = () => [];
      actor.getAllNotes = () => [];

      // Act & Assert
      expect(actor.maxSlotPoints()).toBe(4);
    });

    it('resolves the baseline from a <baseSlotPoints:[FORMULA]> tag on the actor/class', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([]);
      withMaxSlotPoints(actor, 7);

      // Act & Assert
      expect(actor.maxSlotPoints()).toBe(7);
    });

    it('adds bonus <maxSlotPoints:[FORMULA]> tags from getAllNotes on top of the baseline', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([]);
      actor.getActorNotes = () => [ { note: '<baseSlotPoints:[5]>' } ];
      actor.getAllNotes = () => [ { note: '<maxSlotPoints:[2]>' }, { note: '<maxSlotPoints:[1]>' } ];

      // Act & Assert
      expect(actor.maxSlotPoints()).toBe(8);
    });

    it('clamps the combined total to a minimum of zero', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([]);
      actor.getActorNotes = () => [ { note: '<baseSlotPoints:[2]>' } ];
      actor.getAllNotes = () => [ { note: '<maxSlotPoints:[-10]>' } ];

      // Act & Assert
      expect(actor.maxSlotPoints()).toBe(0);
    });
  });

  describe('remainingSlotPoints / hasSufficientSlotPoints', () =>
  {
    it('remainingSlotPoints reflects max minus spent', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([ 1, 2 ]);
      withMaxSlotPoints(actor, 10);
      actor.equipSkillToSlot(0, 2);

      // Act & Assert
      expect(actor.remainingSlotPoints()).toBe(7);
    });

    it('hasSufficientSlotPoints treats zero-or-negative cost as always affordable', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([]);
      withMaxSlotPoints(actor, 0);

      // Act & Assert
      expect(actor.hasSufficientSlotPoints(0)).toBe(true);
    });

    it('hasSufficientSlotPoints is false with no remaining budget and a real cost', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([ 2 ]);
      withMaxSlotPoints(actor, 3);
      actor.equipSkillToSlot(0, 2);

      // Act & Assert
      expect(actor.hasSufficientSlotPoints(1)).toBe(false);
    });

    it('hasSufficientSlotPoints is true when the added cost still fits the budget', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([ 1 ]);
      withMaxSlotPoints(actor, 5);

      // Act & Assert
      expect(actor.hasSufficientSlotPoints(1)).toBe(true);
    });
  });

  describe('slot management primitives (assignSlot / deleteSlot / slotMap / slots)', () =>
  {
    it('assignSlot populates both the slots array and the slot map', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([ 1 ]);

      // Act
      actor.assignSlot(2, 1);

      // Assert
      expect(actor.slotMap().get(2)).toBe(1);
      expect(actor.slots()[2].skillId).toBe(1);
      expect(actor.slots()[2].index).toBe(2);
    });

    it('deleteSlot removes the entry from both the slots array and the slot map', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([ 1 ]);
      actor.assignSlot(2, 1);

      // Act
      actor.deleteSlot(2);

      // Assert
      expect(actor.slotMap().has(2)).toBe(false);
      expect(actor.slots()[2]).toBeUndefined();
    });

    it('clearSlotMap empties every tracked slot', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([ 1, 2 ]);
      actor.assignSlot(0, 1);
      actor.assignSlot(1, 2);

      // Act
      actor.clearSlotMap();

      // Assert
      expect(actor.slotMap().size).toBe(0);
    });
  });

  describe('skillSlotCost / hasEquipSkillPoints', () =>
  {
    it('skillSlotCost returns 0 for a non-positive skill id', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([]);

      // Act & Assert
      expect(actor.skillSlotCost(0, 0)).toBe(0);
      expect(actor.skillSlotCost(-1, 0)).toBe(0);
    });

    it('skillSlotCost resolves the skill\'s own slotCost tag otherwise', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([ 2 ]);

      // Act & Assert
      expect(actor.skillSlotCost(2, 0)).toBe(3);
    });

    it('hasEquipSkillPoints is true for free skills regardless of budget', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([ 3 ]);
      withMaxSlotPoints(actor, 0);

      // Act & Assert
      expect(actor.hasEquipSkillPoints(3)).toBe(true);
    });

    it('hasEquipSkillPoints is true when the skill is already equipped (move, not new spend)', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([ 2 ]);
      withMaxSlotPoints(actor, 3);
      actor.equipSkillToSlot(0, 2);

      // Act & Assert
      expect(actor.hasEquipSkillPoints(2)).toBe(true);
    });

    it('hasEquipSkillPoints is false when a new costly skill would exceed the budget', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([ 1, 2 ]);
      withMaxSlotPoints(actor, 3);
      actor.equipSkillToSlot(0, 2);

      // Act & Assert
      expect(actor.hasEquipSkillPoints(1)).toBe(false);
    });
  });
});
//endregion plugins/sks/_component/game-actor-slot-budget.test.js
