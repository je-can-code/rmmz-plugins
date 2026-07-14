//region plugins/elem/game-action-element-advanced.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  enemyData,
  installElemHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJElem,
  skillData,
} from './fixtures/install-elem-host-globals.js';

describe('J-Elementalistics multi-element, absorb, null, wild, and formula (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installElemHostGlobals();

    setPluginContextToJBase();
    await import('../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../src/plugins/_base/managers/RPGManager.js'));

    await import('../../../src/plugins/_base/objects/Game_Battler.js');
    await import('../../../src/plugins/_base/objects/Game_Action.js');

    setPluginContextToJElem();
    await import('../../../src/plugins/elem/core/_metadata/initialization.js');

    await import('../../../src/plugins/elem/core/objects/Game_Battler.js');
    await import('../../../src/plugins/elem/core/objects/Game_Enemy.js');
    await import('../../../src/plugins/elem/core/objects/Game_Actor.js');
    await import('../../../src/plugins/elem/core/objects/Game_Action.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
  });

  it('calcElementRate multiplies rates when multiple elements apply', () =>
  {
    // Arrange
    globalThis.$dataSkills = [ null, skillData({
      id: 1, name: 'Multi', note: '<attackElements:[2]>', damage: { elementId: 1, type: 1, formula: '0' },
    }) ];
    const actor = new globalThis.Game_Actor();
    actor.initMembers();
    const target = new globalThis.Game_Enemy();
    target.initMembers();
    const original = target.elementRate;
    target.elementRate = function(elementId)
    {
      if (elementId === 1) return 2;
      if (elementId === 2) return 3;
      return original.call(this, elementId);
    };
    const action = new globalThis.Game_Action();
    action._subject = actor;
    action.setSkill(1);

    // Act
    const result = action.calcElementRate(target);

    // Assert
    expect(result).toBe(6);
  });

  it('calcElementRate uses absorb aggregation when the target absorbs a matching element', () =>
  {
    // Arrange
    globalThis.$dataSkills = [ null, skillData({
      id: 1, name: 'FireHit', note: '', damage: { elementId: 1, type: 1, formula: '0' },
    }) ];
    const actor = new globalThis.Game_Actor();
    actor.initMembers();
    const target = new globalThis.Game_Enemy();
    target.initMembers();
    target.__enemyDb = enemyData({
      id: 1, name: 'SoaksFire', note: '<absorbElements:[1]>', traits: [], actions: [],
    });
    const action = new globalThis.Game_Action();
    action._subject = actor;
    action.setSkill(1);

    // Act
    const result = action.calcElementRate(target);

    // Assert
    expect(result).toBe(-1);
  });

  it('absorb prioritizes absorbed elements and ignores non-absorbed elements', () =>
  {
    // Arrange
    globalThis.$dataSkills = [ null, skillData({
      id: 1, name: 'FireIce', note: '<attackElements:[2]>', damage: { elementId: 1, type: 1, formula: '0' },
    }) ];
    const actor = new globalThis.Game_Actor();
    actor.initMembers();
    const target = new globalThis.Game_Enemy();
    target.initMembers();
    target.__enemyDb = enemyData({
      id: 1, name: 'AbsorbsIceOnly', note: '<absorbElements:[2]>', traits: [], actions: [],
    });
    const original = target.elementRate;
    target.elementRate = function(elementId)
    {
      if (elementId === 1) return 10;
      if (elementId === 2) return -1;
      return original.call(this, elementId);
    };
    const action = new globalThis.Game_Action();
    action._subject = actor;
    action.setSkill(1);

    // Act
    const result = action.calcElementRate(target);

    // Assert
    expect(result).toBe(-1);
  });

  it('multiple absorbed elements multiply their rates together', () =>
  {
    // Arrange
    globalThis.$dataSkills = [ null, skillData({
      id: 1, name: 'TwinAbsorb', note: '<attackElements:[2]>', damage: { elementId: 1, type: 1, formula: '0' },
    }) ];
    const actor = new globalThis.Game_Actor();
    actor.initMembers();
    const target = new globalThis.Game_Enemy();
    target.initMembers();
    target.__enemyDb = enemyData({
      id: 1, name: 'AbsorbsBoth', note: '<absorbElements:[1,2]>', traits: [], actions: [],
    });
    const original = target.elementRate;
    target.elementRate = function(elementId)
    {
      if (elementId === 1) return -2;
      if (elementId === 2) return -3;
      return original.call(this, elementId);
    };
    const action = new globalThis.Game_Action();
    action._subject = actor;
    action.setSkill(1);

    // Act
    const result = action.calcElementRate(target);

    // Assert
    expect(result).toBe(6);
  });

  it('multipleElementalRates returns zero when any boosted rate is null', () =>
  {
    // Arrange
    globalThis.$dataSkills = [ null, skillData({
      id: 1, name: 'Twin', note: '<attackElements:[2]>', damage: { elementId: 1, type: 1, formula: '0' },
    }) ];
    const saved = globalThis.Game_Enemy.prototype.elementRate;
    globalThis.Game_Enemy.prototype.elementRate = function(elementId)
    {
      if (elementId === 2) return 0;
      return saved.call(this, elementId);
    };
    const actor = new globalThis.Game_Actor();
    actor.initMembers();
    const target = new globalThis.Game_Enemy();
    target.initMembers();
    const action = new globalThis.Game_Action();
    action._subject = actor;
    action.setSkill(1);

    // Act
    const result = action.calcElementRate(target);

    // Assert
    expect(result).toBe(0);
    globalThis.Game_Enemy.prototype.elementRate = saved;
  });

  it('getApplicableElements uses attackElements when skill damage elementId is -1', () =>
  {
    // Arrange
    globalThis.$dataSkills = [ null, skillData({
      id: 1, name: 'Weapon', note: '', damage: { elementId: -1, type: 1, formula: '0' },
    }) ];
    const actor = new globalThis.Game_Actor();
    actor.initMembers();
    actor.attackElements = function()
    {
      return [ 2 ];
    };
    const target = new globalThis.Game_Enemy();
    target.initMembers();
    const action = new globalThis.Game_Action();
    action._subject = actor;
    action.setSkill(1);

    // Act
    const result = action.getApplicableElements(target);

    // Assert
    expect(result).toEqual([ 2 ]);
  });

  it('evalDamageFormula evaluates the skill formula with v and sign for normal hits', () =>
  {
    // Arrange
    globalThis.$dataSkills = [ null, skillData({
      id: 1, name: 'Strike', note: '', damage: { elementId: 0, type: 1, formula: '7 + 3' },
    }) ];
    const actor = new globalThis.Game_Actor();
    actor.initMembers();
    const target = new globalThis.Game_Enemy();
    target.initMembers();
    const action = new globalThis.Game_Action();
    action._subject = actor;
    action.setSkill(1);

    // Act
    const result = action.evalDamageFormula(target);

    // Assert
    expect(result).toBe(10);
  });

  it('healingFactor flips sign for healing skills when the target does not absorb', () =>
  {
    // Arrange
    globalThis.$dataSkills = [ null, skillData({
      id: 1, name: 'Heal', note: '', damage: { elementId: 0, type: 3, formula: '4' },
    }) ];
    const actor = new globalThis.Game_Actor();
    actor.initMembers();
    const target = new globalThis.Game_Enemy();
    target.initMembers();
    const action = new globalThis.Game_Action();
    action._subject = actor;
    action.setSkill(1);

    // Act
    const result = action.evalDamageFormula(target);

    // Assert
    expect(result).toBe(-4);
  });

  it('evalDamageFormula skips Math.max clamp when the target absorbs the action elements', () =>
  {
    // Arrange
    globalThis.$dataSkills = [ null, skillData({
      id: 1, name: 'Drain', note: '', damage: { elementId: 1, type: 1, formula: '-3' },
    }) ];
    const actor = new globalThis.Game_Actor();
    actor.initMembers();
    const target = new globalThis.Game_Enemy();
    target.initMembers();
    target.__enemyDb = enemyData({
      id: 1, name: 'Absorber', note: '<absorbElements:[1]>', traits: [], actions: [],
    });
    const action = new globalThis.Game_Action();
    action._subject = actor;
    action.setSkill(1);

    // Act
    const result = action.evalDamageFormula(target);

    // Assert
    expect(result).toBe(-3);
  });
});
//endregion plugins/elem/game-action-element-advanced.test.js
