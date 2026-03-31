//region plugins/elem/game-action-element-advanced.test.js
import vm from 'node:vm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadElemPluginVm, resetElemPluginSandbox } from './elem-vm.js';

describe('J-Elementalistics multi-element, absorb, null, wild, and formula (out/J-Elementalistics.js)', () =>
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

  it('calcElementRate multiplies rates when multiple elements apply', () =>
  {
    const { skillData } = sandbox.__elemTestFixtures;
    sandbox.$dataSkills = [ null, skillData({
      id: 1,
      name: 'Multi',
      note: '<attackElements:[2]>',
      damage: { elementId: 1, type: 1, formula: '0' },
    }) ];

    const actor = new sandbox.Game_Actor();
    actor.initMembers();

    const target = new sandbox.Game_Enemy();
    target.initMembers();

    const action = new sandbox.Game_Action();
    action._subject = actor;
    action.setSkill(1);

    // force deterministic element rates for both elements.
    const original = target.elementRate;
    target.elementRate = function(elementId)
    {
      if (elementId === 1) return 2;
      if (elementId === 2) return 3;
      return original.call(this, elementId);
    };

    expect(action.calcElementRate(target)).toBe(6);
  });

  it('calcElementRate uses absorb aggregation when the target absorbs a matching element', () =>
  {
    const { skillData, enemyData } = sandbox.__elemTestFixtures;
    sandbox.$dataSkills = [ null, skillData({
      id: 1,
      name: 'FireHit',
      note: '',
      damage: { elementId: 1, type: 1, formula: '0' },
    }) ];

    const actor = new sandbox.Game_Actor();
    actor.initMembers();

    const target = new sandbox.Game_Enemy();
    target.initMembers();
    target.__enemyDb = enemyData({
      id: 1,
      name: 'SoaksFire',
      note: '<absorbElements:[1]>',
      traits: [],
      actions: [],
    });

    const action = new sandbox.Game_Action();
    action._subject = actor;
    action.setSkill(1);

    expect(action.calcElementRate(target)).toBe(-1);
  });

  it('absorb prioritizes absorbed elements and ignores non-absorbed elements', () =>
  {
    const { skillData, enemyData } = sandbox.__elemTestFixtures;
    sandbox.$dataSkills = [ null, skillData({
      id: 1,
      name: 'FireIce',
      note: '<attackElements:[2]>',
      damage: { elementId: 1, type: 1, formula: '0' },
    }) ];

    const actor = new sandbox.Game_Actor();
    actor.initMembers();

    const target = new sandbox.Game_Enemy();
    target.initMembers();
    target.__enemyDb = enemyData({
      id: 1,
      name: 'AbsorbsIceOnly',
      note: '<absorbElements:[2]>',
      traits: [],
      actions: [],
    });

    // if absorption is prioritized, element 1 should be ignored.
    const original = target.elementRate;
    target.elementRate = function(elementId)
    {
      if (elementId === 1) return 10;
      if (elementId === 2) return -1;
      return original.call(this, elementId);
    };

    const action = new sandbox.Game_Action();
    action._subject = actor;
    action.setSkill(1);

    expect(action.calcElementRate(target)).toBe(-1);
  });

  it('multiple absorbed elements multiply their rates together', () =>
  {
    const { skillData, enemyData } = sandbox.__elemTestFixtures;
    sandbox.$dataSkills = [ null, skillData({
      id: 1,
      name: 'TwinAbsorb',
      note: '<attackElements:[2]>',
      damage: { elementId: 1, type: 1, formula: '0' },
    }) ];

    const actor = new sandbox.Game_Actor();
    actor.initMembers();

    const target = new sandbox.Game_Enemy();
    target.initMembers();
    target.__enemyDb = enemyData({
      id: 1,
      name: 'AbsorbsBoth',
      note: '<absorbElements:[1,2]>',
      traits: [],
      actions: [],
    });

    const original = target.elementRate;
    target.elementRate = function(elementId)
    {
      if (elementId === 1) return -2;
      if (elementId === 2) return -3;
      return original.call(this, elementId);
    };

    const action = new sandbox.Game_Action();
    action._subject = actor;
    action.setSkill(1);

    expect(action.calcElementRate(target)).toBe(6);
  });

  it('multipleElementalRates returns zero when any boosted rate is null', () =>
  {
    const { skillData } = sandbox.__elemTestFixtures;
    sandbox.$dataSkills = [ null, skillData({
      id: 1,
      name: 'Twin',
      note: '<attackElements:[2]>',
      damage: { elementId: 1, type: 1, formula: '0' },
    }) ];

    vm.runInContext(`
      (function()
      {
        const saved = Game_Enemy.prototype.elementRate;
        Game_Enemy.prototype.elementRate = function(elementId)
        {
          if (elementId === 2)
          {
            return 0;
          }
          return saved.call(this, elementId);
        };
        globalThis.__elemRestoreEnemyElementRate = function()
        {
          Game_Enemy.prototype.elementRate = saved;
        };
      })();
    `, sandbox);

    const actor = new sandbox.Game_Actor();
    actor.initMembers();

    const target = new sandbox.Game_Enemy();
    target.initMembers();

    const action = new sandbox.Game_Action();
    action._subject = actor;
    action.setSkill(1);

    expect(action.calcElementRate(target)).toBe(0);

    vm.runInContext('globalThis.__elemRestoreEnemyElementRate();', sandbox);
  });

  it('getApplicableElements uses attackElements when skill damage elementId is -1', () =>
  {
    const { skillData } = sandbox.__elemTestFixtures;
    sandbox.$dataSkills = [ null, skillData({
      id: 1,
      name: 'Weapon',
      note: '',
      damage: { elementId: -1, type: 1, formula: '0' },
    }) ];

    const actor = new sandbox.Game_Actor();
    actor.initMembers();
    actor.attackElements = function()
    {
      return [ 2 ];
    };

    const target = new sandbox.Game_Enemy();
    target.initMembers();

    const action = new sandbox.Game_Action();
    action._subject = actor;
    action.setSkill(1);

    expect(action.getApplicableElements(target)).toEqual([ 2 ]);
  });

  it('evalDamageFormula evaluates the skill formula with v and sign for normal hits', () =>
  {
    const { skillData } = sandbox.__elemTestFixtures;
    sandbox.$dataSkills = [ null, skillData({
      id: 1,
      name: 'Strike',
      note: '',
      damage: { elementId: 0, type: 1, formula: '7 + 3' },
    }) ];

    const actor = new sandbox.Game_Actor();
    actor.initMembers();

    const target = new sandbox.Game_Enemy();
    target.initMembers();

    const action = new sandbox.Game_Action();
    action._subject = actor;
    action.setSkill(1);

    expect(action.evalDamageFormula(target)).toBe(10);
  });

  it('healingFactor flips sign for healing skills when the target does not absorb', () =>
  {
    const { skillData } = sandbox.__elemTestFixtures;
    sandbox.$dataSkills = [ null, skillData({
      id: 1,
      name: 'Heal',
      note: '',
      damage: { elementId: 0, type: 3, formula: '4' },
    }) ];

    const actor = new sandbox.Game_Actor();
    actor.initMembers();

    const target = new sandbox.Game_Enemy();
    target.initMembers();

    const action = new sandbox.Game_Action();
    action._subject = actor;
    action.setSkill(1);

    expect(action.evalDamageFormula(target)).toBe(-4);
  });

  it('evalDamageFormula skips Math.max clamp when the target absorbs the action elements', () =>
  {
    const { skillData, enemyData } = sandbox.__elemTestFixtures;
    sandbox.$dataSkills = [ null, skillData({
      id: 1,
      name: 'Drain',
      note: '',
      damage: { elementId: 1, type: 1, formula: '-3' },
    }) ];

    const actor = new sandbox.Game_Actor();
    actor.initMembers();

    const target = new sandbox.Game_Enemy();
    target.initMembers();
    target.__enemyDb = enemyData({
      id: 1,
      name: 'Absorber',
      note: '<absorbElements:[1]>',
      traits: [],
      actions: [],
    });

    const action = new sandbox.Game_Action();
    action._subject = actor;
    action.setSkill(1);

    expect(action.evalDamageFormula(target)).toBe(-3);
  });
});
//endregion plugins/elem/game-action-element-advanced.test.js
