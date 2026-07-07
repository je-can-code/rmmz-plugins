//region plugins/abs/core/game-battler-on-jabs-state-inflicted.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearRpgManagerCacheInVm } from '../../../setup/shipped-plugin-vm.js';
import { loadAbsPluginVm } from '../abs-vm.js';

/**
 * Builds a minimal battler stub exposing only what {@link Game_Battler#handleAddingJabsState}
 * touches, so the hook can be exercised without a full JABS_State/JABS_Engine pipeline.
 *
 * @param {object} sandbox
 * @returns {object}
 */
function buildMinimalBattler(sandbox)
{
  const battler = {
    isStateAddable: () => true,
    isStateAffected: () => false,
    addNewState: vi.fn(),
    refresh: vi.fn(),
    resetStateCounts: vi.fn(),
    addJabsState: vi.fn(),
    onJabsStateInflicted: vi.fn(),
    _result: { pushAddedState: vi.fn() },
  };

  // bind the real handleAddingJabsState implementation onto this plain mock object.
  battler.handleAddingJabsState = sandbox.Game_Battler.prototype.handleAddingJabsState;

  return battler;
}

describe('J-ABS Game_Battler#onJabsStateInflicted (out/abs/J-ABS.js)', () =>
{
  /** @type {object} */
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadAbsPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    clearRpgManagerCacheInVm(sandbox);
  });

  it('fires onJabsStateInflicted with the state id and attacker after tracking is settled', () =>
  {
    const battler = buildMinimalBattler(sandbox);
    const attacker = { name: 'attacker' };

    battler.handleAddingJabsState(14, attacker);

    expect(battler.onJabsStateInflicted).toHaveBeenCalledWith(14, attacker);

    // fired after JABS tracking is registered, not before.
    const inflictedOrder = battler.onJabsStateInflicted.mock.invocationCallOrder[0];
    const trackedOrder = battler.addJabsState.mock.invocationCallOrder[0];
    expect(inflictedOrder).toBeGreaterThan(trackedOrder);
  });

  it('fires again on reapplication, unlike a first-application-only hook', () =>
  {
    const battler = buildMinimalBattler(sandbox);

    // simulate the state already being affected (a reapplication, not a first application).
    battler.isStateAffected = () => true;

    const attacker = { name: 'attacker' };

    battler.handleAddingJabsState(14, attacker);
    battler.handleAddingJabsState(14, attacker);

    expect(battler.onJabsStateInflicted).toHaveBeenCalledTimes(2);

    // addNewState is only for first applications; reapplication should skip it entirely.
    expect(battler.addNewState).not.toHaveBeenCalled();
  });

  it('does not fire when the state is not addable', () =>
  {
    const battler = buildMinimalBattler(sandbox);
    battler.isStateAddable = () => false;

    battler.handleAddingJabsState(14, { name: 'attacker' });

    expect(battler.onJabsStateInflicted).not.toHaveBeenCalled();
  });
});
//endregion plugins/abs/core/game-battler-on-jabs-state-inflicted.test.js
