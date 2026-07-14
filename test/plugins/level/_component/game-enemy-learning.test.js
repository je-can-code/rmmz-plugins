//region plugins/level/_component/game-enemy-learning.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installLevelHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJLevel,
} from './fixtures/install-level-host-globals.js';

describe('J-LevelMaster Game_Enemy level and learning gates (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installLevelHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/managers/RPGManager.js'));
    await import('../../../../src/plugins/_base/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/_base/objects/Game_Battler.js');
    await import('../../../../src/plugins/_base/objects/Game_Enemy.js');

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

  it('parses the note level and blocks the skill before the learning level is reached', () =>
  {
    // Arrange
    const low = new globalThis.Game_Enemy();
    low._enemyDb = { note: '<level:5>\n<learning:[99, 10]>', actions: [] };
    low.initMembers();
    globalThis.Game_Enemy.prototype.setup.call(low, 1);

    // Act
    const canUse = low.canMapActionToSkill({ skillId: 99 });

    // Assert
    expect(low.level).toBe(5);
    expect(canUse).toBe(false);
  });

  it('unlocks the skill once the learning level is reached', () =>
  {
    // Arrange
    const high = new globalThis.Game_Enemy();
    high._enemyDb = { note: '<level:12>\n<learning:[99, 10]>', actions: [] };
    high.initMembers();
    globalThis.Game_Enemy.prototype.setup.call(high, 1);

    // Act
    const canUse = high.canMapActionToSkill({ skillId: 99 });

    // Assert
    expect(high.level).toBe(12);
    expect(canUse).toBe(true);
  });
});
//endregion plugins/level/_component/game-enemy-learning.test.js
