//region plugins/prof/proficiency-actor.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadProfPluginVm, resetProfPluginSandbox } from './prof-vm.js';

describe('J-Proficiency Game_Actor proficiency (out/prof/J-Proficiency.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadProfPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    resetProfPluginSandbox(sandbox);
    const { skillData } = sandbox.__profTestFixtures;
    sandbox.$dataSkills = [ null ];
    sandbox.$dataSkills[10] = skillData({
      id: 10,
      name: 'Track',
      note: '',
      damage: { elementId: 0 },
    });
    sandbox.$dataSkills[99] = skillData({
      id: 99,
      name: 'Reward',
      note: '',
      damage: { elementId: 0 },
    });
  });

  function makeActor(s)
  {
    const actor = new s.Game_Actor();
    actor.initMembers();
    actor.learnSkill(10);
    return actor;
  }

  it('increaseSkillProficiency accumulates and unlocks conditional skill rewards', () =>
  {
    const actor = makeActor(sandbox);
    actor.increaseSkillProficiency(10, 1);
    actor.increaseSkillProficiency(10, 1);
    expect(actor.skillProficiencyBySkillId(10).proficiency).toBe(2);
    actor.increaseSkillProficiency(10, 1);
    expect(actor.skillProficiencyBySkillId(10).proficiency).toBe(3);
    expect(actor.isConditionalUnlocked('vitest_unlock_skill')).toBe(true);
    expect(actor.isLearnedSkill(99)).toBe(true);
  });

  it('canGainProficiency is false when proficiencyGainingBlock is present on actor notes', () =>
  {
    const actor = makeActor(sandbox);
    const blocked = {
      id: 1,
      name: '',
      note: '<proficiencyGainingBlock>',
      classId: 1,
      traits: [],
    };
    actor.actor = function()
    {
      return blocked;
    };
    actor.onBattlerDataChange();
    expect(actor.canGainProficiency()).toBe(false);
  });

  it('updateBonusSkillProficiencyGains reads proficiencyBonus from actor notes', () =>
  {
    const { actorData } = sandbox.__profTestFixtures;
    const actor = new sandbox.Game_Actor();
    actor.__actorDb = actorData({
      id: 1,
      name: '',
      note: '<proficiencyBonus:3>',
      classId: 1,
      traits: [],
    });
    actor.initMembers();
    actor.updateBonusSkillProficiencyGains();
    expect(actor.prof).toBe(3);
  });
});
//endregion plugins/prof/proficiency-actor.test.js
