//region plugins/prof/game-action-apply.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadProfPluginVm, resetProfPluginSandbox } from './prof-vm.js';

describe('J-Proficiency Game_Action.apply (out/prof/J-Proficiency.js)', () =>
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
      name: 'Strike',
      note: '',
      damage: { elementId: 0 },
    });
  });

  it('apply increases proficiency on skill actions when the hit connects', () =>
  {
    const { enemyData } = sandbox.__profTestFixtures;
    const actor = new sandbox.Game_Actor();
    actor.initMembers();
    actor.learnSkill(10);

    const enemy = new sandbox.Game_Enemy();
    enemy.initMembers();
    enemy.__enemyDb = enemyData({
      id: 1,
      name: 'Target',
      note: '',
      traits: [],
      actions: [],
    });
    enemy._actionResult = { isHit: () => true };

    const action = new sandbox.Game_Action();
    action._subject = actor;
    action.setSkill(10);

    action.apply(enemy);

    expect(actor.skillProficiencyBySkillId(10).proficiency).toBe(1);
  });

  it('apply skips proficiency when result is not a hit', () =>
  {
    const actor = new sandbox.Game_Actor();
    actor.initMembers();
    actor.learnSkill(10);
    actor.addSkillProficiency(10);

    const enemy = new sandbox.Game_Enemy();
    enemy.initMembers();
    enemy._actionResult = { isHit: () => false };

    const action = new sandbox.Game_Action();
    action._subject = actor;
    action.setSkill(10);

    action.apply(enemy);

    expect(actor.skillProficiencyBySkillId(10).proficiency).toBe(0);
  });

  it('apply skips proficiency when target blocks giving proficiency', () =>
  {
    const { enemyData } = sandbox.__profTestFixtures;
    const actor = new sandbox.Game_Actor();
    actor.initMembers();
    actor.learnSkill(10);

    const enemy = new sandbox.Game_Enemy();
    enemy.initMembers();
    enemy.__enemyDb = enemyData({
      id: 1,
      name: 'Blocker',
      note: '<proficiencyGivingBlock>',
      traits: [],
      actions: [],
    });
    enemy._actionResult = { isHit: () => true };

    const action = new sandbox.Game_Action();
    action._subject = actor;
    action.setSkill(10);

    action.apply(enemy);

    expect(actor.skillProficiencyBySkillId(10).proficiency).toBe(0);
  });
});
//endregion plugins/prof/game-action-apply.test.js
