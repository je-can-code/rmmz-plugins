//region plugins/drops/_component/drop-chance-roll-threading.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installDropsHostGlobals, setPluginContextToJBase, setPluginContextToJDrops } from './fixtures/install-drops-host-globals.js';

describe('J-DropsControl killer roll threading (direct src import)', () =>
{
  let originalChanceIn100;

  beforeAll(async () =>
  {
    vi.resetModules();

    installDropsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/managers/RPGManager.js'));

    await import('../../../../src/plugins/_base/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/_base/objects/Game_Battler.js');

    setPluginContextToJDrops();
    await import('../../../../src/plugins/drops/core/_metadata/initialization.js');

    await import('../../../../src/plugins/drops/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/drops/core/objects/Game_Actor.js');
    await import('../../../../src/plugins/drops/core/objects/Game_Party.js');
    await import('../../../../src/plugins/drops/core/objects/Game_Enemy.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
    originalChanceIn100 = globalThis.RPGManager.chanceIn100;
  });

  afterEach(() =>
  {
    globalThis.RPGManager.chanceIn100 = originalChanceIn100;
  });

  function stubChanceIn100(outcome)
  {
    const calls = [];
    globalThis.RPGManager.chanceIn100 = function(percent, rollForPositive, rollForNegative)
    {
      calls.push({ percent, rollForPositive, rollForNegative });
      return outcome;
    };
    return calls;
  }

  it('defaults to a plain roll (no bonus) when no killer is provided', () =>
  {
    // Arrange
    const calls = stubChanceIn100(true);
    const enemy = new globalThis.Game_Enemy();
    enemy.initMembers();

    // Act
    enemy.didFindLoot(40);

    // Assert
    expect(calls).toEqual([ { percent: 40, rollForPositive: 1, rollForNegative: 0 } ]);
  });

  it('feeds the killer\'s own positive and negative rolls- the killer is both the roller and the recipient', () =>
  {
    // Arrange
    const calls = stubChanceIn100(true);
    const enemy = new globalThis.Game_Enemy();
    enemy.initMembers();
    const killer = {
      getPositiveRolls: () => 2,
      getNegativeRolls: () => 3,
      isVeryLucky: () => false,
      isVeryCursed: () => false,
    };

    // Act
    enemy.didFindLoot(40, killer);

    // Assert
    expect(calls).toEqual([ { percent: 40, rollForPositive: 3, rollForNegative: 3 } ]);
  });
});
//endregion plugins/drops/_component/drop-chance-roll-threading.test.js
