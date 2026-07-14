//region plugins/abs/_component/state-affliction-provider.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import StateAfflictionCollection from '../../../../src/plugins/abs/core/models/StateAfflictionCollection.js';
import StateAfflictionProvider from '../../../../src/plugins/abs/core/models/StateAfflictionProvider.js';
import StateAfflictionViewModel from '../../../../src/plugins/abs/core/models/StateAfflictionViewModel.js';

/**
 * Builds a minimal tracked JABS state row for provider tests.
 *
 * @param {object} fields
 * @returns {object}
 */
function buildTrackedState(fields)
{
  const trackedState = {
    expired: false,
    stateId: 1021,
    stackCount: 1,
    duration: 240,
    baseDurationFrames: 240,
    hasEternalDuration: () => false,
  };

  Object.assign(trackedState, fields);

  return trackedState;
}

/**
 * Builds a battler stub for provider tests.
 *
 * @param {object} sandbox
 * @param {object} fields
 * @returns {object}
 */
function buildBattler(sandbox, fields = {})
{
  const battler = {
    _passiveStateIds: [],
    getUuid: () => 'test-battler-uuid',
    deathStateId: () => 1,
    isPassiveState(stateId)
    {
      return this._passiveStateIds.includes(stateId);
    },
    state(stateId)
    {
      return sandbox.$dataStates[stateId];
    },
  };

  Object.assign(battler, fields);

  return battler;
}

describe('StateAfflictionProvider', () =>
{
  /** @type {object} */
  let sandbox;

  beforeEach(() =>
  {
    sandbox = {
      $dataStates: {
        1021: {
          id: 1021,
          iconIndex: 2166,
        },
      },
    };

    globalThis.J = {
      ABS: {},
      PASSIVE: {},
    };

    globalThis.$jabsEngine = {
      getNegativeJabsStatesByUuid: vi.fn(() => []),
      getPositiveJabsStatesByUuid: vi.fn(() => []),
    };
  });

  afterEach(() =>
  {
    delete globalThis.J;
    delete globalThis.$jabsEngine;
  });

  it('returns a StateAfflictionCollection instance', () =>
  {
    const battler = buildBattler(sandbox);
    const collection = StateAfflictionProvider.collectForBattler(battler);

    expect(collection instanceof StateAfflictionCollection).toBe(true);
  });

  it('collects negative rows with battler.state icon indices', () =>
  {
    const trackedState = buildTrackedState({ stateId: 1021 });
    const battler = buildBattler(sandbox);

    globalThis.$jabsEngine.getNegativeJabsStatesByUuid.mockReturnValue([ trackedState ]);

    const collection = StateAfflictionProvider.collectForBattler(battler);

    expect(collection.negative.length).toBe(1);
    expect(collection.negative[0].iconIndex).toBe(2166);
    expect(collection.negative[0].polarity).toBe('negative');
  });

  it('filters passive states when J.PASSIVE is present', () =>
  {
    const trackedState = buildTrackedState({ stateId: 1021 });
    const battler = buildBattler(sandbox, { _passiveStateIds: [ 1021 ] });

    globalThis.$jabsEngine.getNegativeJabsStatesByUuid.mockReturnValue([ trackedState ]);

    const collection = StateAfflictionProvider.collectForBattler(battler);

    expect(collection.isEmpty()).toBe(true);
  });

  it('filters expired and death states', () =>
  {
    const expiredState = buildTrackedState({ expired: true });
    const deathState = buildTrackedState({ stateId: 1 });
    const battler = buildBattler(sandbox);

    globalThis.$jabsEngine.getNegativeJabsStatesByUuid.mockReturnValue([ expiredState, deathState ]);

    const collection = StateAfflictionProvider.collectForBattler(battler);

    expect(collection.isEmpty()).toBe(true);
  });

  it('resolves fill ratio and eternal null', () =>
  {
    expect(StateAfflictionViewModel.resolveFillRatio(120, 240, false)).toBe(0.5);
    expect(StateAfflictionViewModel.resolveFillRatio(300, 240, false)).toBe(1);
    expect(StateAfflictionViewModel.resolveFillRatio(120, 240, true)).toBe(null);
  });
});
//endregion plugins/abs/_component/state-affliction-provider.test.js