//region plugins/prof/_component/proficiency-actor.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  actorData,
  initializeProficiencies,
  installProfHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJProf,
  skillData,
} from './fixtures/install-prof-host-globals.js';

describe('J-Proficiency Game_Actor proficiency (direct src import)', () =>
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
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
    globalThis.$dataSkills = [ null ];
    globalThis.$dataSkills[10] = skillData({
      id: 10, name: 'Track', note: '', damage: { elementId: 0 },
    });
    globalThis.$dataSkills[99] = skillData({
      id: 99, name: 'Reward', note: '', damage: { elementId: 0 },
    });
  });

  function makeActor()
  {
    const actor = new globalThis.Game_Actor();
    actor.initMembers();
    actor.learnSkill(10);
    return actor;
  }

  it('increaseSkillProficiency accumulates and unlocks conditional skill rewards', () =>
  {
    // Arrange
    const actor = makeActor();

    // Act
    actor.increaseSkillProficiency(10, 1);
    actor.increaseSkillProficiency(10, 1);

    // Assert
    expect(actor.skillProficiencyBySkillId(10).proficiency).toBe(2);

    actor.increaseSkillProficiency(10, 1);
    expect(actor.skillProficiencyBySkillId(10).proficiency).toBe(3);
    expect(actor.isConditionalUnlocked('vitest_unlock_skill')).toBe(true);
    expect(actor.isLearnedSkill(99)).toBe(true);
  });

  it('canGainProficiency is false when proficiencyGainingBlock is present on actor notes', () =>
  {
    // Arrange
    const actor = makeActor();
    const blocked = {
      id: 1, name: '', note: '<proficiencyGainingBlock>', classId: 1, traits: [],
    };
    actor.actor = function()
    {
      return blocked;
    };

    // Act
    actor.onBattlerDataChange();

    // Assert
    expect(actor.canGainProficiency()).toBe(false);
  });

  it('updateBonusSkillProficiencyGains reads proficiencyBonus from actor notes', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor.__actorDb = actorData({
      id: 1, name: '', note: '<proficiencyBonus:3>', classId: 1, traits: [],
    });
    actor.initMembers();

    // Act
    actor.updateBonusSkillProficiencyGains();

    // Assert
    expect(actor.prof).toBe(3);
  });
});
//endregion plugins/prof/_component/proficiency-actor.test.js
