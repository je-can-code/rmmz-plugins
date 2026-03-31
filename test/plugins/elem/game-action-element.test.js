//region plugins/elem/game-action-element.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadElemPluginVm, resetElemPluginSandbox } from './elem-vm.js';

describe('J-Elementalistics Game_Action element math (out/J-Elementalistics.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadElemPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    resetElemPluginSandbox(sandbox);
  });

  it('extractElementsFromAction reads attackElements note tags', () =>
  {
    const { skillData } = sandbox.__elemTestFixtures;
    const skill = skillData({
      id: 1,
      name: 'Dual',
      note: '<attackElements:[2]>',
      damage: { elementId: 1, type: 1, formula: '0' },
    });
    expect(sandbox.Game_Action.extractElementsFromAction(skill)).toEqual([ 2 ]);
  });

  it('getApplicableElements respects target strict element list', () =>
  {
    const { skillData, enemyData } = sandbox.__elemTestFixtures;
    sandbox.$dataSkills = [ null, skillData({
      id: 1,
      name: 'Wide',
      note: '<attackElements:[3]>',
      damage: { elementId: 2, type: 1, formula: '0' },
    }) ];

    const actor = new sandbox.Game_Actor();
    actor.initMembers();

    const target = new sandbox.Game_Enemy();
    target.initMembers();
    target.__enemyDb = enemyData({
      id: 1,
      name: 'IceOnly',
      note: '<strictElements:[2]>',
      traits: [],
      actions: [],
    });

    const action = new sandbox.Game_Action();
    action._subject = actor;
    action.setSkill(1);

    expect(action.getApplicableElements(target)).toEqual([ 2 ]);
  });

  it('calcElementRate yields zero when strict filtering removes all elements', () =>
  {
    const { skillData, enemyData } = sandbox.__elemTestFixtures;
    sandbox.$dataSkills = [ null, skillData({
      id: 1,
      name: 'FireOnly',
      note: '',
      damage: { elementId: 1, type: 1, formula: '0' },
    }) ];

    const actor = new sandbox.Game_Actor();
    actor.initMembers();

    const target = new sandbox.Game_Enemy();
    target.initMembers();
    target.__enemyDb = enemyData({
      id: 1,
      name: 'IceOnly',
      note: '<strictElements:[2]>',
      traits: [],
      actions: [],
    });

    const action = new sandbox.Game_Action();
    action._subject = actor;
    action.setSkill(1);

    expect(action.calcElementRate(target)).toBe(0);
  });

  it('calcElementRate applies attacker elementRateBoost from boostElement tags', () =>
  {
    const { skillData, actorData } = sandbox.__elemTestFixtures;
    sandbox.$dataSkills = [ null, skillData({
      id: 1,
      name: 'Hit',
      note: '',
      damage: { elementId: 2, type: 1, formula: '0' },
    }) ];

    const actor = new sandbox.Game_Actor();
    actor.initMembers();
    actor.__actorDb = actorData({
      id: 1,
      name: '',
      note: '<boostElement:2:50>',
      classId: 1,
      traits: [],
    });

    const target = new sandbox.Game_Enemy();
    target.initMembers();

    const action = new sandbox.Game_Action();
    action._subject = actor;
    action.setSkill(1);

    expect(action.calcElementRate(target)).toBe(1.5);
  });
});
//endregion plugins/elem/game-action-element.test.js
