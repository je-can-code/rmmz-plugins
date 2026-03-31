//region plugins/level/game-enemy-learning.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadLevelPluginVm, resetLevelPluginSandbox } from './level-vm.js';

describe('J-LevelMaster Game_Enemy level and learning gates (out/J-LevelMaster.js)', () =>
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

  it('parses note level and blocks skills until the learning level is reached', () =>
  {
    const low = new sandbox.Game_Enemy();
    low._enemyDb = {
      note: '<level:5>\n<learning:[99, 10]>',
      actions: [],
    };
    low.initMembers();
    sandbox.Game_Enemy.prototype.setup.call(low, 1);

    expect(low.level).toBe(5);
    expect(low.canMapActionToSkill({ skillId: 99 })).toBe(false);

    resetLevelPluginSandbox(sandbox);

    const high = new sandbox.Game_Enemy();
    high._enemyDb = {
      note: '<level:12>\n<learning:[99, 10]>',
      actions: [],
    };
    high.initMembers();
    sandbox.Game_Enemy.prototype.setup.call(high, 1);

    expect(high.level).toBe(12);
    expect(high.canMapActionToSkill({ skillId: 99 })).toBe(true);
  });
});
//endregion plugins/level/game-enemy-learning.test.js
