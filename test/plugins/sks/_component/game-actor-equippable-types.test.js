//region plugins/sks/_component/game-actor-equippable-types.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installSksHostGlobals, setPluginContextToJBase, setPluginContextToJSks, skillData } from './fixtures/install-sks-host-globals.js';
import RPG_Skill from '../../../../src/plugins/_base/database/implementations/RPG_Skill.js';

describe('J-SkillSlots equippable skill types (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installSksHostGlobals(globalThis, {
      'menu-switch': '101',
      'equippable-skill-type-ids': '[2]',
    });

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/managers/RPGManager.js'));

    // Game_Actor's skill() (via Game_Battler.js) is what sks's own Game_Actor.js calls internally.
    await import('../../../../src/plugins/_base/objects/Game_Battler.js');

    setPluginContextToJSks();
    await import('../../../../src/plugins/sks/core/_metadata/initialization.js');

    globalThis.RPG_Skill = RPG_Skill;

    // patches globalThis.RPG_Skill.prototype/Game_Actor.prototype directly, no vm involved.
    await import('../../../../src/plugins/sks/core/database/RPG_Skill.js');
    await import('../../../../src/plugins/sks/core/objects/Game_Actor.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
    globalThis.$dataSkills = [
      null,
      skillData({
        id: 1, stypeId: 1, name: 'WrongType', note: '<slotCost:1>', damage: { elementId: 0 },
      }),
      skillData({
        id: 2, stypeId: 2, name: 'AllowedType', note: '<slotCost:1>', damage: { elementId: 0 },
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

  it('treats skills whose stypeId is not in equippable-skill-type-ids as unslotted', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.SKS.Metadata.equippableSkillTypeIds).toEqual([ 2 ]);
    expect(globalThis.$dataSkills[1].unslotted).toBe(true);
    expect(globalThis.$dataSkills[2].unslotted).toBe(false);
  });

  it('equippedSkills only lists slotted skills of allowed types', () =>
  {
    // Arrange
    const actor = makeActorWithSkills([ 1, 2 ]);
    actor.getActorNotes = () => [ { note: '<baseSlotPoints:[4]>' } ];
    actor.getAllNotes = () => [];

    // Act
    actor.equipSkillToSlot(0, 2);
    const equipped = actor.equippedSkills();

    // Assert
    expect(equipped.map(s => s.id)).toEqual([ 2 ]);
  });
});
//endregion plugins/sks/_component/game-actor-equippable-types.test.js
