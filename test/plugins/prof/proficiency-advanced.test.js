//region plugins/prof/proficiency-advanced.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { loadProfPluginVm, resetProfPluginSandbox } from './prof-vm.js';

describe('J-Proficiency advanced conditionals (out/prof/J-Proficiency.js)', () =>
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
    [ 20, 21, 30, 31, 40, 50, 88, 98 ].forEach(id =>
    {
      sandbox.$dataSkills[id] = skillData({
        id,
        name: `S${id}`,
        note: '',
        damage: { elementId: 0 },
      });
    });
  });

  function makeActor(s, actorNumericId)
  {
    const actor = new s.Game_Actor();
    actor.actorId = function()
    {
      return actorNumericId;
    };
    actor.initMembers();
    return actor;
  }

  it('sums primary and secondary skill proficiency for a single requirement', () =>
  {
    const actor = makeActor(sandbox, 2);
    actor.learnSkill(20);
    actor.learnSkill(21);
    actor.increaseSkillProficiency(20, 2);
    actor.increaseSkillProficiency(21, 2);
    expect(actor.isConditionalUnlocked('vitest_secondary_total')).toBe(false);
    actor.increaseSkillProficiency(21, 1);
    expect(actor.isConditionalUnlocked('vitest_secondary_total')).toBe(true);
    expect(actor.isLearnedSkill(88)).toBe(true);
  });

  it('requires every requirement to be met before unlocking', () =>
  {
    const actor = makeActor(sandbox, 3);
    actor.learnSkill(30);
    actor.learnSkill(31);
    actor.increaseSkillProficiency(30, 2);
    expect(actor.isConditionalUnlocked('vitest_two_requirements')).toBe(false);
    actor.increaseSkillProficiency(31, 2);
    expect(actor.isConditionalUnlocked('vitest_two_requirements')).toBe(true);
    expect(actor.isLearnedSkill(98)).toBe(true);
  });

  it('executes jsRewards when a conditional unlocks', () =>
  {
    const actor = makeActor(sandbox, 4);
    actor.learnSkill(40);
    actor.increaseSkillProficiency(40, 1);
    expect(actor._vitestJsReward).toBe(42);
  });

  it('surfaces jsRewards errors without aborting the unlock', () =>
  {
    const actor = makeActor(sandbox, 5);
    actor.learnSkill(50);
    const errorSpy = vi.spyOn(console, 'error');
    actor.increaseSkillProficiency(50, 1);
    expect(actor.isConditionalUnlocked('vitest_js_fail')).toBe(true);
    expect(errorSpy.mock.calls.length).toBeGreaterThan(0);
    errorSpy.mockRestore();
  });
});
//endregion plugins/prof/proficiency-advanced.test.js
