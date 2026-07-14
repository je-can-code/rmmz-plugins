//region plugins/prof/_component/game-action-apply.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  enemyData,
  initializeProficiencies,
  installProfHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJProf,
  skillData,
} from './fixtures/install-prof-host-globals.js';

describe('J-Proficiency Game_Action.apply (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installProfHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/managers/RPGManager.js'));

    await import('../../../../src/plugins/_base/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/_base/objects/Game_Battler.js');
    await import('../../../../src/plugins/_base/objects/Game_Action.js');
    await import('../../../../src/plugins/_base/objects/Game_Actor.js');

    setPluginContextToJProf();
    await import('../../../../src/plugins/prof/core/_metadata/initialization.js');

    globalThis.$dataActors = [];
    initializeProficiencies();

    await import('../../../../src/plugins/prof/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/prof/core/objects/Game_Actor.js');
    await import('../../../../src/plugins/prof/core/objects/Game_Enemy.js');
    await import('../../../../src/plugins/prof/core/objects/Game_Action.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
    globalThis.$dataSkills = [ null ];
    globalThis.$dataSkills[10] = skillData({
      id: 10, name: 'Strike', note: '', damage: { elementId: 0 },
    });
  });

  it('apply increases proficiency on skill actions when the hit connects', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor.initMembers();
    actor.learnSkill(10);
    const enemy = new globalThis.Game_Enemy();
    enemy.initMembers();
    enemy.__enemyDb = enemyData({
      id: 1, name: 'Target', note: '', traits: [], actions: [],
    });
    enemy._actionResult = { isHit: () => true };
    const action = new globalThis.Game_Action();
    action._subject = actor;
    action.setSkill(10);

    // Act
    action.apply(enemy);

    // Assert
    expect(actor.skillProficiencyBySkillId(10).proficiency).toBe(1);
  });

  it('apply skips proficiency when result is not a hit', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor.initMembers();
    actor.learnSkill(10);
    actor.addSkillProficiency(10);
    const enemy = new globalThis.Game_Enemy();
    enemy.initMembers();
    enemy._actionResult = { isHit: () => false };
    const action = new globalThis.Game_Action();
    action._subject = actor;
    action.setSkill(10);

    // Act
    action.apply(enemy);

    // Assert
    expect(actor.skillProficiencyBySkillId(10).proficiency).toBe(0);
  });

  it('apply skips proficiency when target blocks giving proficiency', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor.initMembers();
    actor.learnSkill(10);
    const enemy = new globalThis.Game_Enemy();
    enemy.initMembers();
    enemy.__enemyDb = enemyData({
      id: 1, name: 'Blocker', note: '<proficiencyGivingBlock>', traits: [], actions: [],
    });
    enemy._actionResult = { isHit: () => true };
    const action = new globalThis.Game_Action();
    action._subject = actor;
    action.setSkill(10);

    // Act
    action.apply(enemy);

    // Assert
    expect(actor.skillProficiencyBySkillId(10).proficiency).toBe(0);
  });
});
//endregion plugins/prof/_component/game-action-apply.test.js
