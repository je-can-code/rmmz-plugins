//region plugins/level/game-enemy-variable-balance.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { clearRpgManagerCacheInVm } from '../../setup/shipped-plugin-vm.js';
import { loadLevelPluginVm, resetLevelPluginSandbox } from './level-vm.js';

describe('J-LevelMaster Game_Enemy variable balancer (out/J-LevelMaster.js)', () =>
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

  it('adds the enemy balance variable to the note-derived base level', () =>
  {
    const base = new sandbox.Game_Enemy();
    base._enemyDb = {
      note: '<level:4>',
      actions: [],
    };
    base.initMembers();
    sandbox.Game_Enemy.prototype.setup.call(base, 1);

    expect(base.level).toBe(4);

    sandbox.$gameVariables.setValue(142, 3);
    clearRpgManagerCacheInVm(sandbox);

    const adjusted = new sandbox.Game_Enemy();
    adjusted._enemyDb = {
      note: '<level:4>',
      actions: [],
    };
    adjusted.initMembers();
    sandbox.Game_Enemy.prototype.setup.call(adjusted, 1);

    expect(adjusted.level).toBe(7);
  });
});
//endregion plugins/level/game-enemy-variable-balance.test.js
