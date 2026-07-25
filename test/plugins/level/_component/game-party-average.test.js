//region plugins/level/_component/game-party-average.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installLevelHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJLevel,
} from './fixtures/install-level-host-globals.js';

describe('J-LevelMaster Game_Party.averageActorLevel (direct src import)', () =>
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
    await import('../../../../src/plugins/_base/objects/Game_Actor.js');

    setPluginContextToJLevel();
    await import('../../../../src/plugins/level/core/_metadata/initialization.js');

    await import('../../../../src/plugins/level/core/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/level/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/level/core/objects/Game_Actor.js');
    await import('../../../../src/plugins/level/core/objects/Game_Party.js');
  });

  it('averages battle member levels with rounding', () =>
  {
    // Arrange
    const a = new globalThis.Game_Actor();
    a.initMembers();
    a._level = 11;
    const b = new globalThis.Game_Actor();
    b.initMembers();
    b._level = 12;
    const party = new globalThis.Game_Party();
    party.battleMembers = function()
    {
      return [ a, b ];
    };

    // Act
    const result = party.averageActorLevel();

    // Assert
    expect(result).toBe(12);
  });
});
//endregion plugins/level/_component/game-party-average.test.js
