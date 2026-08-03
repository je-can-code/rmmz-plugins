//region plugins/elem/_component/game-action-element.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  actorData,
  enemyData,
  installElemHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJElem,
  skillData,
} from './fixtures/install-elem-host-globals.js';

describe('J-Elementalistics Game_Action element math (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installElemHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/core/managers/RPGManager.js'));

    // getAllNotes()/getNotesSources()/allStates()/states() live here; elem's own object files call them.
    await import('../../../../src/plugins/_base/core/objects/Game_Battler.js');

    // evalFormulaWithContext() lives here; elem's own Game_Action.js's evalDamageFormula() calls it.
    await import('../../../../src/plugins/_base/core/objects/Game_Action.js');

    setPluginContextToJElem();
    await import('../../../../src/plugins/elem/core/_metadata/initialization.js');

    // patches globalThis.Game_Battler/Game_Enemy/Game_Actor/Game_Action prototypes directly, no vm involved.
    await import('../../../../src/plugins/elem/core/objects/Game_Battler.js');

    // load order mirrors the plugin entry point: actor before enemy.
    await import('../../../../src/plugins/elem/core/objects/Game_Actor.js');
    await import('../../../../src/plugins/elem/core/objects/Game_Enemy.js');
    await import('../../../../src/plugins/elem/core/objects/Game_Action.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
  });

  it('extractElementsFromAction reads attackElements note tags', () =>
  {
    // Arrange
    const skill = skillData({
      id: 1,
      name: 'Dual',
      note: '<attackElements:[2]>',
      damage: { elementId: 1, type: 1, formula: '0' },
    });

    // Act
    const result = globalThis.Game_Action.extractElementsFromAction(skill);

    // Assert
    expect(result).toEqual([ 2 ]);
  });

  it('getApplicableElements respects target strict element list', () =>
  {
    // Arrange
    globalThis.$dataSkills = [ null, skillData({
      id: 1,
      name: 'Wide',
      note: '<attackElements:[3]>',
      damage: { elementId: 2, type: 1, formula: '0' },
    }) ];
    const actor = new globalThis.Game_Actor();
    actor.initMembers();
    const target = new globalThis.Game_Enemy();
    target.initMembers();
    target.__enemyDb = enemyData({
      id: 1, name: 'IceOnly', note: '<strictElements:[2]>', traits: [], actions: [],
    });
    const action = new globalThis.Game_Action();
    action._subject = actor;
    action.setSkill(1);

    // Act
    const result = action.getApplicableElements(target);

    // Assert
    expect(result).toEqual([ 2 ]);
  });

  it('calcElementRate yields zero when strict filtering removes all elements', () =>
  {
    // Arrange
    globalThis.$dataSkills = [ null, skillData({
      id: 1, name: 'FireOnly', note: '', damage: { elementId: 1, type: 1, formula: '0' },
    }) ];
    const actor = new globalThis.Game_Actor();
    actor.initMembers();
    const target = new globalThis.Game_Enemy();
    target.initMembers();
    target.__enemyDb = enemyData({
      id: 1, name: 'IceOnly', note: '<strictElements:[2]>', traits: [], actions: [],
    });
    const action = new globalThis.Game_Action();
    action._subject = actor;
    action.setSkill(1);

    // Act
    const result = action.calcElementRate(target);

    // Assert
    expect(result).toBe(0);
  });

  it('calcElementRate applies attacker elementRateBoost from boostElement tags', () =>
  {
    // Arrange
    globalThis.$dataSkills = [ null, skillData({
      id: 1, name: 'Hit', note: '', damage: { elementId: 2, type: 1, formula: '0' },
    }) ];
    const actor = new globalThis.Game_Actor();
    actor.initMembers();
    actor.__actorDb = actorData({
      id: 1, name: '', note: '<boostElement:[2, 50]>', classId: 1, traits: [],
    });
    const target = new globalThis.Game_Enemy();
    target.initMembers();
    const action = new globalThis.Game_Action();
    action._subject = actor;
    action.setSkill(1);

    // Act
    const result = action.calcElementRate(target);

    // Assert
    expect(result).toBe(1.5);
  });
});
//endregion plugins/elem/_component/game-action-element.test.js
