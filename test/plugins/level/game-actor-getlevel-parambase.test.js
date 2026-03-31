//region plugins/level/game-actor-getlevel-parambase.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { installGameTempForLevelTests, installMinimalClassParamRows } from './fixtures/level-class-data.js';
import { loadLevelPluginVm, resetLevelPluginSandbox } from './level-vm.js';

describe('J-LevelMaster Game_Actor getLevel and paramBase (out/J-LevelMaster.js)', () =>
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

  beforeEach(() =>
  {
    resetLevelPluginSandbox(sandbox);
    installMinimalClassParamRows(sandbox);
    installGameTempForLevelTests(sandbox);
  });

  it('level and lvl getters match getLevel()', () =>
  {
    const actor = new sandbox.Game_Actor();
    actor.__actorDb = {
      id: 1,
      name: '',
      note: '<level:+3>',
      classId: 1,
      maxLevel: 99,
      traits: [],
    };
    actor.initMembers();
    actor._level = 10;

    expect(actor.getLevel()).toBe(13);
    expect(actor.level).toBe(13);
    expect(actor.lvl).toBe(13);
  });

  it('getLevel adds note tags from actor data, equips, states, and actor balance variable', () =>
  {
    const actor = new sandbox.Game_Actor();
    actor.__actorDb = {
      id: 1,
      name: '',
      note: '<lv:+2>',
      classId: 1,
      maxLevel: 99,
      traits: [],
    };
    actor.initMembers();
    actor._level = 7;
    sandbox.$gameVariables.setValue(141, 4);
    actor.equips = function()
    {
      return [ { id: 1, note: '<level:+5>' } ];
    };
    actor.allStates = function()
    {
      return [ { id: 1, note: '<lvl:+1>' } ];
    };

    expect(actor.getLevel()).toBe(19);
  });

  it('paramBase indexes class curves by getLevel, not raw _level alone', () =>
  {
    const actor = new sandbox.Game_Actor();
    actor.__actorDb = {
      id: 1,
      name: '',
      note: '',
      classId: 1,
      maxLevel: 99,
      traits: [],
    };
    actor.initMembers();
    actor._level = 8;
    actor.equips = function()
    {
      return [ { id: 1, note: '<level:+2>' } ];
    };

    expect(actor.paramBase(2)).toBe(actor.currentClass().params[2][10]);
  });

  it('baseMaxLevel uses database cap when actor maxLevel is below 99', () =>
  {
    const actor = new sandbox.Game_Actor();
    actor.__actorDb = {
      id: 1,
      name: '',
      note: '',
      classId: 1,
      maxLevel: 44,
      traits: [],
    };
    actor.initMembers();

    expect(actor.baseMaxLevel()).toBe(44);
  });

  it('paramBase clamps editor table index to row length minus one', () =>
  {
    const actor = new sandbox.Game_Actor();
    actor.__actorDb = {
      id: 1,
      name: '',
      note: '',
      classId: 1,
      maxLevel: 99,
      traits: [],
    };
    actor.initMembers();
    sandbox.$dataClasses[1].params[2] = Array.from({ length: 40 }, (_, i) => i * 2);
    actor._level = 35;

    expect(actor.paramBase(2)).toBe(70);

    actor._level = 60;

    expect(actor.paramBase(2)).toBe(78);
  });

  it('getLevel uses re-entrancy guard when nested getLevel runs during extractLevel', () =>
  {
    const actor = new sandbox.Game_Actor();
    actor.__actorDb = {
      id: 1,
      name: '',
      note: '<level:+1>',
      classId: 1,
      maxLevel: 99,
      traits: [],
    };
    actor.initMembers();
    actor._level = 3;
    sandbox.$gameVariables.setValue(141, 2);
    const prevExtract = sandbox.Game_Battler.prototype.extractLevel;

    actor.extractLevel = function(rpgData)
    {
      return 5 + prevExtract.call(this, rpgData) + this.getLevel();
    };

    expect(actor.getLevel()).toBe(16);
  });
});
//endregion plugins/level/game-actor-getlevel-parambase.test.js
