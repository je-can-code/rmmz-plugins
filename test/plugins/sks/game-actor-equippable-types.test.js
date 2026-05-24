//region plugins/sks/game-actor-equippable-types.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadSksPluginVm, resetSksPluginSandbox } from './sks-vm.js';

describe('J-SkillSlots equippable skill types (out/sks/J-SkillSlots.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadSksPluginVm(sandbox, {
      skillSlotsParameters: {
        'menu-switch': '101',
        'equippable-skill-type-ids': '[2]',
      },
    });
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
        name: 'WrongType',
        note: '<slotCost:1>',
        damage: { elementId: 0 },
      }),
      skillData({
        id: 2,
        stypeId: 2,
        name: 'AllowedType',
        note: '<slotCost:1>',
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

  it('treats skills whose stypeId is not in equippable-skill-type-ids as unslotted', () =>
  {
    expect(sandbox.J.SKS.Metadata.equippableSkillTypeIds).toEqual([ 2 ]);
    expect(sandbox.$dataSkills[1].unslotted).toBe(true);
    expect(sandbox.$dataSkills[2].unslotted).toBe(false);
  });

  it('equippedSkills only lists slotted skills of allowed types', () =>
  {
    const actor = makeActorWithSkills(sandbox, [ 1, 2 ]);
    actor.equipSkillToSlot(0, 2);
    const equipped = actor.equippedSkills();
    expect(equipped.map(s => s.id)).toEqual([ 2 ]);
  });
});
//endregion plugins/sks/game-actor-equippable-types.test.js
