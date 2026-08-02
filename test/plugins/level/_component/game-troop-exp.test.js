//region plugins/level/_component/game-troop-exp.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installLevelHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJLevel,
} from './fixtures/install-level-host-globals.js';

describe('J-LevelMaster Game_Troop experience scaling (direct src import)', () =>
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
    await import('../../../../src/plugins/_base/core/objects/Game_Actor.js');

    setPluginContextToJLevel();
    await import('../../../../src/plugins/level/core/_metadata/initialization.js');

    await import('../../../../src/plugins/level/core/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/level/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/level/core/objects/Game_Actor.js');
    await import('../../../../src/plugins/level/core/objects/Game_Party.js');
    await import('../../../../src/plugins/level/core/objects/Game_System.js');
    await import('../../../../src/plugins/level/core/objects/Game_Troop.js');
  });

  it('scales total exp from dead enemies using party average level vs each enemy level', () =>
  {
    // Arrange
    globalThis.$gameSystem = new globalThis.Game_System();
    globalThis.$gameSystem.initialize();
    const a = new globalThis.Game_Actor();
    a.initMembers();
    a._level = 14;
    const b = new globalThis.Game_Actor();
    b.initMembers();
    b._level = 16;
    globalThis.$gameParty = new globalThis.Game_Party();
    globalThis.$gameParty.battleMembers = function()
    {
      return [ a, b ];
    };
    const enemy = { level: 5, exp: () => 100 };
    const troop = Object.create(globalThis.Game_Troop.prototype);
    troop.deadMembers = function()
    {
      return [ enemy ];
    };

    // Act
    const total = globalThis.Game_Troop.prototype.getScaledExpResult.call(troop);

    // Assert
    expect(total).toBe(190);
  });
});
//endregion plugins/level/_component/game-troop-exp.test.js
