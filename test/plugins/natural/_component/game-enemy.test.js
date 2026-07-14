//region plugins/natural/_component/game-enemy.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installNaturalHostGlobals, setPluginContextToJBase, setPluginContextToJNatural } from './fixtures/install-natural-host-globals.js';

describe('J-NaturalGrowth Game_Enemy (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installNaturalHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/managers/RPGManager.js'));

    await import('../../../../src/plugins/_base/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/_base/objects/Game_Battler.js');
    await import('../../../../src/plugins/_base/objects/Game_Actor.js');

    setPluginContextToJNatural();
    await import('../../../../src/plugins/natural/core/_metadata/initialization.js');

    await import('../../../../src/plugins/natural/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/natural/core/objects/Game_Enemy.js');
  });

  it('setup refreshes reward bonuses from notes; exp, gold, and sdpPoints include bonuses', () =>
  {
    // Arrange
    globalThis.J.SDP = {};
    const enemy = new globalThis.Game_Enemy();
    enemy._enemyDb = {
      exp: 100, gold: 50, sdpPoints: 2, actions: [],
    };
    enemy.__testNoteSources = [
      { note: '<expPlus:[25]>\n<goldPlus:[10]>\n<sdpPlus:[3]>' },
    ];
    enemy.initMembers();

    // Act
    globalThis.Game_Enemy.prototype.setup.call(enemy, 1, 0, 0);

    // Assert
    expect(enemy.exp()).toBe(125);
    expect(enemy.gold()).toBe(60);
    expect(enemy.sdpPoints()).toBe(5);

    delete globalThis.J.SDP;
  });

  it('paramBase includes buff-only natural bonuses (no permanent growth)', () =>
  {
    // Arrange
    const enemy = new globalThis.Game_Enemy();
    enemy._enemyDb = {
      exp: 0, gold: 0, sdpPoints: 0, actions: [],
    };
    enemy.__testNoteSources = [ { note: '<defBuffPlus:[8]>' } ];
    enemy.initMembers();

    // Act
    enemy.refreshAllParameterBuffs();

    // Assert
    expect(enemy.paramBase(3)).toBe(8);
  });
});
//endregion plugins/natural/_component/game-enemy.test.js
