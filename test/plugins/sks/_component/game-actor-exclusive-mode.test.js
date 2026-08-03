//region plugins/sks/_component/game-actor-exclusive-mode.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_SKS_PLUGIN_PARAMS,
  installSksHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJSks,
  skillData,
} from './fixtures/install-sks-host-globals.js';
import { installPluginManagerWithParams } from '../../../setup/install-plugin-manager-with-params.js';
import RPG_Skill from '../../../../src/plugins/_base/core/database/implementations/RPG_Skill.js';

/**
 * Swaps the active J.SKS.Metadata for one built from the given params, without repeating the full
 * host-globals install or re-running J.SKS's own initialization.js- that file reassigns `J.SKS = {}`
 * wholesale, which would wipe `J.SKS.Aliased.Game_Actor` (populated once by the real Game_Actor.js
 * import in the outer beforeAll) and break every already-imported aliased method. Game_Actor.js reads
 * `J.SKS.Metadata.*` dynamically on every call rather than caching it at import time, so directly
 * replacing just this one property is enough to change mode for already-imported prototype methods.
 * PluginMetadata tracks registered plugin names on a class-private static field, so constructing
 * against the same class object twice throws "duplicate plugin entry"- re-importing both
 * PluginMetadata and _pluginMetadata.js fresh (after resetModules) gives each call its own
 * never-registered class to construct from.
 * @param {Record<string, string>} pluginParameterStrings
 */
async function setSksMode(pluginParameterStrings)
{
  vi.resetModules();

  ({ default: globalThis.PluginMetadata } = await import('../../../../src/plugins/_base/core/models/PluginMetadata.js'));

  installPluginManagerWithParams(globalThis, 'J-SkillSlots', pluginParameterStrings);
  setPluginContextToJSks();

  const { default: JSkillSlots_PluginMetadata } = await import('../../../../src/plugins/sks/core/_metadata/_pluginMetadata.js');
  globalThis.J.SKS.Metadata = new JSkillSlots_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);
}

/**
 * Stubs the actor's note sources so `maxSlots()`/`maxSlotPoints()` resolve to specific budgets.
 * @param {Game_Actor} actor The actor to stub.
 * @param {number} slots The baseline slot count to bake into the actor's notes.
 * @param {number} points The baseline slot point value to bake into the actor's notes.
 */
function withCapacity(actor, slots, points)
{
  actor.getActorNotes = () => [ { note: `<baseSlots:[${slots}]><baseSlotPoints:[${points}]>` } ];
  actor.getAllNotes = () => [];
}

