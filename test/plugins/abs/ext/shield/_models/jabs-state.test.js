//region plugins/abs/ext/shield/_models/jabs-state.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Shield JABS_State (unit, all downstream dependencies mocked)', () =>
{
  let originalRemoveFromBattler;
  let FakeJABS_Shield;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { SHIELD: { Aliased: { JABS_State: new Map() } } } } };

    FakeJABS_Shield = { fromStateId: vi.fn() };
    vi.doMock('../../../../../../src/plugins/abs/ext/shield/_models/JABS_Shield.js', () => ({ default: FakeJABS_Shield }));

    function JABS_State()
    {
    }

    originalRemoveFromBattler = vi.fn();
    JABS_State.prototype.removeFromBattler = originalRemoveFromBattler;
    globalThis.JABS_State = JABS_State;

    await import('../../../../../../src/plugins/abs/ext/shield/_models/JABS_State.js');
  });

  beforeEach(() =>
  {
    originalRemoveFromBattler.mockReset();
    FakeJABS_Shield.fromStateId.mockReset();
  });

  function buildState(overrides = {})
  {
    return Object.assign(Object.create(globalThis.JABS_State.prototype), overrides);
  }

  function buildShield(overrides = {})
  {
    return Object.assign({
      getCap: () => 100,
      getCurrent: () => 50,
      setCurrent: vi.fn(),
      refresh: vi.fn(),
    }, overrides);
  }

  describe('shield getter/setter', () =>
  {
    it('returns null before a shield has ever been set', () =>
    {
      expect(buildState().shield).toBeNull();
    });

    it('returns whatever shield was assigned', () =>
    {
      const state = buildState();
      const shield = buildShield();
      state.shield = shield;
      expect(state.shield).toBe(shield);
    });
  });

  describe('removeFromBattler', () =>
  {
    it('performs the original logic then removes the shield', () =>
    {
      const state = buildState();
      state.removeShield = vi.fn();

      state.removeFromBattler();

      expect(originalRemoveFromBattler).toHaveBeenCalledTimes(1);
      expect(state.removeShield).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeShield', () =>
  {
    it('does nothing when there is no shield', () =>
    {
      const state = buildState();
      expect(() => state.removeShield()).not.toThrow();
    });

    it('zeroes out the current shield value', () =>
    {
      const state = buildState();
      const shield = buildShield();
      state.shield = shield;

      state.removeShield();

      expect(shield.setCurrent).toHaveBeenCalledWith(0);
    });
  });

  describe('onShieldBreak', () =>
  {
    it('fires the battler hook with the shield cap, decrements stacks, and refreshes when stacks remain', () =>
    {
      // Arrange
      const shield = buildShield({ getCap: () => 42 });
      const battler = { onShieldBreak: vi.fn() };
      const state = buildState({ battler, stackCount: 1, decrementStacks: vi.fn(), refreshShield: vi.fn(), removeFromBattler: vi.fn() });
      state.shield = shield;

      // Act
      state.onShieldBreak();

      // Assert
      expect(battler.onShieldBreak).toHaveBeenCalledWith(42);
      expect(state.decrementStacks).toHaveBeenCalledWith(1);
      expect(state.refreshShield).toHaveBeenCalledTimes(1);
      expect(state.removeFromBattler).not.toHaveBeenCalled();
    });

    it('removes the state instead of refreshing when stacks run out', () =>
    {
      // Arrange
      const battler = { onShieldBreak: vi.fn() };
      const state = buildState({
        battler,
        stackCount: 0,
        decrementStacks: vi.fn(() => { state.stackCount = 0; }),
        refreshShield: vi.fn(),
        removeFromBattler: vi.fn(),
      });

      // Act
      state.onShieldBreak();

      // Assert
      expect(state.removeFromBattler).toHaveBeenCalledTimes(1);
      expect(state.refreshShield).not.toHaveBeenCalled();
    });

    it('uses a cap of 0 when there is no shield at all', () =>
    {
      // Arrange
      const battler = { onShieldBreak: vi.fn() };
      const state = buildState({ battler, stackCount: 1, decrementStacks: vi.fn(), refreshShield: vi.fn() });

      // Act
      state.onShieldBreak();

      // Assert
      expect(battler.onShieldBreak).toHaveBeenCalledWith(0);
    });
  });

  describe('recalculateShield', () =>
  {
    it('does nothing when the freshly-derived shield is null', () =>
    {
      FakeJABS_Shield.fromStateId.mockReturnValue(null);
      const state = buildState({ stateId: 5, battler: {}, source: {} });

      state.recalculateShield();

      expect(state.shield).toBeNull();
    });

    it('carries over the previous current value onto the freshly-derived shield', () =>
    {
      const oldShield = buildShield({ getCurrent: () => 30 });
      const newShield = buildShield();
      FakeJABS_Shield.fromStateId.mockReturnValue(newShield);
      const state = buildState({ stateId: 5, battler: {}, source: {} });
      state.shield = oldShield;

      state.recalculateShield();

      expect(newShield.setCurrent).toHaveBeenCalledWith(30);
      expect(state.shield).toBe(newShield);
    });

    it('defaults the carried-over current value to 0 when there was no prior shield', () =>
    {
      const newShield = buildShield();
      FakeJABS_Shield.fromStateId.mockReturnValue(newShield);
      const state = buildState({ stateId: 5, battler: {}, source: {} });

      state.recalculateShield();

      expect(newShield.setCurrent).toHaveBeenCalledWith(0);
    });
  });

  describe('refreshShield / canRefreshShield', () =>
  {
    it('does not refresh when there is no shield', () =>
    {
      const state = buildState();
      expect(() => state.refreshShield()).not.toThrow();
    });

    it('refreshes the shield back to its original amount when one exists', () =>
    {
      const shield = buildShield();
      const state = buildState();
      state.shield = shield;

      state.refreshShield();

      expect(shield.refresh).toHaveBeenCalledTimes(1);
    });

    it('canRefreshShield is false with no shield and true with one', () =>
    {
      const state = buildState();
      expect(state.canRefreshShield()).toBe(false);
      state.shield = buildShield();
      expect(state.canRefreshShield()).toBe(true);
    });
  });
});
//endregion plugins/abs/ext/shield/_models/jabs-state.test.js
