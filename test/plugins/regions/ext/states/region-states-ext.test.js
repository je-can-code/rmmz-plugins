//region plugins/regions/ext/states/region-states-ext.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadRegionsStatesStackVm } from '../../regions-vm.js';

describe('J-Regions-States Game_Map (out/regions/ext/J-Regions-States.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadRegionsStatesStackVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('refreshRegionStates parses map note into region state data', () =>
  {
    sandbox.$dataMap = { note: '<regionAddState:[1, 3, 100, 0]>' };
    const map = new sandbox.Game_Map();
    map.initialize();
    map.setup(1);

    const datas = map.getRegionStatesByRegionId(1);
    expect(datas.length).toBe(1);
    expect(datas[0].regionId).toBe(1);
    expect(datas[0].stateId).toBe(3);
    expect(datas[0].chance).toBe(100);
    expect(datas[0].animationId).toBe(0);
  });
});

describe('J-Regions-States Game_Character applyRegionStates', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadRegionsStatesStackVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('applies states when chance succeeds', () =>
  {
    sandbox.$dataMap = { note: '<regionAddState:[7, 12, 100, 0]>' };
    const map = new sandbox.Game_Map();
    map.initialize();
    map.setup(1);
    sandbox.$gameMap = map;

    const added = [];
    const reset = [];
    const battler = {
      stateRate()
      {
        return 1;
      },
      isStateAffected(stateId)
      {
        return added.some(entry => entry.stateId === stateId);
      },
      addState(stateId, attacker)
      {
        added.push({ stateId, attacker });
      },
      resetStateCounts(stateId, attacker)
      {
        reset.push({ stateId, attacker });
      },
    };

    const jabsBattler = {
      getBattler()
      {
        return battler;
      },
    };

    const ch = new sandbox.Game_Character();
    ch.initMembers();
    ch.hasJabsBattler = function()
    {
      return true;
    };
    ch.getJabsBattler = function()
    {
      return jabsBattler;
    };
    ch.regionId = function()
    {
      return 7;
    };
    ch.requestAnimation = function()
    {
    };

    ch.applyRegionStates();

    expect(added).toEqual([ { stateId: 12, attacker: battler } ]);
  });

  it('skips region states when the character is not visible', () =>
  {
    const ch = new sandbox.Game_Character();
    ch.initMembers();
    ch.isVehicle = function()
    {
      return false;
    };
    ch.isVisible = function()
    {
      return false;
    };
    ch.hasJabsBattler = function()
    {
      return true;
    };

    expect(ch.canHandleRegionStates()).toBe(false);
  });

  it('reapplies states on each timer cycle', () =>
  {
    sandbox.$dataMap = { note: '<regionAddState:[7, 12, 100, 0]>' };
    const map = new sandbox.Game_Map();
    map.initialize();
    map.setup(1);
    sandbox.$gameMap = map;

    const added = [];
    const reset = [];
    const battler = {
      stateRate()
      {
        return 1;
      },
      isStateAffected(stateId)
      {
        return added.some(entry => entry.stateId === stateId);
      },
      addState(stateId, attacker)
      {
        added.push({ stateId, attacker });
      },
      resetStateCounts(stateId, attacker)
      {
        reset.push({ stateId, attacker });
      },
    };

    const jabsBattler = {
      getBattler()
      {
        return battler;
      },
    };

    const ch = new sandbox.Game_Character();
    ch.initMembers();
    ch.hasJabsBattler = function()
    {
      return true;
    };
    ch.getJabsBattler = function()
    {
      return jabsBattler;
    };
    ch.regionId = function()
    {
      return 7;
    };
    ch.requestAnimation = function()
    {
    };

    ch.applyRegionStates();
    ch.applyRegionStates();

    expect(added).toEqual([ { stateId: 12, attacker: battler } ]);
    expect(reset).toEqual([ { stateId: 12, attacker: battler } ]);
  });
});
//endregion plugins/regions/ext/states/region-states-ext.test.js
