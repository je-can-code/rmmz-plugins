//region plugins/camods/jabs-engine-tracking.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadCamodsPluginVm } from './camods-vm.js';

describe('J-CA-Mods JABS_Engine tracking hooks (out/ca-mods/J-CA-Mods.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadCamodsPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('handleDefeatedEnemy tracks inanimate vs animate as different variables', () =>
  {
    const calls = [];
    sandbox.J.BASE.Helpers.modVariable = function(variableId, amount)
    {
      calls.push({ variableId, amount });
    };

    const engine = new sandbox.JABS_Engine();

    engine.handleDefeatedEnemy({ isInanimate: () => true }, null);
    engine.handleDefeatedEnemy({ isInanimate: () => false }, null);

    expect(calls).toEqual([
      { variableId: sandbox.J.CAMods.Tracking.DestructiblesDestroyed, amount: 1 },
      { variableId: sandbox.J.CAMods.Tracking.EnemiesDefeated, amount: 1 },
    ]);
  });

  it('handleDefeatedPlayer increments deaths variable', () =>
  {
    const calls = [];
    sandbox.J.BASE.Helpers.modVariable = function(variableId, amount)
    {
      calls.push({ variableId, amount });
    };

    const engine = new sandbox.JABS_Engine();
    engine.handleDefeatedPlayer();

    expect(calls).toEqual([
      { variableId: sandbox.J.CAMods.Tracking.NumberOfDeaths, amount: 1 },
    ]);
  });
});
//endregion plugins/camods/jabs-engine-tracking.test.js
