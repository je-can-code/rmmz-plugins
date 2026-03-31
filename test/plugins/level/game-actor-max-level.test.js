//region plugins/level/game-actor-max-level.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadLevelPluginVm, resetLevelPluginSandbox } from './level-vm.js';

describe('J-LevelMaster Game_Actor max level (out/J-LevelMaster.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadLevelPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    resetLevelPluginSandbox(sandbox);
  });

  it('raises real max level from maxLevelBoost notes capped by plugin trueMaxLevel', () =>
  {
    const actor = new sandbox.Game_Actor();
    actor.__actorDb = {
      id: 1,
      name: '',
      note: '',
      classId: 1,
      maxLevel: 99,
      traits: [],
    };
    actor.__testNoteSources = [ { note: '<maxLevelBoost:+25>' } ];
    actor.initMembers();
    actor.onBattlerDataChange();

    expect(actor.getRealMaxLevel()).toBe(280);
  });
});
//endregion plugins/level/game-actor-max-level.test.js
