//region plugins/drops/_component/rpg-enemy.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installDropsHostGlobals, setPluginContextToJBase, setPluginContextToJDrops } from './fixtures/install-drops-host-globals.js';

describe('J-DropsControl RPG_Enemy (direct src import)', () =>
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

    ({ default: RPG_Enemy } = await import('../../../../src/plugins/_base/database/implementations/RPG_Enemy.js'));
    globalThis.RPG_Enemy = RPG_Enemy;
    ({ default: globalThis.RPG_DropItem } = await import('../../../../src/plugins/_base/database/_data/RPG_DropItem.js'));

    setPluginContextToJDrops();
    await import('../../../../src/plugins/drops/core/_metadata/initialization.js');

    // patches globalThis.RPG_Enemy.prototype directly, no vm involved.
    await import('../../../../src/plugins/drops/core/database/RPG_Enemy.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
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

  it('appends drops parsed from note tags onto dropItems during initMembers', () =>
  {
    // Arrange & Act
    const rpg = new RPG_Enemy(makeRawEnemy({ note: '<drops:[i,3,40]>' }), 0);

    // Assert
    expect(rpg.dropItems.length).toBe(1);
    expect(rpg.dropItems[0].kind).toBe(globalThis.RPG_DropItem.Types.Item);
    expect(rpg.dropItems[0].dataId).toBe(3);
    expect(rpg.dropItems[0].denominator).toBe(40);
  });
});
//endregion plugins/drops/_component/rpg-enemy.test.js
