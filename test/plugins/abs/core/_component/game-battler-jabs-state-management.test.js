//region plugins/abs/core/_component/game-battler-jabs-state-management.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a real Game_Battler-backed instance with a note-source override.
 * @param {string[]} notes Raw note strings, one per source.
 * @returns {object}
 */
function buildBattler(notes = [])
{
  const battler = Object.create(globalThis.Game_Battler.prototype);
  battler.initMembers();
  battler.__testNoteSources = notes.map(note => ({ note }));
  battler.name = () => 'TestBattler';
  return battler;
}

describe('J-ABS Game_Battler JABS state management (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Battler.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_BattlerBase.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_Battler.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/core/objects/Game_Battler.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();

    // reset the shared $jabsEngine stub to a clean slate before every test.
    globalThis.$jabsEngine = {
      absEnabled: true,
      getJabsStatesByUuid: () => new Map(),
      getJabsStateByUuidAndStateId: () => undefined,
      removeJabsStateByUuid: vi.fn(),
      addOrUpdateStateByUuid: vi.fn(),
    };
  });

  describe('states (stacking override)', () =>
  {
    it('returns the original states unchanged when nothing is JABS-tracked', () =>
    {
      // Arrange
      const battler = buildBattler();
      const originalState = { id: 5 };
      const originalStatesFn = () => [ originalState ];
      globalThis.J.ABS.Aliased.Game_Battler.set('states', originalStatesFn);

      // Act
      const result = battler.states();

      // Assert
      expect(result).toEqual([ originalState ]);
    });

    it('appends cloned duplicates for every stack beyond the first', () =>
    {
      // Arrange
      const cloned = { id: 5, clone: true };
      const originalState = { id: 5, _clone: () => cloned };
      globalThis.J.ABS.Aliased.Game_Battler.set('states', () => [ originalState ]);
      globalThis.$jabsEngine.getJabsStatesByUuid = () => new Map([ [ 5, { stackCount: 3 } ] ]);
      const battler = buildBattler();

      // Act
      const result = battler.states();

      // Assert- 1 original + 2 clones (3 stacks total).
      expect(result).toEqual([ originalState, cloned, cloned ]);
    });

    it('does not duplicate a state with only a single stack', () =>
    {
      // Arrange
      const originalState = { id: 5, _clone: vi.fn() };
      globalThis.J.ABS.Aliased.Game_Battler.set('states', () => [ originalState ]);
      globalThis.$jabsEngine.getJabsStatesByUuid = () => new Map([ [ 5, { stackCount: 1 } ] ]);
      const battler = buildBattler();

      // Act
      const result = battler.states();

      // Assert
      expect(result).toEqual([ originalState ]);
      expect(originalState._clone).not.toHaveBeenCalled();
    });
  });

  describe('stackCount', () =>
  {
    it('returns 0 when the state is not tracked by JABS', () =>
    {
      // Arrange
      const battler = buildBattler();
      globalThis.$jabsEngine.getJabsStateByUuidAndStateId = () => undefined;

      // Act & Assert
      expect(battler.stackCount(5)).toBe(0);
    });

    it('returns the tracked stack count when the state is tracked', () =>
    {
      // Arrange
      const battler = buildBattler();
      globalThis.$jabsEngine.getJabsStateByUuidAndStateId = () => ({ stackCount: 4 });

      // Act & Assert
      expect(battler.stackCount(5)).toBe(4);
    });
  });

  describe('addState (JABS override)', () =>
  {
    it('falls back to original addState when no attacker is provided', () =>
    {
      // Arrange
      const battler = buildBattler();
      const originalAddState = vi.fn();
      globalThis.J.ABS.Aliased.Game_Battler.set('addState', originalAddState);
      const handleSpy = vi.spyOn(battler, 'handleAddingJabsState');

      // Act
      battler.addState(5, null);

      // Assert
      expect(originalAddState).toHaveBeenCalledWith(5);
      expect(handleSpy).not.toHaveBeenCalled();
      handleSpy.mockRestore();
    });

    it('falls back to original addState when the JABS engine is disabled', () =>
    {
      // Arrange
      const battler = buildBattler();
      globalThis.$jabsEngine.absEnabled = false;
      const originalAddState = vi.fn();
      globalThis.J.ABS.Aliased.Game_Battler.set('addState', originalAddState);
      const handleSpy = vi.spyOn(battler, 'handleAddingJabsState');

      // Act
      battler.addState(5, { name: 'attacker' });

      // Assert
      expect(originalAddState).toHaveBeenCalledWith(5);
      expect(handleSpy).not.toHaveBeenCalled();
      handleSpy.mockRestore();
    });

    it('hands off to handleAddingJabsState when an attacker is provided and the engine is enabled', () =>
    {
      // Arrange
      const battler = buildBattler();
      const attacker = { name: 'attacker' };
      const handleSpy = vi.spyOn(battler, 'handleAddingJabsState')
        .mockImplementation(() => {});

      // Act
      battler.addState(5, attacker, 'skill-obj');

      // Assert
      expect(handleSpy).toHaveBeenCalledWith(5, attacker, null, 'skill-obj');
      handleSpy.mockRestore();
    });
  });

  describe('removeState (JABS override)', () =>
  {
    it('always performs the original removal logic first', () =>
    {
      // Arrange
      const battler = buildBattler();
      const originalRemoveState = vi.fn();
      globalThis.J.ABS.Aliased.Game_Battler.set('removeState', originalRemoveState);

      // Act
      battler.removeState(5);

      // Assert
      expect(originalRemoveState).toHaveBeenCalledWith(5);
    });

    it('removes the tracked JABS state when one is found', () =>
    {
      // Arrange
      const battler = buildBattler();
      globalThis.J.ABS.Aliased.Game_Battler.set('removeState', () => {});
      globalThis.$jabsEngine.getJabsStateByUuidAndStateId = () => ({ stateId: 5 });

      // Act
      battler.removeState(5);

      // Assert
      expect(globalThis.$jabsEngine.removeJabsStateByUuid).toHaveBeenCalledWith(battler.getUuid(), 5);
    });

    it('does nothing extra when no tracked JABS state is found', () =>
    {
      // Arrange
      const battler = buildBattler();
      globalThis.J.ABS.Aliased.Game_Battler.set('removeState', () => {});
      globalThis.$jabsEngine.getJabsStateByUuidAndStateId = () => undefined;

      // Act
      battler.removeState(5);

      // Assert
      expect(globalThis.$jabsEngine.removeJabsStateByUuid).not.toHaveBeenCalled();
    });
  });

  describe('clearStates (JABS override)', () =>
  {
    it('always performs the original clearing logic', () =>
    {
      // Arrange
      const battler = buildBattler();
      const originalClearStates = vi.fn();
      globalThis.J.ABS.Aliased.Game_Battler.set('clearStates', originalClearStates);

      // Act
      battler.clearStates();

      // Assert
      expect(originalClearStates).toHaveBeenCalledTimes(1);
    });

    it('has its JABS namespace seeded before vanilla initMembers can call it', () =>
    {
      // Arrange- initMembers seeds the JABS members first precisely so the clearStates() call
      // fired from within vanilla initMembers finds a uuid already in place.
      const battler = Object.create(globalThis.Game_Battler.prototype);
      // getUuid() composes the name with the raw uuid, so the bare instance needs one.
      battler.name = () => 'tester';
      const aliases = globalThis.J.ABS.Aliased.Game_Battler;
      const priorInitMembers = aliases.get('initMembers');
      const priorClearStates = aliases.get('clearStates');
      aliases.set('initMembers', vi.fn(function() { this.clearStates(); }));
      aliases.set('clearStates', vi.fn());
      globalThis.$jabsEngine.getJabsStatesByUuid = vi.fn(() => new Map());

      try
      {
        // Act
        battler.initMembers();

        // Assert- the purge ran against a real uuid rather than being skipped.
        expect(battler.getUuid()).toEqual(expect.any(String));
        expect(globalThis.$jabsEngine.getJabsStatesByUuid).toHaveBeenCalledWith(battler.getUuid());
      }
      finally
      {
        // these aliases are shared across every test in this file, so put them back.
        aliases.set('initMembers', priorInitMembers);
        aliases.set('clearStates', priorClearStates);
      }
    });

    it('skips the purge entirely when the JABS engine is unavailable', () =>
    {
      // Arrange
      const battler = buildBattler();
      const originalClearStates = vi.fn();
      globalThis.J.ABS.Aliased.Game_Battler.set('clearStates', originalClearStates);
      const getJabsStatesByUuidSpy = vi.fn();
      globalThis.$jabsEngine.getJabsStatesByUuid = getJabsStatesByUuidSpy;
      globalThis.$jabsEngine = undefined;

      // Act
      expect(() => battler.clearStates()).not.toThrow();

      // Assert
      expect(getJabsStatesByUuidSpy).not.toHaveBeenCalled();
      expect(originalClearStates).toHaveBeenCalledTimes(1);
    });

    it('routes a non-expired, non-death tracked state through the normal removal pipeline', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.deathStateId = () => 1;
      globalThis.J.ABS.Aliased.Game_Battler.set('clearStates', vi.fn());
      globalThis.$jabsEngine.getJabsStatesByUuid = () => new Map([ [ 5, { stateId: 5, expired: false } ] ]);
      const removeSpy = vi.spyOn(battler, 'removeState')
        .mockImplementation(() => {});

      // Act
      battler.clearStates();

      // Assert
      expect(removeSpy).toHaveBeenCalledWith(5);
      removeSpy.mockRestore();
    });

    it('skips a tracked state that has already expired', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.deathStateId = () => 1;
      globalThis.J.ABS.Aliased.Game_Battler.set('clearStates', vi.fn());
      globalThis.$jabsEngine.getJabsStatesByUuid = () => new Map([ [ 5, { stateId: 5, expired: true } ] ]);
      const removeSpy = vi.spyOn(battler, 'removeState')
        .mockImplementation(() => {});

      // Act
      battler.clearStates();

      // Assert
      expect(removeSpy).not.toHaveBeenCalled();
      removeSpy.mockRestore();
    });

    it('never force-removes a tracked death-state entry, to avoid an accidental revive', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.deathStateId = () => 1;
      globalThis.J.ABS.Aliased.Game_Battler.set('clearStates', vi.fn());
      globalThis.$jabsEngine.getJabsStatesByUuid = () => new Map([ [ 1, { stateId: 1, expired: false } ] ]);
      const removeSpy = vi.spyOn(battler, 'removeState')
        .mockImplementation(() => {});

      // Act
      battler.clearStates();

      // Assert
      expect(removeSpy).not.toHaveBeenCalled();
      removeSpy.mockRestore();
    });
  });

  describe('decrementStateStacks', () =>
  {
    it('does nothing when the battler is not affected by the state', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.isStateAffected = () => false;

      // Act & Assert
      expect(() => battler.decrementStateStacks(5)).not.toThrow();
      expect(globalThis.$jabsEngine.getJabsStateByUuidAndStateId).toBeDefined();
    });

    it('falls back to normal state removal when the state is not JABS-tracked', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.isStateAffected = () => true;
      globalThis.$jabsEngine.getJabsStateByUuidAndStateId = () => undefined;
      const removeSpy = vi.spyOn(battler, 'removeState')
        .mockImplementation(() => {});

      // Act
      battler.decrementStateStacks(5);

      // Assert
      expect(removeSpy).toHaveBeenCalledWith(5);
      removeSpy.mockRestore();
    });

    it('decrements the tracked state and stops when stacks remain', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.isStateAffected = () => true;
      const trackedState = {
        stackCount: 2,
        decrementStacks: vi.fn(),
        removeFromBattler: vi.fn(),
      };
      globalThis.$jabsEngine.getJabsStateByUuidAndStateId = () => trackedState;

      // Act
      battler.decrementStateStacks(5, 1);

      // Assert
      expect(trackedState.decrementStacks).toHaveBeenCalledWith(1);
      expect(trackedState.removeFromBattler).not.toHaveBeenCalled();
    });

    it('removes the state from the battler once stacks reach zero', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.isStateAffected = () => true;
      const trackedState = {
        stackCount: 0,
        decrementStacks: vi.fn(),
        removeFromBattler: vi.fn(),
      };
      globalThis.$jabsEngine.getJabsStateByUuidAndStateId = () => trackedState;

      // Act
      battler.decrementStateStacks(5);

      // Assert
      expect(trackedState.removeFromBattler).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeStatesByPriority + getPurgeableStates + isRemovableCandidate', () =>
  {
    it('getPurgeableStates defaults to allStates', () =>
    {
      // Arrange
      const battler = buildBattler();
      const states = [ { id: 2 } ];
      battler.allStates = () => states;

      // Act & Assert
      expect(battler.getPurgeableStates()).toBe(states);
    });

    it('excludes the death state unless allowDeath is true', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act & Assert
      expect(battler.isRemovableCandidate({ id: 1 }, 'all', false)).toBe(false);
      expect(battler.isRemovableCandidate({ id: 1 }, 'all', true)).toBe(true);
    });

    it('negative type only selects negative-tagged states', () =>
    {
      // Arrange
      const battler = buildBattler();
      const negativeState = { id: 3, isNegativeType: () => true };
      const positiveState = { id: 4, isNegativeType: () => false };

      // Act & Assert
      expect(battler.isRemovableCandidate(negativeState, 'negative', false)).toBe(true);
      expect(battler.isRemovableCandidate(positiveState, 'negative', false)).toBe(false);
    });

    it('positive type only selects non-negative-tagged states', () =>
    {
      // Arrange
      const battler = buildBattler();
      const negativeState = { id: 3, isNegativeType: () => true };
      const positiveState = { id: 4, isNegativeType: () => false };

      // Act & Assert
      expect(battler.isRemovableCandidate(positiveState, 'positive', false)).toBe(true);
      expect(battler.isRemovableCandidate(negativeState, 'positive', false)).toBe(false);
    });

    it('all type applies no polarity filter', () =>
    {
      // Arrange
      const battler = buildBattler();
      const negativeState = { id: 3, isNegativeType: () => true };

      // Act & Assert
      expect(battler.isRemovableCandidate(negativeState, 'all', false)).toBe(true);
    });

    it('removes up to count states, highest priority first, and returns what was removed', () =>
    {
      // Arrange
      const battler = buildBattler();
      const low = { id: 2, priority: 1, isNegativeType: () => true };
      const high = { id: 3, priority: 9, isNegativeType: () => true };
      const mid = { id: 4, priority: 5, isNegativeType: () => true };
      battler.getPurgeableStates = () => [ low, high, mid ];
      const removeSpy = vi.spyOn(battler, 'removeState')
        .mockImplementation(() => {});

      // Act
      const removed = battler.removeStatesByPriority('negative', false, 2);

      // Assert- highest priority first (high, then mid); low left untouched.
      expect(removed).toEqual([ high, mid ]);
      expect(removeSpy).toHaveBeenNthCalledWith(1, 3);
      expect(removeSpy).toHaveBeenNthCalledWith(2, 4);
      removeSpy.mockRestore();
    });

    it('defaults to removing a single negative, non-death state', () =>
    {
      // Arrange
      const battler = buildBattler();
      const death = { id: 1, priority: 100, isNegativeType: () => true };
      const negative = { id: 5, priority: 1, isNegativeType: () => true };
      battler.getPurgeableStates = () => [ death, negative ];
      const removeSpy = vi.spyOn(battler, 'removeState')
        .mockImplementation(() => {});

      // Act
      const removed = battler.removeStatesByPriority();

      // Assert- death excluded by default, only the negative state removed.
      expect(removed).toEqual([ negative ]);
      removeSpy.mockRestore();
    });
  });

  describe('addJabsState', () =>
  {
    /**
     * Builds a minimal duck-typed "state" carrying only the fields addJabsState destructures.
     * @param {object} fields
     * @returns {object}
     */
    function buildStateRow(fields)
    {
      return {
        iconIndex: 7,
        jabsStateHasMapTimer: false,
        jabsStateDurationFrames: 0,
        jabsStateStacksApplied: 1,
        jabsThisStateDurationBoost: () => 0,
        // JABS_State's constructor resolves tick interval/spread interval eagerly off the
        // source (attacker/self)- types() and tickSpeedFlatModifier/PercentModifier are real
        // Game_Battler methods, so the source in every test below is a real battler instance.
        types: () => [],
        ...fields,
      };
    }

    it('uses the attacker as the assailant when one is provided', () =>
    {
      // Arrange
      const battler = buildBattler();
      const stateRow = buildStateRow({});
      const attacker = buildBattler();
      attacker.state = vi.fn(() => stateRow);

      // Act
      battler.addJabsState(5, attacker);

      // Assert
      expect(attacker.state).toHaveBeenCalledWith(5);
      expect(globalThis.$jabsEngine.addOrUpdateStateByUuid).toHaveBeenCalledWith(
        battler.getUuid(),
        expect.objectContaining({ stateId: 5 }));
    });

    it('falls back to self as the assailant when no attacker is provided', () =>
    {
      // Arrange
      const battler = buildBattler();
      const stateRow = buildStateRow({});
      battler.state = vi.fn(() => stateRow);
      battler.getStateDurationBoost = () => 0;

      // Act
      battler.addJabsState(5, null);

      // Assert
      expect(battler.state).toHaveBeenCalledWith(5);
    });

    it('stays indefinite when the override duration is the -1 sentinel', () =>
    {
      // Arrange
      const battler = buildBattler();
      const stateRow = buildStateRow({ jabsStateHasMapTimer: true, jabsStateDurationFrames: 999 });
      battler.state = () => stateRow;
      battler.getStateDurationBoost = () => 0;

      // Act
      battler.addJabsState(5, null, { duration: -1 });

      // Assert
      const [ , builtState ] = globalThis.$jabsEngine.addOrUpdateStateByUuid.mock.calls.at(-1);
      expect(builtState.duration).toBe(-1);
    });

    it('uses a positive override duration plus boosts, over the state\'s own map-timer duration', () =>
    {
      // Arrange
      const battler = buildBattler();
      const stateRow = buildStateRow({
        jabsStateHasMapTimer: true,
        jabsStateDurationFrames: 999,
        jabsThisStateDurationBoost: overrideDuration => overrideDuration * 0.1,
      });
      battler.state = () => stateRow;
      battler.getStateDurationBoost = () => 5;

      // Act- 100 (override) + 5 (attacker boost) + 10 (state boost, 10% of 100) = 115.
      battler.addJabsState(5, null, { duration: 100 });

      // Assert
      const [ , builtState ] = globalThis.$jabsEngine.addOrUpdateStateByUuid.mock.calls.at(-1);
      expect(builtState.duration).toBe(115);
    });

    it('falls back to the state\'s own map-timer duration when no override is given', () =>
    {
      // Arrange
      const battler = buildBattler();
      const stateRow = buildStateRow({
        jabsStateHasMapTimer: true,
        jabsStateDurationFrames: 200,
        jabsThisStateDurationBoost: baseDuration => baseDuration * 0.5,
      });
      battler.state = () => stateRow;
      battler.getStateDurationBoost = () => 10;

      // Act- 200 (base) + 10 (attacker boost) + 100 (state boost, 50% of 200) = 310.
      battler.addJabsState(5, null, null);

      // Assert
      const [ , builtState ] = globalThis.$jabsEngine.addOrUpdateStateByUuid.mock.calls.at(-1);
      expect(builtState.duration).toBe(310);
    });

    it('defaults to eternal (-1) when there is no override and no map timer', () =>
    {
      // Arrange
      const battler = buildBattler();
      const stateRow = buildStateRow({ jabsStateHasMapTimer: false });
      battler.state = () => stateRow;
      battler.getStateDurationBoost = () => 0;

      // Act
      battler.addJabsState(5, null, null);

      // Assert
      const [ , builtState ] = globalThis.$jabsEngine.addOrUpdateStateByUuid.mock.calls.at(-1);
      expect(builtState.duration).toBe(-1);
    });

    it('prefers the override stack count over the state\'s own default', () =>
    {
      // Arrange
      const battler = buildBattler();
      const stateRow = buildStateRow({ jabsStateStacksApplied: 1 });
      battler.state = () => stateRow;
      battler.getStateDurationBoost = () => 0;

      // Act
      battler.addJabsState(5, null, { stacks: 9 });

      // Assert
      const [ , builtState ] = globalThis.$jabsEngine.addOrUpdateStateByUuid.mock.calls.at(-1);
      expect(builtState.stackCount).toBe(9);
    });

    it('falls back to the state\'s own stack default when no override stacks are given', () =>
    {
      // Arrange
      const battler = buildBattler();
      const stateRow = buildStateRow({ jabsStateStacksApplied: 4 });
      battler.state = () => stateRow;
      battler.getStateDurationBoost = () => 0;

      // Act
      battler.addJabsState(5, null, null);

      // Assert
      const [ , builtState ] = globalThis.$jabsEngine.addOrUpdateStateByUuid.mock.calls.at(-1);
      expect(builtState.stackCount).toBe(4);
    });
  });

  describe('addStateWithOverrides', () =>
  {
    it('falls back to vanilla addState (discarding overrides) when JABS is disabled', () =>
    {
      // Arrange
      const battler = buildBattler();
      globalThis.$jabsEngine.absEnabled = false;
      const addStateSpy = vi.spyOn(battler, 'addState')
        .mockImplementation(() => {});
      const handleSpy = vi.spyOn(battler, 'handleAddingJabsState');

      // Act
      battler.addStateWithOverrides(5, { name: 'attacker' }, { duration: 100 });

      // Assert
      expect(addStateSpy).toHaveBeenCalledWith(5);
      expect(handleSpy).not.toHaveBeenCalled();
      addStateSpy.mockRestore();
      handleSpy.mockRestore();
    });

    it('applies the state via handleAddingJabsState with the given overrides when JABS is enabled', () =>
    {
      // Arrange
      const battler = buildBattler();
      const attacker = { name: 'attacker' };
      const overrides = { duration: 100 };
      const handleSpy = vi.spyOn(battler, 'handleAddingJabsState')
        .mockImplementation(() => {});

      // Act
      battler.addStateWithOverrides(5, attacker, overrides, 'skill-obj');

      // Assert
      expect(handleSpy).toHaveBeenCalledWith(5, attacker, overrides, 'skill-obj');
      handleSpy.mockRestore();
    });
  });

  it('createJabsState builds a JABS_State with all the given parameters applied', () =>
  {
    // Arrange- JABS_State's constructor resolves tick/spread intervals eagerly off the source,
    // so the attacker needs to be a real battler (state()/tickSpeed*Modifier real methods).
    const battler = buildBattler();
    const target = buildBattler();
    const attacker = buildBattler();
    attacker.state = () => ({ jabsThisTickSpeed: 0, jabsSpreadTickFrames: 0, types: () => [] });

    // Act
    const builtState = battler.createJabsState(target, 5, 3, 120, 2, attacker, 'skill-obj')
      .build();

    // Assert
    expect(builtState.stateId).toBe(5);
    expect(builtState.iconIndex).toBe(3);
    expect(builtState.duration).toBe(120);
    expect(builtState.stackCount).toBe(2);
    expect(builtState.source).toBe(attacker);
    expect(builtState.sourceSkill).toBe('skill-obj');
    expect(builtState.battler).toBe(target);
  });

  describe('getStateDurationBoost', () =>
  {
    it('sums flat, percent, and formula duration boosts from note sources', () =>
    {
      // Arrange- flat 10 + percent 20% of 100 (=20) + formula (a.mhp/10=5) = 35.
      const battler = buildBattler([
        '<stateDurationFlat:10>',
        '<stateDurationPerc:20>',
        '<stateDurationFormula:[a.mhp / 10]>',
      ]);
      battler.mhp = 50;

      // Act
      const boost = battler.getStateDurationBoost(100);

      // Assert
      expect(boost).toBeCloseTo(35);
    });

    it('is 0 with no matching tags', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act & Assert
      expect(battler.getStateDurationBoost(100)).toBe(0);
    });
  });

  describe('getStackMaxBoost', () =>
  {
    it('sums all <stackMaxBoost:N> tags across note sources', () =>
    {
      // Arrange
      const battler = buildBattler([ '<stackMaxBoost:2>', '<stackMaxBoost:3>' ]);

      // Act & Assert
      expect(battler.getStackMaxBoost()).toBe(5);
    });

    it('is 0 with no matching tags', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act & Assert
      expect(battler.getStackMaxBoost()).toBe(0);
    });
  });
});
//endregion plugins/abs/core/_component/game-battler-jabs-state-management.test.js
