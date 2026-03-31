//region plugins/level/game-party-average.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadLevelPluginVm } from './level-vm.js';

describe('J-LevelMaster Game_Party.averageActorLevel (out/J-LevelMaster.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadLevelPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('averages battle member levels with rounding', () =>
  {
    const a = new sandbox.Game_Actor();
    a.initMembers();
    a._level = 11;

    const b = new sandbox.Game_Actor();
    b.initMembers();
    b._level = 12;

    const party = new sandbox.Game_Party();
    party.battleMembers = function()
    {
      return [ a, b ];
    };

    expect(party.averageActorLevel()).toBe(12);
  });
});
//endregion plugins/level/game-party-average.test.js
