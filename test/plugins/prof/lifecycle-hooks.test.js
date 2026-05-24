//region plugins/prof/lifecycle-hooks.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadProfPluginVm, resetProfPluginSandbox } from './prof-vm.js';

describe('J-Proficiency lifecycle hooks (out/prof/J-Proficiency.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadProfPluginVm(sandbox);

    // isolate these extension points from host behavior.
    sandbox.J.PROF.Aliased.Game_Actor.set('onLearnNewSkill', function()
    {
    });
    sandbox.J.PROF.Aliased.Game_Actor.set('onBattlerDataChange', function()
    {
    });
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    resetProfPluginSandbox(sandbox);
  });

  it('onLearnNewSkill creates a new skill proficiency record', () =>
  {
    const actor = new sandbox.Game_Actor();
    actor.initMembers();

    expect(actor.skillProficiencyBySkillId(10)).toBeUndefined();
    actor.onLearnNewSkill(10);
    expect(actor.skillProficiencyBySkillId(10)).toBeDefined();
  });

  it('onBattlerDataChange refreshes bonus skill proficiency gains', () =>
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

    expect(actor.bonusSkillProficiencyGains()).toBe(0);
    actor.onBattlerDataChange();
    expect(actor.bonusSkillProficiencyGains()).toBe(3);
  });
});
//endregion plugins/prof/lifecycle-hooks.test.js

