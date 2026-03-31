//region plugins/level/game-temp-beyond-max.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { installGameTempForLevelTests, installMinimalClassParamRows } from './fixtures/level-class-data.js';
import { loadLevelPluginVm, resetLevelPluginSandbox } from './level-vm.js';

describe('J-LevelMaster beyond-max param curves (out/J-LevelMaster.js)', () =>
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

  it('paramBase reads extrapolated row when getLevel is greater than 99', () =>
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
    actor._level = 100;

    expect(actor.getLevel()).toBe(100);

    const editor99 = actor.currentClass().params[3][99];
    const valueAt100 = actor.paramBase(3);

    expect(valueAt100).not.toBe(editor99);

    if (sandbox.$gameTemp.hasCachedBeyondMaxData() === false)
    {
      sandbox.$gameTemp.buildBeyondMaxData();
    }

    const beyondRow = sandbox.$gameTemp.getBeyondMaxData(1)[3];

    expect(valueAt100).toBe(beyondRow[100]);
  });

  it('paramBase clamps beyond-max index to the extrapolated row length', () =>
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
    actor.getLevel = function()
    {
      return 5000;
    };

    if (sandbox.$gameTemp.hasCachedBeyondMaxData() === false)
    {
      sandbox.$gameTemp.buildBeyondMaxData();
    }

    const beyondRow = sandbox.$gameTemp.getBeyondMaxData(1)[2];
    const expected = beyondRow[beyondRow.length - 1];

    expect(actor.paramBase(2)).toBe(expected);
  });

  it('buildBeyondMaxData mirrors Game_Temp helper used at setupNewGame', () =>
  {
    sandbox.$gameTemp.buildBeyondMaxData();
    expect(sandbox.$gameTemp.hasCachedBeyondMaxData()).toBe(true);
    const row = sandbox.$gameTemp.getBeyondMaxData(1)[0];
    expect(row.length).toBeGreaterThanOrEqual(1000);
    expect(row[999]).toBeDefined();
  });
});
//endregion plugins/level/game-temp-beyond-max.test.js
