//region plugins/drops/game-actor.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadDropsControlPluginVm, resetDropsControlPluginSandbox } from './drops-vm.js';

describe('J-DropsControl Game_Actor (out/drops/J-DropsControl.js)', () =>
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

  it('computes drop multiplier factor from summed dropMultiplier tags on getAllNotes sources', () =>
  {
    const actor = new sandbox.Game_Actor();

    actor.__testNoteSources = [
      { note: '<dropMultiplier:40>' },
      { note: '<dropMultiplier:10>' },
    ];

    expect(actor.getDropMultiplierBonus()).toBe(0.5);
  });

  it('computes gold multiplier factor from summed goldMultiplier tags on getAllNotes sources', () =>
  {
    const actor = new sandbox.Game_Actor();

    actor.__testNoteSources = [ { note: '<goldMultiplier:75>' } ];

    expect(actor.getGoldMultiplier()).toBe(0.75);
  });

  it('adds SDP panel bonus to gold multiplier factor when getSdpBonusForParameterKey is available', () =>
  {
    const actor = new sandbox.Game_Actor();

    actor.__testNoteSources = [ { note: '<goldMultiplier:25>' } ];
    actor.getSdpBonusForParameterKey = function(parameterKey, baseParam)
    {
      if (parameterKey === 'gdr' && baseParam === 1)
      {
        return 0.1;
      }

      return 0;
    };

    expect(actor.getGoldMultiplier()).toBe(0.35);
  });

  it('adds SDP panel bonus to drop multiplier factor when getSdpBonusForParameterKey is available', () =>
  {
    const actor = new sandbox.Game_Actor();

    actor.__testNoteSources = [ { note: '<dropMultiplier:40>' } ];
    actor.getSdpBonusForParameterKey = function(parameterKey, baseParam)
    {
      if (parameterKey === 'dor' && baseParam === 1)
      {
        return 0.15;
      }

      return 0;
    };

    expect(actor.getDropMultiplierBonus()).toBe(0.55);
  });
});
//endregion plugins/drops/game-actor.test.js
