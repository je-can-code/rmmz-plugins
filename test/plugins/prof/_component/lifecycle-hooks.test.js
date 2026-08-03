//region plugins/prof/_component/lifecycle-hooks.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  actorData,
  initializeProficiencies,
  installProfHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJProf,
} from './fixtures/install-prof-host-globals.js';

describe('J-Proficiency lifecycle hooks (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installProfHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/core/managers/RPGManager.js'));

    await import('../../../../src/plugins/_base/core/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/_base/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/_base/core/objects/Game_Action.js');
    await import('../../../../src/plugins/_base/core/objects/Game_Actor.js');

    setPluginContextToJProf();
    await import('../../../../src/plugins/prof/core/_metadata/initialization.js');

    globalThis.$dataActors = [];
    initializeProficiencies();

    await import('../../../../src/plugins/prof/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/prof/core/objects/Game_Actor.js');

    // isolate these extension points from host behavior (real _base onLearnNewSkill/onBattlerDataChange).
    globalThis.J.PROF.Aliased.Game_Actor.set('onLearnNewSkill', () => {});
    globalThis.J.PROF.Aliased.Game_Actor.set('onBattlerDataChange', () => {});
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
  });

  it('onLearnNewSkill creates a new skill proficiency record', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor.initMembers();

    // Act & Assert
    expect(actor.skillProficiencyBySkillId(10)).toBeUndefined();

    actor.onLearnNewSkill(10);
    expect(actor.skillProficiencyBySkillId(10)).toBeDefined();
  });

  it('onBattlerDataChange refreshes bonus skill proficiency gains', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor.__actorDb = actorData({
      id: 1, name: '', note: '<proficiencyBonus:3>', classId: 1, traits: [],
    });
    actor.initMembers();

    // Act & Assert
    expect(actor.prof).toBe(0);

    actor.onBattlerDataChange();
    expect(actor.prof).toBe(3);
  });
});
//endregion plugins/prof/_component/lifecycle-hooks.test.js
