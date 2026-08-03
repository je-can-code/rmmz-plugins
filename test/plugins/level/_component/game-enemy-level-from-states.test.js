//region plugins/level/_component/game-enemy-level-from-states.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installLevelHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJLevel,
} from './fixtures/install-level-host-globals.js';

describe('J-LevelMaster Game_Enemy getLevel from states (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installLevelHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/core/managers/RPGManager.js'));
    await import('../../../../src/plugins/_base/core/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/_base/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/_base/core/objects/Game_Enemy.js');

    setPluginContextToJLevel();
    await import('../../../../src/plugins/level/core/_metadata/initialization.js');

    await import('../../../../src/plugins/level/core/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/level/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/level/core/objects/Game_Enemy.js');
  });

  beforeEach(() =>
  {
    globalThis.$gameVariables._data = [];
    globalThis.RPGManager.clearCache();
  });

  it('adds level tags from applied states to the note base level', () =>
  {
    // Arrange
    const enemy = new globalThis.Game_Enemy();
    enemy._enemyDb = { note: '<level:4>', actions: [] };
    enemy.initMembers();
    globalThis.Game_Enemy.prototype.setup.call(enemy, 1);
    enemy.states = function()
    {
      return [ { id: 1, note: '<lvl:+3>' } ];
    };

    // Act
    enemy.refreshLevel();

    // Assert
    expect(enemy.level).toBe(7);
  });
});
//endregion plugins/level/_component/game-enemy-level-from-states.test.js
