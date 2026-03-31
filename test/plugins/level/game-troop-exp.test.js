//region plugins/level/game-troop-exp.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadLevelPluginVm } from './level-vm.js';

describe('J-LevelMaster Game_Troop experience scaling (out/J-LevelMaster.js)', () =>
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

  it('scales total exp from dead enemies using party average level vs each enemy level', () =>
  {
    sandbox.$gameSystem = new sandbox.Game_System();
    sandbox.$gameSystem.initialize();

    const a = new sandbox.Game_Actor();
    a.initMembers();
    a._level = 14;

    const b = new sandbox.Game_Actor();
    b.initMembers();
    b._level = 16;

    sandbox.$gameParty = new sandbox.Game_Party();
    sandbox.$gameParty.battleMembers = function()
    {
      return [ a, b ];
    };

    const enemy = {
      level: 5,
      exp()
      {
        return 100;
      },
    };

    const troop = Object.create(sandbox.Game_Troop.prototype);
    troop.deadMembers = function()
    {
      return [ enemy ];
    };

    const total = sandbox.Game_Troop.prototype.getScaledExpResult.call(troop);

    expect(total).toBe(190);
  });
});
//endregion plugins/level/game-troop-exp.test.js
