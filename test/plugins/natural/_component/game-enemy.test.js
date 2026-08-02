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
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/core/managers/RPGManager.js'));

    await import('../../../../src/plugins/_base/core/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/_base/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/_base/core/objects/Game_Actor.js');

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

  it('reproduces the reported Wolftrap sdpPlus bug: real note tag, real level-based formula, real sdpPoints:3 base', () =>
  {
    // Arrange: this is Wolftrap's (enemy 301) actual note verbatim from
    // ca/chef-adventure/data/Enemies.json, isolated to the one line that matters here, plus the
    // level tag its formula depends on.
    globalThis.J.SDP = {};
    const enemy = new globalThis.Game_Enemy();
    enemy._enemyDb = {
      exp: 0, gold: 0, sdpPoints: 3, actions: [],
    };
    enemy.__testNoteSources = [
      { note: '<level:5>\n<sdpPlus:[(a.level ** 1.5 * 1)]>\n<sdpPoints:3>' },
    ];
    enemy.initMembers();

    // real level tag is parsed by J-Level in production; this fixture's Game_Battler stubs
    // getLevel() as `this.level ?? 1`, so set the own-property directly rather than pull in the
    // whole Level plugin just to prove Natural/SDP's own wiring.
    enemy.level = 5;

    // Act: mirrors what J-NaturalGrowth's aliased Game_Enemy.setup does on troop/JABS spawn.
    globalThis.Game_Enemy.prototype.setup.call(enemy, 1, 0, 0);

    // Assert: base 3 + (5 ** 1.5 * 1) rounded to 3 decimals by the formula evaluator = 3 + 11.18.
    expect(enemy.sdpsPlus()).toBeCloseTo(11.18, 2);
    expect(enemy.sdpPoints()).toBeCloseTo(14.18, 2);

    delete globalThis.J.SDP;
  });
});
//endregion plugins/natural/_component/game-enemy.test.js
