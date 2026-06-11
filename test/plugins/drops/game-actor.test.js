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

  it('computes gold multiplier factor from goldMultiplier tag', () =>
  {
    const actor = new sandbox.Game_Actor();

    actor.__testNoteSources = [ { note: '<goldMultiplier:25>' } ];

    expect(actor.getGoldMultiplier()).toBe(0.25);
  });

  it('computes drop multiplier factor from dropMultiplier tag', () =>
  {
    const actor = new sandbox.Game_Actor();

    actor.__testNoteSources = [ { note: '<dropMultiplier:40>' } ];

    expect(actor.getDropMultiplierBonus()).toBe(0.4);
  });
});
//endregion plugins/drops/game-actor.test.js
