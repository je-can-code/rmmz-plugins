//region plugins/passive/lifecycle-hooks.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { loadPassivePluginVm, resetPassivePluginSandbox } from './passive-vm.js';

describe('J-Passive lifecycle hooks (out/J-Passive.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadPassivePluginVm(sandbox);

    // isolate these extension points from host behavior.
    sandbox.J.PASSIVE.Aliased.Game_Actor.set('onLearnNewSkill', function()
    {
    });
    sandbox.J.PASSIVE.Aliased.Game_Actor.set('onForgetSkill', function()
    {
    });
    sandbox.J.PASSIVE.Aliased.Game_Actor.set('onEquipChange', function()
    {
    });
    sandbox.J.PASSIVE.Aliased.Game_Actor.set('onClassChange', function()
    {
    });
    sandbox.J.PASSIVE.Aliased.Game_Party.set('gainItem', function()
    {
    });
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    resetPassivePluginSandbox(sandbox);
  });

  it('Game_Actor lifecycle hooks trigger refreshPassiveStates', () =>
  {
    const actor = new sandbox.Game_Actor();
    actor.initMembers();
    actor.refreshPassiveStates = vi.fn();

    actor.onLearnNewSkill(1);
    actor.onForgetSkill(1);
    actor.onEquipChange();
    actor.onClassChange();

    expect(actor.refreshPassiveStates).toHaveBeenCalledTimes(4);
  });

  it('Game_Party.gainItem triggers refreshPassiveStates', () =>
  {
    const party = new sandbox.Game_Party();
    party.initialize();
    party.refreshPassiveStates = vi.fn();

    party.gainItem({ id: 1 }, 1, false);

    expect(party.refreshPassiveStates).toHaveBeenCalledTimes(1);
  });
});
//endregion plugins/passive/lifecycle-hooks.test.js

