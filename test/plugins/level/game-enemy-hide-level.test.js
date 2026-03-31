//region plugins/level/game-enemy-hide-level.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadLevelPluginVm, resetLevelPluginSandbox } from './level-vm.js';

describe('J-LevelMaster Game_Enemy.shouldHideLevel (out/J-LevelMaster.js)', () =>
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

  it('returns true when enemy note contains hideLevel tag', () =>
  {
    const enemy = new sandbox.Game_Enemy();
    enemy._enemyDb = {
      note: '<level:3>\n<hideLevel>',
      actions: [],
    };
    enemy.initMembers();
    sandbox.Game_Enemy.prototype.setup.call(enemy, 1);

    expect(enemy.shouldHideLevel()).toBe(true);
  });

  it('returns false when hideLevel tag is absent', () =>
  {
    const enemy = new sandbox.Game_Enemy();
    enemy._enemyDb = {
      note: '<level:3>',
      actions: [],
    };
    enemy.initMembers();
    sandbox.Game_Enemy.prototype.setup.call(enemy, 1);

    expect(enemy.shouldHideLevel()).toBe(false);
  });
});
//endregion plugins/level/game-enemy-hide-level.test.js
