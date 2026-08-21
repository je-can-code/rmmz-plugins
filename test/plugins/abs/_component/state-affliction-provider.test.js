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

  it('defaults iconIndex to 0 when the tracked state has no resolvable database row', () =>
  {
    const trackedState = buildTrackedState({ stateId: 9999 });
    const battler = buildBattler(sandbox);

    globalThis.$jabsEngine.getNegativeJabsStatesByUuid.mockReturnValue([ trackedState ]);

    const collection = StateAfflictionProvider.collectForBattler(battler);

    expect(collection.negative[0].iconIndex).toBe(0);
  });

  it('keeps a state J-ABS has no opinion about, passive or otherwise', () =>
  {
    // Arrange: knowing what a passive state is belongs to J-Passive, so core lists this one. The
    // exclusion now lives in the passive/JABS bridge, where both halves of that question are in
    // scope, and is covered there.
    const trackedState = buildTrackedState({ stateId: 1021 });
    const battler = buildBattler(sandbox, { _passiveStateIds: [ 1021 ] });

    globalThis.$jabsEngine.getNegativeJabsStatesByUuid.mockReturnValue([ trackedState ]);

    // Act
    const collection = StateAfflictionProvider.collectForBattler(battler);

    // Assert
    expect(collection.negative.length).toBe(1);
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

  it('returns an empty collection without calling the engine when J.ABS is absent', () =>
  {
    delete globalThis.J.ABS;
    const battler = buildBattler(sandbox);

    const collection = StateAfflictionProvider.collectForBattler(battler);

    expect(collection.isEmpty()).toBe(true);
    expect(globalThis.$jabsEngine.getNegativeJabsStatesByUuid).not.toHaveBeenCalled();
  });

  it('returns an empty collection without calling the engine when $jabsEngine is absent', () =>
  {
    globalThis.$jabsEngine = undefined;
    const battler = buildBattler(sandbox);

    const collection = StateAfflictionProvider.collectForBattler(battler);

    expect(collection.isEmpty()).toBe(true);
  });

  it('returns an empty collection when no battler is provided', () =>
  {
    const collection = StateAfflictionProvider.collectForBattler(null);

    expect(collection.isEmpty()).toBe(true);
    expect(globalThis.$jabsEngine.getNegativeJabsStatesByUuid).not.toHaveBeenCalled();
  });

  it('collects positive rows with battler.state icon indices', () =>
  {
    const trackedState = buildTrackedState({ stateId: 1021 });
    const battler = buildBattler(sandbox);

    globalThis.$jabsEngine.getPositiveJabsStatesByUuid.mockReturnValue([ trackedState ]);

    const collection = StateAfflictionProvider.collectForBattler(battler);

    expect(collection.positive.length).toBe(1);
    expect(collection.positive[0].polarity).toBe('positive');
  });

  it('keeps a positive row core has no reason to reject', () =>
  {
    // Arrange: the counterpart of the negative case above. Both polarities route through the same
    // qualifies check, so the passive exclusion is covered once, on the side of the seam that
    // knows what a passive is.
    const trackedState = buildTrackedState({ stateId: 1021 });
    const battler = buildBattler(sandbox, { _passiveStateIds: [ 1021 ] });

    globalThis.$jabsEngine.getPositiveJabsStatesByUuid.mockReturnValue([ trackedState ]);

    // Act
    const collection = StateAfflictionProvider.collectForBattler(battler);

    // Assert
    expect(collection.positive.length).toBe(1);
  });

  it('skips a positive row disqualified for a reason core does own', () =>
  {
    // Arrange: expiry is J-ABS's own call, so it still disqualifies a row on this side of the
    // seam. The surviving sibling is what proves the skip is selective rather than total.
    const expiredBuff = buildTrackedState({ stateId: 1030, expired: true });
    const liveBuff = buildTrackedState({ stateId: 1031 });
    const battler = buildBattler(sandbox);

    globalThis.$jabsEngine.getPositiveJabsStatesByUuid.mockReturnValue([ expiredBuff, liveBuff ]);

    // Act
    const collection = StateAfflictionProvider.collectForBattler(battler);

    // Assert
    expect(collection.positive.length).toBe(1);
    expect(collection.positive[0].stateId).toBe(1031);
  });

  it('resolves fill ratio and eternal null', () =>
  {
    expect(StateAfflictionViewModel.resolveFillRatio(120, 240, false)).toBe(0.5);
    expect(StateAfflictionViewModel.resolveFillRatio(300, 240, false)).toBe(1);
    expect(StateAfflictionViewModel.resolveFillRatio(120, 240, true)).toBe(null);
    expect(StateAfflictionViewModel.resolveFillRatio(120, 0, false)).toBe(null);
  });
});
//endregion plugins/abs/_component/state-affliction-provider.test.js