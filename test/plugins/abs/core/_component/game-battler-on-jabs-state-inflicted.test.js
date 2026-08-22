//region plugins/abs/core/_component/game-battler-on-jabs-state-inflicted.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a minimal battler stub exposing only what {@link Game_Battler#handleAddingJabsState}
 * touches, so the hook can be exercised without a full JABS_State/JABS_Engine pipeline.
 * @returns {object}
 */
function buildMinimalBattler()
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

  // vanilla Game_Battler accessor the production code reads its action result through.
  battler.result = () => battler._result;

  // bind the real handleAddingJabsState implementation onto this plain mock object.
  battler.handleAddingJabsState = globalThis.Game_Battler.prototype.handleAddingJabsState;

  return battler;
}

describe('J-ABS Game_Battler#onJabsStateInflicted (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_Battler.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/core/objects/Game_Battler.js');
  });

  it('fires onJabsStateInflicted with the state id and attacker after tracking is settled', () =>
  {
    // Arrange
    const battler = buildMinimalBattler();
    const attacker = { name: 'attacker' };

    // Act
    battler.handleAddingJabsState(14, attacker);

    // Assert- fired after JABS tracking is registered, not before.
    expect(battler.onJabsStateInflicted).toHaveBeenCalledWith(14, attacker);
    const [ inflictedOrder ] = battler.onJabsStateInflicted.mock.invocationCallOrder;
    const [ trackedOrder ] = battler.addJabsState.mock.invocationCallOrder;
    expect(inflictedOrder).toBeGreaterThan(trackedOrder);
  });

  it('fires again on reapplication, unlike a first-application-only hook', () =>
  {
    // Arrange- simulate the state already being affected (a reapplication, not a first application).
    const battler = buildMinimalBattler();
    battler.isStateAffected = () => true;
    const attacker = { name: 'attacker' };

    // Act
    battler.handleAddingJabsState(14, attacker);
    battler.handleAddingJabsState(14, attacker);

    // Assert- addNewState is only for first applications; reapplication should skip it entirely.
    expect(battler.onJabsStateInflicted).toHaveBeenCalledTimes(2);
    expect(battler.addNewState).not.toHaveBeenCalled();
  });

  it('registers a first-time application with vanilla tracking before handing off to JABS', () =>
  {
    // Arrange- isStateAffected is false, which is what makes this a first application rather
    // than the reapplication covered above.
    const battler = buildMinimalBattler();
    const attacker = { name: 'attacker' };

    // Act
    battler.handleAddingJabsState(14, attacker);

    // Assert- vanilla's own bookkeeping has to run for a state it has never seen, and the
    // battler has to be refreshed so the new state's traits take effect.
    expect(battler.addNewState).toHaveBeenCalledWith(14, attacker);
    expect(battler.refresh).toHaveBeenCalledTimes(1);
  });

  it('does not fire when the state is not addable', () =>
  {
    // Arrange
    const battler = buildMinimalBattler();
    battler.isStateAddable = () => false;

    // Act
    battler.handleAddingJabsState(14, { name: 'attacker' });

    // Assert
    expect(battler.onJabsStateInflicted).not.toHaveBeenCalled();
  });

  it('the default hook itself is a no-op extension point', () =>
  {
    // Arrange
    const battler = Object.create(globalThis.Game_Battler.prototype);

    // Act & Assert
    expect(() => battler.onJabsStateInflicted(14, { name: 'attacker' })).not.toThrow();
  });
});
//endregion plugins/abs/core/_component/game-battler-on-jabs-state-inflicted.test.js
