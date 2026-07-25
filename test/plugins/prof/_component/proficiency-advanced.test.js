//region plugins/prof/_component/proficiency-advanced.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  initializeProficiencies,
  installProfHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJProf,
  skillData,
} from './fixtures/install-prof-host-globals.js';

describe('J-Proficiency advanced conditionals (direct src import)', () =>
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
    [ 20, 21, 30, 31, 40, 50, 88, 98 ].forEach(id =>
    {
      globalThis.$dataSkills[id] = skillData({
        id, name: `S${id}`, note: '', damage: { elementId: 0 },
      });
    });
  });

  function makeActor(actorNumericId)
  {
    const actor = new globalThis.Game_Actor();
    actor.actorId = function()
    {
      return actorNumericId;
    };
    actor.initMembers();
    return actor;
  }

  it('sums primary and secondary skill proficiency for a single requirement', () =>
  {
    // Arrange
    const actor = makeActor(2);
    actor.learnSkill(20);
    actor.learnSkill(21);
    actor.increaseSkillProficiency(20, 2);
    actor.increaseSkillProficiency(21, 2);

    // Act & Assert
    expect(actor.isConditionalUnlocked('vitest_secondary_total')).toBe(false);

    actor.increaseSkillProficiency(21, 1);
    expect(actor.isConditionalUnlocked('vitest_secondary_total')).toBe(true);
    expect(actor.isLearnedSkill(88)).toBe(true);
  });

  it('requires every requirement to be met before unlocking', () =>
  {
    // Arrange
    const actor = makeActor(3);
    actor.learnSkill(30);
    actor.learnSkill(31);
    actor.increaseSkillProficiency(30, 2);

    // Act & Assert
    expect(actor.isConditionalUnlocked('vitest_two_requirements')).toBe(false);

    actor.increaseSkillProficiency(31, 2);
    expect(actor.isConditionalUnlocked('vitest_two_requirements')).toBe(true);
    expect(actor.isLearnedSkill(98)).toBe(true);
  });

  it('executes jsRewards when a conditional unlocks', () =>
  {
    // Arrange
    const actor = makeActor(4);
    actor.learnSkill(40);

    // Act
    actor.increaseSkillProficiency(40, 1);

    // Assert
    expect(actor._vitestJsReward).toBe(42);
  });

  it('surfaces jsRewards errors without aborting the unlock', () =>
  {
    // Arrange
    const actor = makeActor(5);
    actor.learnSkill(50);
    const errorSpy = vi.spyOn(console, 'error');

    // Act
    actor.increaseSkillProficiency(50, 1);

    // Assert
    expect(actor.isConditionalUnlocked('vitest_js_fail')).toBe(true);
    expect(errorSpy.mock.calls.length).toBeGreaterThan(0);
    errorSpy.mockRestore();
  });
});
//endregion plugins/prof/_component/proficiency-advanced.test.js