describe('J-SkillSlots Game_Actor exclusive mode (direct src import)', () =>
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

    await import('../../../../src/plugins/sks/core/database/RPG_Skill.js');
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
        id: 3, stypeId: 1, name: 'Free', note: '', damage: { elementId: 0 },
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

  describe('tandem mode (exclusive mode disabled)', () =>
  {
    beforeEach(async () =>
    {
      await setSksMode({ ...DEFAULT_SKS_PLUGIN_PARAMS, 'enable-exclusive-mode': 'false', 'slots-only': 'false' });
    });

    it('blocks equipping when cost alone would exceed points, even with slot room to spare', () =>
    {
      // Arrange- 1 slot used of 4, but the point budget is exhausted by the first skill.
      const actor = makeActorWithSkills([ 1, 2 ]);
      withCapacity(actor, 4, 3);
      actor.equipSkillToSlot(0, 2);

      // Act
      const result = actor.canEquipSkillToSlot(1, 1);

      // Assert
      expect(result).toBe(false);
    });

    it('blocks equipping when slots are full, even with point room to spare', () =>
    {
      // Arrange- fill all 2 slots, leaving plenty of point budget, then try a third, unequipped skill.
      const actor = makeActorWithSkills([ 1, 2, 3 ]);
      withCapacity(actor, 2, 10);
      actor.equipSkillToSlot(0, 1);
      actor.equipSkillToSlot(1, 3);

      // Act
      const result = actor.canEquipSkillToSlot(2, 2);

      // Assert
      expect(result).toBe(false);
    });

    it('allows equipping when both points and slots have room', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([ 1 ]);
      withCapacity(actor, 4, 4);

      // Act
      const result = actor.canEquipSkillToSlot(0, 1);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('exclusive mode, slots only', () =>
  {
    beforeEach(async () =>
    {
      await setSksMode({ ...DEFAULT_SKS_PLUGIN_PARAMS, 'enable-exclusive-mode': 'true', 'slots-only': 'true' });
    });

    it('allows equipping despite exceeding the point budget, because a slot is free', () =>
    {
      // Arrange- point budget of 1 is already exhausted, but only 1 of 4 slots is used.
      const actor = makeActorWithSkills([ 1, 2 ]);
      withCapacity(actor, 4, 1);
      actor.equipSkillToSlot(0, 1);

      // Act
      const result = actor.canEquipSkillToSlot(1, 2);

      // Assert
      expect(result).toBe(true);
    });

    it('blocks equipping when slots are full, even for a free (cost-0) skill', () =>
    {
      // Arrange- fill the single available slot, then try to add a free skill.
      const actor = makeActorWithSkills([ 1, 3 ]);
      withCapacity(actor, 1, 10);
      actor.equipSkillToSlot(0, 1);

      // Act
      const result = actor.canEquipSkillToSlot(1, 3);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('exclusive mode, points only', () =>
  {
    beforeEach(async () =>
    {
      await setSksMode({ ...DEFAULT_SKS_PLUGIN_PARAMS, 'enable-exclusive-mode': 'true', 'slots-only': 'false' });
    });

    it('allows equipping despite slots being full, because points have room', () =>
    {
      // Arrange- 1 slot capacity, already occupied, but the point budget still has room.
      const actor = makeActorWithSkills([ 1, 3 ]);
      withCapacity(actor, 1, 10);
      actor.equipSkillToSlot(0, 1);

      // Act- this equip would exceed the single slot cap, but slots aren't checked in this mode.
      const result = actor.canEquipSkillToSlot(1, 3);

      // Assert
      expect(result).toBe(true);
    });

    it('blocks equipping when points are exceeded, regardless of slot room', () =>
    {
      // Arrange- plenty of slots, but the point budget is exhausted.
      const actor = makeActorWithSkills([ 1, 2 ]);
      withCapacity(actor, 10, 1);
      actor.equipSkillToSlot(0, 1);

      // Act
      const result = actor.canEquipSkillToSlot(1, 2);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('mode-agnostic short-circuits', () =>
  {
    beforeEach(async () =>
    {
      await setSksMode({ ...DEFAULT_SKS_PLUGIN_PARAMS, 'enable-exclusive-mode': 'true', 'slots-only': 'true' });
    });

    it('never fails the count check when relocating an already-equipped skill into an empty slot', () =>
    {
      // Arrange- both slots are at capacity, and the skill being moved already occupies one of them.
      const actor = makeActorWithSkills([ 1, 3 ]);
      withCapacity(actor, 2, 10);
      actor.equipSkillToSlot(0, 1);
      actor.equipSkillToSlot(1, 3);

      // Act- move skill 1 from slot 0 into slot 1, which is occupied by a different skill.
      actor.moveEquippedSkill(0, 1);

      // Assert- the move succeeded rather than being blocked as if it were new slot usage.
      expect(actor.getSkillIdInSlot(1)).toBe(1);
    });

    it('allows re-equipping the same skill into the slot it already occupies', () =>
    {
      // Arrange- fill the single slot to capacity with the skill under test.
      const actor = makeActorWithSkills([ 1 ]);
      withCapacity(actor, 1, 10);
      actor.equipSkillToSlot(0, 1);

      // Act
      const result = actor.canEquipSkillToSlot(0, 1);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('hasSufficientSlotCount', () =>
  {
    beforeEach(async () =>
    {
      await setSksMode({ ...DEFAULT_SKS_PLUGIN_PARAMS, 'enable-exclusive-mode': 'false', 'slots-only': 'false' });
    });

    it('is false exactly at capacity', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([ 1, 3 ]);
      withCapacity(actor, 1, 10);
      actor.equipSkillToSlot(0, 1);

      // Act & Assert
      expect(actor.hasSufficientSlotCount()).toBe(false);
    });

    it('is true with one slot free', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([ 1 ]);
      withCapacity(actor, 2, 10);
      actor.equipSkillToSlot(0, 1);

      // Act & Assert
      expect(actor.hasSufficientSlotCount()).toBe(true);
    });
  });
});
//endregion plugins/sks/_component/game-actor-exclusive-mode.test.js
