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
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/managers/RPGManager.js'));

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
    const inflictedOrder = battler.onJabsStateInflicted.mock.invocationCallOrder[0];
    const trackedOrder = battler.addJabsState.mock.invocationCallOrder[0];
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
});
//endregion plugins/abs/core/_component/game-battler-on-jabs-state-inflicted.test.js
