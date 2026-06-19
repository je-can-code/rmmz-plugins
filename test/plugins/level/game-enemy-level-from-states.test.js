//region plugins/level/game-enemy-level-from-states.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadLevelPluginVm, resetLevelPluginSandbox } from './level-vm.js';

describe('J-LevelMaster Game_Enemy getLevel from states (out/J-LevelMaster.js)', () =>
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

  it('adds level tags from applied states to the note base level', () =>
  {
    const enemy = new sandbox.Game_Enemy();
    enemy._enemyDb = {
      note: '<level:4>',
      actions: [],
    };
    enemy.initMembers();
    sandbox.Game_Enemy.prototype.setup.call(enemy, 1);
    enemy.states = function()
    {
      return [ { id: 1, note: '<lvl:+3>' } ];
    };
    enemy.refreshLevel();

    expect(enemy.level).toBe(7);
  });
});
//endregion plugins/level/game-enemy-level-from-states.test.js
