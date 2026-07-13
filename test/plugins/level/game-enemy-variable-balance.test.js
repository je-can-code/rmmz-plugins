//region plugins/level/game-enemy-variable-balance.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installLevelHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJLevel,
} from './fixtures/install-level-host-globals.js';

describe('J-LevelMaster Game_Enemy variable balancer (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installLevelHostGlobals();

    setPluginContextToJBase();
    await import('../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../src/plugins/_base/managers/RPGManager.js'));
    await import('../../../src/plugins/_base/objects/Game_BattlerBase.js');
    await import('../../../src/plugins/_base/objects/Game_Battler.js');
    await import('../../../src/plugins/_base/objects/Game_Enemy.js');

    setPluginContextToJLevel();
    await import('../../../src/plugins/level/core/_metadata/initialization.js');

    await import('../../../src/plugins/level/core/objects/Game_BattlerBase.js');
    await import('../../../src/plugins/level/core/objects/Game_Battler.js');
    await import('../../../src/plugins/level/core/objects/Game_Enemy.js');
  });

  beforeEach(() =>
  {
    globalThis.$gameVariables._data = [];
    globalThis.RPGManager.clearCache();
  });

  it('uses only the note-derived level when the balance variable is unset', () =>
  {
    // Arrange
    const base = new globalThis.Game_Enemy();
    base._enemyDb = { note: '<level:4>', actions: [] };
    base.initMembers();

    // Act
    globalThis.Game_Enemy.prototype.setup.call(base, 1);

    // Assert
    expect(base.level).toBe(4);
  });

  it('adds the enemy balance variable to the note-derived base level', () =>
  {
    // Arrange
    globalThis.$gameVariables.setValue(142, 3);
    const adjusted = new globalThis.Game_Enemy();
    adjusted._enemyDb = { note: '<level:4>', actions: [] };
    adjusted.initMembers();

    // Act
    globalThis.Game_Enemy.prototype.setup.call(adjusted, 1);

    // Assert
    expect(adjusted.level).toBe(7);
  });
});
//endregion plugins/level/game-enemy-variable-balance.test.js
