//region plugins/abs/core/_component/jabs-state-lifecycle.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

const STATE_ID = 80;
const OTHER_STATE_ID = 81;

/**
 * Hydrates a state database row for lifecycle-edge-case tests.
 * @param {number} stateId
 * @param {string} note
 * @returns {object}
 */
function registerStateRow(stateId, note = '')
{
  const row = Object.create(globalThis.RPG_State.prototype);

  row.id = stateId;
  row.note = note;
  row.meta = {};
  row.name = `State ${stateId}`;
  row.iconIndex = 0;

  // RPG_Base#original is a private field set only via the constructor.
  // Objects created with Object.create() skip the constructor, so _original() would throw.
  row._original = function() { return this; };

  globalThis.$dataStates[stateId] = row;

  return row;
}

/**
 * Builds a minimal {@link Game_Battler} stand-in for lifecycle tests.
 * @param {string} uuid
 * @returns {object}
 */
function buildGameBattler(uuid)
{
  const battler = Object.create(globalThis.Game_Battler.prototype);

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
    return globalThis.$dataStates[stateId];
  };

  return battler;
}

describe('J-ABS state lifecycle edge cases (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));
    ({ default: globalThis.RPG_State } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_State.js'));

    await import('../../../../../src/plugins/_base/core/objects/Game_BattlerBase.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Battler.js');

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    await import('../../../../../src/plugins/abs/core/objects/Game_Battler.js');
    await import('../../../../../src/plugins/abs/core/database/RPG_State.js');

    ({ default: globalThis.JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js'));
    ({ default: globalThis.JABS_State } = await import('../../../../../src/plugins/abs/core/models/JABS_State.js'));
  });

  afterAll(() =>
  {
    delete globalThis.$jabsEngine;
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
    globalThis.$dataStates = [ null ];
    globalThis.$jabsEngine = {
      absEnabled: true,
      getJabsStatesByUuid: () => new Map(),
      checkStackConversion: vi.fn(),
    };
  });

  describe('hasEternalDuration', () =>
  {
    it('is true for a state constructed with an eternal (-1) duration', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '');
      const jabsState = new globalThis.JABS_State(buildGameBattler('a'), STATE_ID, 0, -1, 1);

      // Act & Assert
      expect(jabsState.hasEternalDuration()).toBe(true);
    });
  });

  describe('hasDiminishingRefresh', () =>
  {
    it('is true immediately after the refresh reset counter is armed', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '');
      const jabsState = new globalThis.JABS_State(buildGameBattler('a'), STATE_ID, 0, 100, 1);
      jabsState.refreshRefreshResetCounter(10);

      // Act & Assert
      expect(jabsState.hasDiminishingRefresh()).toBe(true);
    });

    it('is false on a freshly constructed state whose reset counter was never armed', () =>
    {
      // Arrange- only the armed side of this predicate was ever asserted, so a version of it
      // that answers "yes, diminishing" unconditionally read exactly the same to the suite.
      registerStateRow(STATE_ID, '');
      const jabsState = new globalThis.JABS_State(buildGameBattler('a'), STATE_ID, 0, 100, 1);

      // Act & Assert
      expect(jabsState.hasDiminishingRefresh()).toBe(false);
    });
  });

  describe('decrementRefreshResetCounter', () =>
  {
    it('spends the last frame of an armed counter, disarming the diminishing-refresh flag', () =>
    {
      // Arrange- one frame left on the clock.
      registerStateRow(STATE_ID, '');
      const jabsState = new globalThis.JABS_State(buildGameBattler('a'), STATE_ID, 0, 100, 1);
      jabsState.refreshRefreshResetCounter(1);

      // Act
      jabsState.decrementRefreshResetCounter();

      // Assert- a decrementer that declines to count down leaves this armed forever.
      expect(jabsState.hasDiminishingRefresh()).toBe(false);
    });

    it('does not drive an already-spent counter below zero', () =>
    {
      // Arrange- the counter is at rest, and timesRefreshed is the only window onto whether it
      // stayed at exactly zero: handleDiminishedRefresh resets on `=== 0`, so a counter pushed
      // to -1 silently strands timesRefreshed at its old value forever.
      registerStateRow(STATE_ID, '');
      const jabsState = new globalThis.JABS_State(buildGameBattler('a'), STATE_ID, 0, 100, 1);
      jabsState.timesRefreshed = 3;

      // Act
      jabsState.decrementRefreshResetCounter();
      jabsState.handleDiminishedRefresh();

      // Assert
      expect(jabsState.timesRefreshed).toBe(0);
    });
  });

  describe('decrementDuration', () =>
  {
    it('does not decrement below zero once already spent', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '');
      const jabsState = new globalThis.JABS_State(buildGameBattler('a'), STATE_ID, 0, 0, 1);

      // Act
      jabsState.decrementDuration();

      // Assert
      expect(jabsState.duration).toBe(0);
    });
  });

  describe('decrementStacks', () =>
  {
    it('normalizes a negative stack count back to zero', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '');
      const jabsState = new globalThis.JABS_State(buildGameBattler('a'), STATE_ID, 0, 100, 1);

      // Act
      jabsState.decrementStacks(5);

      // Assert
      expect(jabsState.stackCount).toBe(0);
    });
  });

  describe('canChangeStackFromDuration', () =>
  {
    it('is false once all stacks are already gone', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '');
      const jabsState = new globalThis.JABS_State(buildGameBattler('a'), STATE_ID, 0, 0, 1);
      jabsState.stackCount = 0;

      // Act & Assert
      expect(jabsState.canChangeStackFromDuration()).toBe(false);
    });

    it('is false for an eternal-duration state even with zero duration and stacks remaining', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '');
      const jabsState = new globalThis.JABS_State(buildGameBattler('a'), STATE_ID, 0, -1, 1);

      // Act & Assert
      expect(jabsState.canChangeStackFromDuration()).toBe(false);
    });
  });

  describe('refreshDuration', () =>
  {
    it('does nothing when refreshed with a duration of exactly zero', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '');
      const jabsState = new globalThis.JABS_State(buildGameBattler('a'), STATE_ID, 0, 50, 1);

      // Act
      jabsState.refreshDuration(0);

      // Assert
      expect(jabsState.duration).toBe(50);
    });

    it('revives a zero stack count to one when the duration is refreshed', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '');
      const jabsState = new globalThis.JABS_State(buildGameBattler('a'), STATE_ID, 0, 50, 1);
      jabsState.stackCount = 0;

      // Act
      jabsState.refreshDuration(100);

      // Assert
      expect(jabsState.stackCount).toBe(1);
    });
  });

  describe('handleApplyStateOnExpire', () =>
  {
    it('does nothing when the expiring state carries no <applyStateOnExpire> tag', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '');
      const battler = buildGameBattler('a');
      const jabsState = new globalThis.JABS_State(battler, STATE_ID, 0, 50, 1);

      // Act
      jabsState.handleApplyStateOnExpire();

      // Assert
      expect(battler.addState).not.toHaveBeenCalled();
    });

    it('does not apply the follow-up state when the chance roll fails', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, `<applyStateOnExpire:[${OTHER_STATE_ID}, 50]>`);
      const battler = buildGameBattler('a');
      const jabsState = new globalThis.JABS_State(battler, STATE_ID, 0, 50, 1);
      vi.spyOn(globalThis.RPGManager, 'chanceIn100').mockReturnValue(false);

      // Act
      jabsState.handleApplyStateOnExpire();

      // Assert
      expect(battler.addState).not.toHaveBeenCalled();
      globalThis.RPGManager.chanceIn100.mockRestore();
    });

    it('applies the follow-up state to the afflicted battler when the chance roll succeeds', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, `<applyStateOnExpire:[${OTHER_STATE_ID}, 100]>`);
      const battler = buildGameBattler('a');
      const source = buildGameBattler('source');
      const jabsState = new globalThis.JABS_State(battler, STATE_ID, 0, 50, 1, source);

      // Act
      jabsState.handleApplyStateOnExpire();

      // Assert
      expect(battler.addState).toHaveBeenCalledWith(OTHER_STATE_ID, source, null);
    });
  });

  describe('handleDiminishedRefresh', () =>
  {
    it('resets timesRefreshed once the refresh reset counter has fully expired', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '');
      const jabsState = new globalThis.JABS_State(buildGameBattler('a'), STATE_ID, 0, 50, 1);
      jabsState.timesRefreshed = 3;

      // Act
      jabsState.handleDiminishedRefresh();

      // Assert
      expect(jabsState.timesRefreshed).toBe(0);
    });

    it('leaves timesRefreshed alone while the refresh reset counter is still armed', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '');
      const jabsState = new globalThis.JABS_State(buildGameBattler('a'), STATE_ID, 0, 50, 1);
      jabsState.timesRefreshed = 3;
      jabsState.refreshRefreshResetCounter(10);

      // Act
      jabsState.handleDiminishedRefresh();

      // Assert
      expect(jabsState.timesRefreshed).toBe(3);
    });
  });

  describe('canHoldBecauseStateType / canRemoveFromBattler', () =>
  {
    it('canHoldBecauseStateType is true when the tracked state is the battler\'s death state', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '');
      const battler = buildGameBattler('a');
      battler.deathStateId = () => STATE_ID;
      const jabsState = new globalThis.JABS_State(battler, STATE_ID, 0, 50, 1);

      // Act & Assert
      expect(jabsState.canHoldBecauseStateType()).toBe(true);
    });

    it('canRemoveFromBattler is false when the battler is not currently affected by the state', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '');
      const battler = buildGameBattler('a');
      battler._states = [];
      const jabsState = new globalThis.JABS_State(battler, STATE_ID, 0, 50, 1);

      // Act & Assert
      expect(jabsState.canRemoveFromBattler()).toBe(false);
    });

    it('canRemoveFromBattler is false when the tracked state is the battler\'s death state', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '');
      const battler = buildGameBattler('a');
      battler.deathStateId = () => STATE_ID;
      battler._states = [ STATE_ID ];
      const jabsState = new globalThis.JABS_State(battler, STATE_ID, 0, 50, 1);

      // Act & Assert
      expect(jabsState.canRemoveFromBattler()).toBe(false);
    });
  });

  describe('shouldRemoveFromBattler / shouldRemoveByDuration', () =>
  {
    it('shouldRemoveFromBattler is false while stacks remain, regardless of duration', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '');
      const jabsState = new globalThis.JABS_State(buildGameBattler('a'), STATE_ID, 0, 0, 3);

      // Act & Assert
      expect(jabsState.shouldRemoveFromBattler()).toBe(false);
    });

    it('shouldRemoveFromBattler is false while time still remains on the clock', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '');
      const jabsState = new globalThis.JABS_State(buildGameBattler('a'), STATE_ID, 0, 100, 1);
      jabsState.stackCount = 0;

      // Act & Assert
      expect(jabsState.shouldRemoveFromBattler()).toBe(false);
    });

    it('shouldRemoveByDuration is false while time remains on the clock', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '');
      const jabsState = new globalThis.JABS_State(buildGameBattler('a'), STATE_ID, 0, 100, 1);

      // Act & Assert
      expect(jabsState.shouldRemoveByDuration()).toBe(false);
    });

    it('shouldRemoveByDuration is false for an eternal-duration state even at zero duration', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '');
      const jabsState = new globalThis.JABS_State(buildGameBattler('a'), STATE_ID, 0, -1, 1);

      // Act & Assert
      expect(jabsState.shouldRemoveByDuration()).toBe(false);
    });
  });

  describe('isAboutToExpire', () =>
  {
    it('is true when duration has dropped to the about-to-expire threshold', () =>
    {
      // Arrange- base duration 100, threshold is round(100/5) = 20.
      registerStateRow(STATE_ID, '');
      const jabsState = new globalThis.JABS_State(buildGameBattler('a'), STATE_ID, 0, 100, 1);
      jabsState.duration = 10;

      // Act & Assert
      expect(jabsState.isAboutToExpire()).toBe(true);
    });

    it('is false for an eternal-duration state even at zero duration', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '');
      const jabsState = new globalThis.JABS_State(buildGameBattler('a'), STATE_ID, 0, -1, 1);

      // Act & Assert
      expect(jabsState.isAboutToExpire()).toBe(false);
    });

    it('is false while duration still sits above the about-to-expire threshold', () =>
    {
      // Arrange- base duration 100 puts the threshold at round(100/5) = 20, and 50 is comfortably
      // above it. Every prior case was either under the threshold or eternal, so the duration
      // comparison itself was never made to answer "no" on a normal, non-eternal state.
      registerStateRow(STATE_ID, '');
      const jabsState = new globalThis.JABS_State(buildGameBattler('a'), STATE_ID, 0, 100, 1);
      jabsState.duration = 50;

      // Act & Assert
      expect(jabsState.isAboutToExpire()).toBe(false);
    });
  });

  describe('getTickInterval', () =>
  {
    it('uses the state\'s own <thisTickSpeed> tag over the plugin default', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '<thisTickSpeed:20>');
      const jabsState = new globalThis.JABS_State(buildGameBattler('a'), STATE_ID, 0, 100, 1);

      // Act
      const result = jabsState.getTickInterval();

      // Assert
      expect(result).toBe(20);
    });

    it('falls back to the plugin default when the state row carries no <thisTickSpeed> tag', () =>
    {
      // Arrange- an untagged row reports a tick speed of 0, and only the tagged arm of that
      // ternary was ever asserted. Taking the untagged value as the base interval regardless
      // collapses the math to the 4-frame tunable floor, which is nowhere near the 60 below.
      registerStateRow(STATE_ID, '');
      const jabsState = new globalThis.JABS_State(buildGameBattler('a'), STATE_ID, 0, 100, 1);

      // Act
      const result = jabsState.getTickInterval();

      // Assert
      expect(result).toBe(60);
    });
  });

  describe('decrementSpreadTickCounter / decrementTickCounter zero-interval edge case', () =>
  {
    it('still fires a spread pulse when the counter is already zero on entry', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '<spread:[100, 3]>');
      const carrier = buildGameBattler('carrier');
      const jabsState = new globalThis.JABS_State(carrier, STATE_ID, 0, 100, 1);
      jabsState.getSpreadTickInterval = () => 0;
      globalThis.JABS_AiManager.getBattlerByUuid = vi.fn(() => null);
      jabsState.resetSpreadTickCounter();

      // Act & Assert- unresolvable carrier short-circuits handleSpreading, but reaching that
      // call at all (rather than throwing/skipping) proves the zero-entry branch fired.
      expect(() => jabsState.decrementSpreadTickCounter()).not.toThrow();
      expect(globalThis.JABS_AiManager.getBattlerByUuid).toHaveBeenCalled();
    });

    it('still fires a slip tick when the counter is already zero on entry', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '');
      const carrier = buildGameBattler('carrier');
      const jabsState = new globalThis.JABS_State(carrier, STATE_ID, 0, 100, 1);
      jabsState.getTickInterval = () => 0;
      globalThis.JABS_AiManager.getBattlerByUuid = vi.fn(() => null);
      jabsState.resetTickCounter();

      // Act & Assert- unresolvable carrier short-circuits handleTick, but reaching that call
      // at all (rather than throwing/skipping) proves the zero-entry branch fired.
      expect(() => jabsState.decrementTickCounter()).not.toThrow();
      expect(globalThis.JABS_AiManager.getBattlerByUuid).toHaveBeenCalled();
    });
  });

  describe('decrementTickCounter cadence', () =>
  {
    /**
     * Arranges a tracked state whose slip cadence is a short, explicit interval and whose map
     * carrier resolves, so that a tick either provably lands on the carrier or provably does not.
     * @param {number} interval The number of frames between slip ticks.
     * @returns {{jabsState: JABS_State, carrierJabs: object}}
     */
    function arrangeTickCadence(interval)
    {
      registerStateRow(STATE_ID, '');

      const carrier = buildGameBattler('carrier');
      const jabsState = new globalThis.JABS_State(carrier, STATE_ID, 0, 100, 1);
      const carrierJabs = { processStateTick: vi.fn() };

      jabsState.getTickInterval = () => interval;
      jabsState.resetTickCounter();
      globalThis.JABS_AiManager.getBattlerByUuid = vi.fn(() => carrierJabs);

      return {
        jabsState,
        carrierJabs,
      };
    }

    it('fires exactly one slip tick on the frame the interval is fully spent', () =>
    {
      // Arrange
      const { jabsState, carrierJabs } = arrangeTickCadence(2);

      // Act- two frames against a two-frame interval.
      jabsState.decrementTickCounter();
      jabsState.decrementTickCounter();

      // Assert- the exact count is what makes this load-bearing in both directions: a counter
      // that never counts down never reaches zero and ticks 0 times, while a zero-check that is
      // always satisfied ticks on every frame and lands 2.
      expect(carrierJabs.processStateTick).toHaveBeenCalledTimes(1);
    });

    it('does not tick while frames still remain on the interval', () =>
    {
      // Arrange- the only thing standing between this frame and a tick is the counter not yet
      // being zero; the carrier resolves and the tracker is live, so no other guard can absorb it.
      const { jabsState, carrierJabs } = arrangeTickCadence(2);

      // Act- one frame against a two-frame interval.
      jabsState.decrementTickCounter();

      // Assert
      expect(carrierJabs.processStateTick).not.toHaveBeenCalled();
    });
  });

  describe('handleTick', () =>
  {
    it('does nothing once the tracker is expired', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '');
      const jabsState = new globalThis.JABS_State(buildGameBattler('a'), STATE_ID, 0, 100, 1);
      jabsState.expired = true;
      globalThis.JABS_AiManager.getBattlerByUuid = vi.fn();

      // Act
      jabsState.handleTick();

      // Assert
      expect(globalThis.JABS_AiManager.getBattlerByUuid).not.toHaveBeenCalled();
    });

    it('does nothing when the global jabs engine is absent', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '');
      const jabsState = new globalThis.JABS_State(buildGameBattler('a'), STATE_ID, 0, 100, 1);
      globalThis.$jabsEngine = undefined;
      globalThis.JABS_AiManager.getBattlerByUuid = vi.fn();

      // Act
      jabsState.handleTick();

      // Assert
      expect(globalThis.JABS_AiManager.getBattlerByUuid).not.toHaveBeenCalled();
    });

    it('does nothing when abs is currently disabled', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '');
      const jabsState = new globalThis.JABS_State(buildGameBattler('a'), STATE_ID, 0, 100, 1);
      globalThis.$jabsEngine.absEnabled = false;
      globalThis.JABS_AiManager.getBattlerByUuid = vi.fn();

      // Act
      jabsState.handleTick();

      // Assert
      expect(globalThis.JABS_AiManager.getBattlerByUuid).not.toHaveBeenCalled();
    });

    it('does nothing when the tracker has no afflicted battler', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '');
      const jabsState = new globalThis.JABS_State(buildGameBattler('a'), STATE_ID, 0, 100, 1);
      jabsState.battler = null;
      globalThis.JABS_AiManager.getBattlerByUuid = vi.fn();

      // Act
      jabsState.handleTick();

      // Assert
      expect(globalThis.JABS_AiManager.getBattlerByUuid).not.toHaveBeenCalled();
    });

    it('does nothing when the afflicted battler has no resolvable map carrier', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '');
      const jabsState = new globalThis.JABS_State(buildGameBattler('a'), STATE_ID, 0, 100, 1);
      globalThis.JABS_AiManager.getBattlerByUuid = vi.fn(() => null);

      // Act & Assert
      expect(() => jabsState.handleTick()).not.toThrow();
    });

    it('applies a slip tick against the resolved map carrier using the live database state row', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '');
      const stateRow = globalThis.$dataStates[STATE_ID];
      const carrier = buildGameBattler('a');
      const jabsState = new globalThis.JABS_State(carrier, STATE_ID, 0, 100, 1);
      const carrierJabs = { processStateTick: vi.fn() };
      globalThis.JABS_AiManager.getBattlerByUuid = vi.fn(() => carrierJabs);

      // Act
      jabsState.handleTick();

      // Assert
      expect(carrierJabs.processStateTick).toHaveBeenCalledWith(stateRow);
    });
  });

  describe('handleSpreading guard clauses', () =>
  {
    it('does nothing once the tracker is expired', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '<spread:[100, 3]>');
      const jabsState = new globalThis.JABS_State(buildGameBattler('a'), STATE_ID, 0, 100, 1);
      jabsState.expired = true;
      globalThis.JABS_AiManager.getBattlerByUuid = vi.fn();

      // Act
      jabsState.handleSpreading();

      // Assert
      expect(globalThis.JABS_AiManager.getBattlerByUuid).not.toHaveBeenCalled();
    });

    it('does nothing when the global jabs engine is absent', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '<spread:[100, 3]>');
      const jabsState = new globalThis.JABS_State(buildGameBattler('a'), STATE_ID, 0, 100, 1);
      globalThis.$jabsEngine = undefined;
      globalThis.JABS_AiManager.getBattlerByUuid = vi.fn();

      // Act
      jabsState.handleSpreading();

      // Assert
      expect(globalThis.JABS_AiManager.getBattlerByUuid).not.toHaveBeenCalled();
    });

    it('does nothing when the tracker has no afflicted battler', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '<spread:[100, 3]>');
      const jabsState = new globalThis.JABS_State(buildGameBattler('a'), STATE_ID, 0, 100, 1);
      jabsState.battler = null;
      globalThis.JABS_AiManager.getBattlerByUuid = vi.fn();

      // Act
      jabsState.handleSpreading();

      // Assert
      expect(globalThis.JABS_AiManager.getBattlerByUuid).not.toHaveBeenCalled();
    });

    it('does nothing when the spread rule is invalid despite the getter normally guarding it', () =>
    {
      // Arrange- shadow the prototype getter on this one row so the defense-in-depth
      // guard inside handleSpreading itself gets exercised directly.
      registerStateRow(STATE_ID, '<spread:[100, 3]>');
      const stateRow = globalThis.$dataStates[STATE_ID];
      Object.defineProperty(stateRow, 'jabsSpreadRule', {
        configurable: true,
        get: () => ({ chance: 0, range: 3 }),
      });
      const jabsState = new globalThis.JABS_State(buildGameBattler('a'), STATE_ID, 0, 100, 1);
      globalThis.JABS_AiManager.getBattlerByUuid = vi.fn();

      // Act
      jabsState.handleSpreading();

      // Assert
      expect(globalThis.JABS_AiManager.getBattlerByUuid).not.toHaveBeenCalled();
    });

    it('does nothing when the afflicted battler has no resolvable map carrier', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '<spread:[100, 3]>');
      const jabsState = new globalThis.JABS_State(buildGameBattler('a'), STATE_ID, 0, 100, 1);
      globalThis.JABS_AiManager.getBattlerByUuid = vi.fn(() => null);

      // Act & Assert
      expect(() => jabsState.handleSpreading()).not.toThrow();
    });

    it('skips candidates whose battler cannot be resolved', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '<spread:[100, 3]>');
      const carrierGame = buildGameBattler('carrier');
      const jabsState = new globalThis.JABS_State(carrierGame, STATE_ID, 0, 100, 1);
      const carrierJabs = { processStateTick: vi.fn(), getBattler: () => carrierGame };
      const unresolvable = { getBattler: () => null };
      globalThis.JABS_AiManager.getBattlerByUuid = vi.fn(() => carrierJabs);
      globalThis.JABS_AiManager.getAlliedBattlersWithinRange = vi.fn(() => [ unresolvable ]);
      globalThis.RPGManager.chanceIn100 = vi.fn(() => true);

      // Act & Assert
      expect(() => jabsState.handleSpreading()).not.toThrow();
      expect(globalThis.RPGManager.chanceIn100).not.toHaveBeenCalled();
    });

    it('never spreads back onto the carrier of the affliction itself', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '<spread:[100, 3]>');
      const carrierGame = buildGameBattler('carrier');
      const jabsState = new globalThis.JABS_State(carrierGame, STATE_ID, 0, 100, 1);
      const carrierJabs = {
        processStateTick: vi.fn(),
        getBattler: () => carrierGame,
        distanceToDesignatedTarget: () => 1,
      };
      globalThis.JABS_AiManager.getBattlerByUuid = vi.fn(() => carrierJabs);
      globalThis.JABS_AiManager.getAlliedBattlersWithinRange = vi.fn(() => [ carrierJabs ]);
      globalThis.RPGManager.chanceIn100 = vi.fn(() => true);

      // Act
      jabsState.handleSpreading();

      // Assert
      expect(carrierGame.addState).not.toHaveBeenCalled();
    });

    it('skips candidates who are not addable for this state id', () =>
    {
      // Arrange
      registerStateRow(STATE_ID, '<spread:[100, 3]>');
      const carrierGame = buildGameBattler('carrier');
      const jabsState = new globalThis.JABS_State(carrierGame, STATE_ID, 0, 100, 1);
      const carrierJabs = { processStateTick: vi.fn(), getBattler: () => carrierGame };
      const targetGame = buildGameBattler('target');
      targetGame.isStateAddable = () => false;
      const targetJabs = { getBattler: () => targetGame, distanceToDesignatedTarget: () => 1 };
      globalThis.JABS_AiManager.getBattlerByUuid = vi.fn(() => carrierJabs);
      globalThis.JABS_AiManager.getAlliedBattlersWithinRange = vi.fn(() => [ targetJabs ]);
      globalThis.RPGManager.chanceIn100 = vi.fn(() => true);

      // Act
      jabsState.handleSpreading();

      // Assert
      expect(targetGame.addState).not.toHaveBeenCalled();
    });
  });

});
//endregion plugins/abs/core/_component/jabs-state-lifecycle.test.js
