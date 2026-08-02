//region plugins/level/_component/game-enemy-hide-level.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installLevelHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJLevel,
} from './fixtures/install-level-host-globals.js';

describe('J-LevelMaster Game_Enemy.shouldHideLevel (direct src import)', () =>
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

  it('returns true when the enemy note carries the hideLevel tag', () =>
  {
    // Arrange
    const enemy = new globalThis.Game_Enemy();
    enemy._enemyDb = { note: '<level:3>\n<hideLevel>', actions: [] };
    enemy.initMembers();
    globalThis.Game_Enemy.prototype.setup.call(enemy, 1);

    // Act
    const result = enemy.shouldHideLevel();

    // Assert
    expect(result).toBe(true);
  });

  it('returns false when the hideLevel tag is absent', () =>
  {
    // Arrange
    const enemy = new globalThis.Game_Enemy();
    enemy._enemyDb = { note: '<level:3>', actions: [] };
    enemy.initMembers();
    globalThis.Game_Enemy.prototype.setup.call(enemy, 1);

    // Act
    const result = enemy.shouldHideLevel();

    // Assert
    expect(result).toBe(false);
  });
});
//endregion plugins/level/_component/game-enemy-hide-level.test.js
