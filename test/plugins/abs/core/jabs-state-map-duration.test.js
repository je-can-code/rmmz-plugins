//region plugins/abs/core/jabs-state-map-duration.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearRpgManagerCacheInVm } from '../../../setup/shipped-plugin-vm.js';
import { loadAbsPluginVm } from '../abs-vm.js';

/**
 * Hydrates a state database row for map-duration getter tests.
 *
 * @param {object} sandbox
 * @param {number} stateId
 * @param {string} note
 * @param {object} [fields]
 * @returns {object}
 */
function registerStateRow(sandbox, stateId, note, fields = {})
{
  const row = Object.create(sandbox.RPG_State.prototype);

  row.id = stateId;
  row.note = note;
  row.meta = {};
  row.name = `State ${stateId}`;
  row.iconIndex = 0;
  row.removeByWalking = false;
  row.stepsToRemove = 0;
  Object.assign(row, fields);

  sandbox.$dataStates[stateId] = row;

  return row;
}

/**
 * Builds a minimal {@link Game_Battler} for {@link Game_Battler#addJabsState} tests.
 *
 * @param {object} sandbox
 * @param {string} uuid
 * @returns {object}
 */
function buildGameBattler(sandbox, uuid)
{
  const battler = Object.create(sandbox.Game_Battler.prototype);

  battler.initMembers();
  battler._uuid = uuid;
  battler.getUuid = function()
  {
    return this._uuid;
  };
  battler._states = [];
  battler.isStateAffected = function(stateId)
  {
    return this._states.includes(stateId);
  };
  battler.isStateAddable = function()
  {
    return true;
  };
  battler.deathStateId = function()
  {
    return 1;
  };
  battler.removeState = vi.fn();
  battler.addState = vi.fn();
  battler.state = function(stateId)
  {
    return sandbox.$dataStates[stateId];
  };
  battler.getStateDurationBoost = function()
  {
    return 0;
  };

  return battler;
}

describe('J-ABS map state duration', () =>
{
  /** @type {import('vitest').VitestUtils['vi']>} */
  let sandbox;

  beforeAll(() =>
  {
    sandbox = globalThis;
    loadAbsPluginVm(sandbox);
  });

  beforeEach(() =>
  {
    sandbox.$dataStates = [ null ];
    clearRpgManagerCacheInVm(sandbox);
    sandbox.$jabsEngine = {
      addOrUpdateStateByUuid: vi.fn(),
    };
  });

  afterAll(() =>
  {
    delete sandbox.$jabsEngine;
  });

  it('jabsStateHasMapTimer is true for stateDuration tag without removeByWalking', () =>
  {
    const row = registerStateRow(sandbox, 10, '<stateDuration:300>', {
      removeByWalking: false,
      stepsToRemove: 300,
    });

    expect(row.jabsStateHasMapTimer)
      .toBe(true);
    expect(row.jabsIndefiniteState === true)
      .toBe(false);
    expect(row.jabsStateDurationFrames)
      .toBe(300);
  });

  it('jabsStateHasMapTimer is false when indefiniteState is set', () =>
  {
    const row = registerStateRow(sandbox, 11, '<indefiniteState>\n<stateDuration:300>');

    expect(row.jabsIndefiniteState)
      .toBe(true);
    expect(row.jabsStateHasMapTimer)
      .toBe(false);
  });

  it('jabsStateHasMapTimer is false when only stepsToRemove is set (legacy MZ field)', () =>
  {
    const row = registerStateRow(sandbox, 12, '', {
      removeByWalking: true,
      stepsToRemove: 240,
    });

    expect(row.jabsStateHasMapTimer)
      .toBe(false);
    expect(row.jabsStateDurationFrames)
      .toBe(240);
  });

  it('addJabsState applies finite duration from stateDuration tag without removeByWalking', () =>
  {
    registerStateRow(sandbox, 20, '<stateDuration:120>', {
      removeByWalking: false,
      stepsToRemove: 120,
    });

    const battler = buildGameBattler(sandbox, 'test-uuid');
    battler.addJabsState(20, battler);

    expect(sandbox.$jabsEngine.addOrUpdateStateByUuid)
      .toHaveBeenCalledTimes(1);
    const jabsState = sandbox.$jabsEngine.addOrUpdateStateByUuid.mock.calls[ 0 ][ 1 ];

    expect(jabsState.duration)
      .toBe(120);
  });

  it('addJabsState sets eternal duration when indefiniteState is present', () =>
  {
    registerStateRow(sandbox, 21, '<indefiniteState>\n<stateDuration:999>');

    const battler = buildGameBattler(sandbox, 'test-uuid-2');
    battler.addJabsState(21, battler);

    const jabsState = sandbox.$jabsEngine.addOrUpdateStateByUuid.mock.calls[ 0 ][ 1 ];

    expect(jabsState.duration)
      .toBe(-1);
  });

  it('addJabsState sets eternal duration when no map-duration tags exist', () =>
  {
    registerStateRow(sandbox, 22, '<negative>', {
      removeByWalking: false,
      stepsToRemove: 100,
    });

    const battler = buildGameBattler(sandbox, 'test-uuid-3');
    battler.addJabsState(22, battler);

    const jabsState = sandbox.$jabsEngine.addOrUpdateStateByUuid.mock.calls[ 0 ][ 1 ];

    expect(jabsState.duration)
      .toBe(-1);
  });
});
//endregion plugins/abs/core/jabs-state-map-duration.test.js
