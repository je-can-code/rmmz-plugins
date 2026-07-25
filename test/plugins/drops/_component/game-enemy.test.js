//region plugins/drops/_component/game-enemy.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installDropsHostGlobals, setPluginContextToJBase, setPluginContextToJDrops } from './fixtures/install-drops-host-globals.js';

describe('J-DropsControl Game_Enemy (direct src import)', () =>
{
  /** @type {typeof import('../../../../src/plugins/_base/database/implementations/RPG_Enemy.js').default} */
  let RPG_Enemy;

  beforeAll(async () =>
  {
    vi.resetModules();

    installDropsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/managers/RPGManager.js'));

    await import('../../../../src/plugins/_base/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/_base/objects/Game_Battler.js');

    ({ default: RPG_Enemy } = await import('../../../../src/plugins/_base/database/implementations/RPG_Enemy.js'));
    globalThis.RPG_Enemy = RPG_Enemy;

    setPluginContextToJDrops();
    await import('../../../../src/plugins/drops/core/_metadata/initialization.js');

    await import('../../../../src/plugins/drops/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/drops/core/objects/Game_Actor.js');
    await import('../../../../src/plugins/drops/core/objects/Game_Party.js');

    // RPG_Enemy.js adds originalDropItems() (called by Game_Enemy.js's getDropItems()).
    await import('../../../../src/plugins/drops/core/database/RPG_Enemy.js');
    await import('../../../../src/plugins/drops/core/objects/Game_Enemy.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
    globalThis.$dataItems.length = 0;
    globalThis.$gameParty.__battleMembers = [];
  });

  function makeRawEnemy(overrides = {})
  {
    return {
      id: 1,
      meta: {},
      name: 'TestEnemy',
      note: '',
      battlerName: '',
      traits: [],
      actions: [],
      dropItems: [],
      exp: 0,
      gold: 0,
      params: [ 100, 0, 10, 10, 10, 10, 10, 10 ],
      battlerHue: 0,
      ...overrides,
    };
  }

  it('returns scaled enemy gold using party gold multiplier bonuses', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor.__testNoteSources = [ { note: '<goldMultiplier:50>' } ];
    globalThis.$gameParty.__battleMembers = [ actor ];
    const rpg = new RPG_Enemy(makeRawEnemy({ gold: 100 }), 0);
    const enemy = new globalThis.Game_Enemy();
    enemy.initMembers();
    enemy._enemyDb = rpg;

    // Act & Assert
    expect(enemy.gold()).toBe(150);
  });

  it('resolves makeDropItems using percentage rolls and itemObject', () =>
  {
    // Arrange
    globalThis.$dataItems[3] = { id: 3, name: 'TestItem' };
    const partyActor = new globalThis.Game_Actor();
    partyActor.initMembers();
    globalThis.$gameParty.__battleMembers = [ partyActor ];
    const rpg = new RPG_Enemy(makeRawEnemy({
      gold: 0, dropItems: [ { kind: 1, dataId: 3, denominator: 40 } ],
    }), 0);
    const enemy = new globalThis.Game_Enemy();
    enemy.initMembers();
    enemy._enemyDb = rpg;
    const originalRandomInt = globalThis.Math.randomInt;
    globalThis.Math.randomInt = () => 30;

    // Act
    const loot = enemy.makeDropItems();

    // Assert
    expect(loot.length).toBe(1);
    expect(loot[0].name).toBe('TestItem');
    globalThis.Math.randomInt = originalRandomInt;
  });
});
//endregion plugins/drops/_component/game-enemy.test.js
