//region plugins/sks/_component/game-actor-unslotted-exemptions.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installSksHostGlobals, setPluginContextToJBase, setPluginContextToJSks, skillData } from './fixtures/install-sks-host-globals.js';
import RPG_Skill from '../../../../src/plugins/_base/core/database/implementations/RPG_Skill.js';

describe('J-SkillSlots Game_Actor forced-unslotted exemptions & stale slot pruning (direct src import)', () =>
{
  let baseOnBattlerDataChange;

  beforeAll(async () =>
  {
    vi.resetModules();

    installSksHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/core/managers/RPGManager.js'));

    await import('../../../../src/plugins/_base/core/objects/Game_Battler.js');

    // a base onBattlerDataChange must exist before sks/core's Game_Actor.js aliases it, since
    // nothing else in this fixture provides one- the real engine's Game_Battler.js does.
    baseOnBattlerDataChange = vi.fn();
    globalThis.Game_Actor.prototype.onBattlerDataChange = baseOnBattlerDataChange;

    setPluginContextToJSks();
    await import('../../../../src/plugins/sks/core/_metadata/initialization.js');

    globalThis.RPG_Skill = RPG_Skill;

    await import('../../../../src/plugins/sks/core/database/RPG_Skill.js');
    await import('../../../../src/plugins/sks/core/objects/Game_Actor.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
    baseOnBattlerDataChange.mockClear();
    globalThis.$dataSkills = [
      null,
      skillData({
        id: 1, stypeId: 1, name: 'Skill A', note: '<slotCost:1>', damage: { elementId: 0 },
      }),
      skillData({
        id: 2, stypeId: 1, name: 'Skill B', note: '<slotCost:1>', damage: { elementId: 0 },
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
    actor.hasSkill = function(skillId)
    {
      return skillIds.includes(skillId);
    };
    actor.initMembers();
    return actor;
  }

  describe('forcedUnslottedSkillIds', () =>
  {
    it('is empty when no note source carries the tag', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([]);
      actor.getAllNotes = () => [ { note: '' } ];

      // Act & Assert
      expect(actor.forcedUnslottedSkillIds()).toEqual(new Set());
    });

    it('collects ids from a single <unslottedSkills:[...]> tag', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([]);
      actor.getAllNotes = () => [ { note: '<unslottedSkills:[901,902]>' } ];

      // Act & Assert
      expect(actor.forcedUnslottedSkillIds()).toEqual(new Set([ 901, 902 ]));
    });

    it('merges and dedupes ids across multiple note sources', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([]);
      actor.getAllNotes = () => [
        { note: '<unslottedSkills:[901,902]>' },
        { note: '<unslottedSkills:[902,903]>' },
      ];

      // Act & Assert
      expect(actor.forcedUnslottedSkillIds()).toEqual(new Set([ 901, 902, 903 ]));
    });

    it('caches the result until onBattlerDataChange invalidates it', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([]);
      actor.getAllNotes = () => [ { note: '<unslottedSkills:[901]>' } ];
      const firstResult = actor.forcedUnslottedSkillIds();

      // Act- change what the notes would report, but don't invalidate yet.
      actor.getAllNotes = () => [ { note: '<unslottedSkills:[902]>' } ];
      const cachedResult = actor.forcedUnslottedSkillIds();

      // Assert- still the original cached set, not recomputed.
      expect(cachedResult).toBe(firstResult);
      expect(cachedResult).toEqual(new Set([ 901 ]));
    });

    it('recomputes after onBattlerDataChange fires', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([]);
      actor.getAllNotes = () => [ { note: '<unslottedSkills:[901]>' } ];
      actor.forcedUnslottedSkillIds();

      // Act
      actor.getAllNotes = () => [ { note: '<unslottedSkills:[902]>' } ];
      actor.onBattlerDataChange();

      // Assert
      expect(actor.forcedUnslottedSkillIds()).toEqual(new Set([ 902 ]));
    });
  });

  describe('onBattlerDataChange', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([]);
      actor.getAllNotes = () => [];

      // Act
      actor.onBattlerDataChange();

      // Assert
      expect(baseOnBattlerDataChange).toHaveBeenCalledOnce();
    });
  });

  describe('pruneStaleSlots', () =>
  {
    it('leaves a slot alone when its skill is still known', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([ 1 ]);
      actor.assignSlot(0, 1);

      // Act
      actor.pruneStaleSlots();

      // Assert
      expect(actor.getSkillIdInSlot(0)).toBe(1);
    });

    it('clears a slot whose skill is no longer known', () =>
    {
      // Arrange- assign a skill to a slot, then simulate the actor losing access to it.
      const actor = makeActorWithSkills([ 1 ]);
      actor.assignSlot(0, 1);
      actor.hasSkill = () => false;

      // Act
      actor.pruneStaleSlots();

      // Assert
      expect(actor.getSkillIdInSlot(0)).toBe(0);
    });

    it('fires the unequip-change hook for each pruned slot', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([ 1 ]);
      actor.assignSlot(0, 1);
      actor.hasSkill = () => false;
      const onSkillUnequipChange = vi.fn();
      actor.onSkillUnequipChange = onSkillUnequipChange;

      // Act
      actor.pruneStaleSlots();

      // Assert
      expect(onSkillUnequipChange).toHaveBeenCalledWith(0, 1);
    });

    it('is invoked automatically when onBattlerDataChange fires', () =>
    {
      // Arrange
      const actor = makeActorWithSkills([ 1 ]);
      actor.getAllNotes = () => [];
      actor.assignSlot(0, 1);
      actor.hasSkill = () => false;

      // Act
      actor.onBattlerDataChange();

      // Assert
      expect(actor.getSkillIdInSlot(0)).toBe(0);
    });
  });
});
//endregion plugins/sks/_component/game-actor-unslotted-exemptions.test.js
