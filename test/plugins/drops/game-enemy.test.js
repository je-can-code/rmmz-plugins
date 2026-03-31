//region plugins/drops/game-enemy.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadDropsControlPluginVm, resetDropsControlPluginSandbox } from './drops-vm.js';
import { newVmRpgEnemy } from './vm-rpg-enemy.js';

describe('J-DropsControl Game_Enemy (out/J-DropsControl.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadDropsControlPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    resetDropsControlPluginSandbox(sandbox);
  });

  it('returns scaled enemy gold using party gold multiplier bonuses', () =>
  {
    const actor = new sandbox.Game_Actor();

    actor.__testNoteSources = [ { note: '<goldMultiplier:50>' } ];
    sandbox.$gameParty.__battleMembers = [ actor ];

    const rpg = newVmRpgEnemy(sandbox, {
      note: '',
      gold: 100,
    });

    const enemy = new sandbox.Game_Enemy();

    enemy.initMembers();
    enemy._enemyDb = rpg;

    expect(enemy.gold()).toBe(150);
  });

  it('resolves makeDropItems using percentage rolls and itemObject', () =>
  {
    sandbox.$dataItems[3] = { id: 3, name: 'TestItem' };

    const partyActor = new sandbox.Game_Actor();
    partyActor.initMembers();
    sandbox.$gameParty.__battleMembers = [ partyActor ];

    const rpg = newVmRpgEnemy(sandbox, {
      note: '',
      gold: 0,
      dropItems: [ { kind: 1, dataId: 3, denominator: 40 } ],
    });

    const enemy = new sandbox.Game_Enemy();

    enemy.initMembers();
    enemy._enemyDb = rpg;

    sandbox.Math.randomInt = function()
    {
      return 30;
    };

    const loot = enemy.makeDropItems();

    expect(loot.length).toBe(1);
    expect(loot[0].name).toBe('TestItem');
  });
});
//endregion plugins/drops/game-enemy.test.js
