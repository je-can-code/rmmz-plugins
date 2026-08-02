//region plugins/abs/ext/shield/objects/_game-battler.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Shield _Game_Battler (unit, all downstream dependencies mocked)', () =>
{
  let originalCreateJabsState;
  let JABS_Shield_mock;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: { EXT: { SHIELD: { Aliased: { Game_Battler: new Map() }, RegExp: { Break: /break/ } } } },
    };

    function Game_Battler()
    {
    }
    originalCreateJabsState = vi.fn(() => ({ setShield: vi.fn() }));
    Game_Battler.prototype.createJabsState = originalCreateJabsState;
    globalThis.Game_Battler = Game_Battler;

    JABS_Shield_mock = { fromStateId: vi.fn() };
    vi.doMock('../../../../../../src/plugins/abs/ext/shield/_models/JABS_Shield.js', () => ({ default: JABS_Shield_mock }));

    globalThis.RPGManager = { getArrayFromNotesByRegex: vi.fn(() => []) };

    await import('../../../../../../src/plugins/abs/ext/shield/objects/_Game_Battler.js');
  });

  beforeEach(() =>
  {
    originalCreateJabsState.mockClear();
    JABS_Shield_mock.fromStateId.mockReset();
    globalThis.RPGManager.getArrayFromNotesByRegex.mockReset().mockReturnValue([]);
    globalThis.$jabsEngine = { getJabsStatesByUuid: vi.fn(() => new Map()), forceMapAction: vi.fn() };
    globalThis.JABS_AiManager = { getBattlerByUuid: vi.fn() };
  });

  function buildBattler(overrides = {})
  {
    const battler = Object.create(globalThis.Game_Battler.prototype);
    battler.getUuid = vi.fn(() => 'uuid-1');
    battler.databaseData = vi.fn(() => ({ id: 'db' }));
    battler.states = vi.fn(() => []);
    return Object.assign(battler, overrides);
  }

  function buildShieldState(overrides = {})
  {
    return Object.assign({
      shield: {
        isBroken: vi.fn(() => false),
        getPriority: vi.fn(() => 0),
        getAppliedAt: vi.fn(() => 0),
        getCurrent: vi.fn(() => 0),
        getCap: vi.fn(() => 0),
      },
      stackCount: 1,
    }, overrides);
  }

  //region createJabsState
  describe('createJabsState', () =>
  {
    it('performs the original logic then attaches a shield resolved by state id', () =>
    {
      // Arrange
      const battler = buildBattler();
      const builder = { setShield: vi.fn() };
      originalCreateJabsState.mockReturnValue(builder);
      const shield = {};
      JABS_Shield_mock.fromStateId.mockReturnValue(shield);
      const target = {};
      const attacker = {};

      // Act
      const result = battler.createJabsState(target, 5, 10, 60, 1, attacker);

      // Assert
      expect(originalCreateJabsState).toHaveBeenCalledWith(target, 5, 10, 60, 1, attacker, null);
      expect(JABS_Shield_mock.fromStateId).toHaveBeenCalledWith(5, target);
      expect(builder.setShield).toHaveBeenCalledWith(shield);
      expect(result).toBe(builder);
    });

    it('forwards a provided sourceSkill instead of the default null', () =>
    {
      // Arrange
      const battler = buildBattler();
      originalCreateJabsState.mockReturnValue({ setShield: vi.fn() });
      const sourceSkill = { id: 99 };

      // Act
      battler.createJabsState({}, 5, 10, 60, 1, {}, sourceSkill);

      // Assert
      expect(originalCreateJabsState).toHaveBeenCalledWith({}, 5, 10, 60, 1, {}, sourceSkill);
    });
  });
  //endregion createJabsState

  //region getShieldStates
  describe('getShieldStates', () =>
  {
    it('excludes states with no shield model', () =>
    {
      // Arrange
      const battler = buildBattler();
      const stateWithoutShield = { shield: null };
      globalThis.$jabsEngine.getJabsStatesByUuid.mockReturnValue(new Map([ [ 'a', stateWithoutShield ] ]));

      // Act
      const result = battler.getShieldStates();

      // Assert
      expect(result).toEqual([]);
    });

    it('excludes states whose shield is broken', () =>
    {
      // Arrange
      const battler = buildBattler();
      const brokenState = buildShieldState({ shield: { isBroken: vi.fn(() => true) } });
      globalThis.$jabsEngine.getJabsStatesByUuid.mockReturnValue(new Map([ [ 'a', brokenState ] ]));

      // Act
      const result = battler.getShieldStates();

      // Assert
      expect(result).toEqual([]);
    });

    it('sorts remaining shield states by priority descending', () =>
    {
      // Arrange
      const battler = buildBattler();
      const low = buildShieldState({ shield: { isBroken: vi.fn(() => false), getPriority: vi.fn(() => 1), getAppliedAt: vi.fn(() => 0) } });
      const high = buildShieldState({ shield: { isBroken: vi.fn(() => false), getPriority: vi.fn(() => 5), getAppliedAt: vi.fn(() => 0) } });
      globalThis.$jabsEngine.getJabsStatesByUuid.mockReturnValue(new Map([ [ 'low', low ], [ 'high', high ] ]));

      // Act
      const result = battler.getShieldStates();

      // Assert
      expect(result).toEqual([ high, low ]);
    });

    it('breaks priority ties by earliest appliedAt first', () =>
    {
      // Arrange
      const battler = buildBattler();
      const later = buildShieldState({ shield: { isBroken: vi.fn(() => false), getPriority: vi.fn(() => 1), getAppliedAt: vi.fn(() => 100) } });
      const earlier = buildShieldState({ shield: { isBroken: vi.fn(() => false), getPriority: vi.fn(() => 1), getAppliedAt: vi.fn(() => 10) } });
      globalThis.$jabsEngine.getJabsStatesByUuid.mockReturnValue(new Map([ [ 'later', later ], [ 'earlier', earlier ] ]));

      // Act
      const result = battler.getShieldStates();

      // Assert
      expect(result).toEqual([ earlier, later ]);
    });

    it('treats a missing priority as zero when comparing', () =>
    {
      // Arrange
      const battler = buildBattler();
      const noPriority = buildShieldState({ shield: { isBroken: vi.fn(() => false), getPriority: vi.fn(() => 0), getAppliedAt: vi.fn(() => 0) } });
      const withPriority = buildShieldState({ shield: { isBroken: vi.fn(() => false), getPriority: vi.fn(() => 3), getAppliedAt: vi.fn(() => 0) } });
      globalThis.$jabsEngine.getJabsStatesByUuid.mockReturnValue(new Map([ [ 'a', noPriority ], [ 'b', withPriority ] ]));

      // Act
      const result = battler.getShieldStates();

      // Assert
      expect(result).toEqual([ withPriority, noPriority ]);
    });

    it('treats a missing priority as zero when comparing, with the falsy priority as the first comparator argument', () =>
    {
      // Arrange (insertion order flips which shield the sort comparator passes as `a`, ensuring
      // both aPri's and bPri's `|| 0` fallback are independently exercised)
      const battler = buildBattler();
      const withPriority = buildShieldState({ shield: { isBroken: vi.fn(() => false), getPriority: vi.fn(() => 3), getAppliedAt: vi.fn(() => 0) } });
      const noPriority = buildShieldState({ shield: { isBroken: vi.fn(() => false), getPriority: vi.fn(() => 0), getAppliedAt: vi.fn(() => 0) } });
      globalThis.$jabsEngine.getJabsStatesByUuid.mockReturnValue(new Map([ [ 'a', withPriority ], [ 'b', noPriority ] ]));

      // Act
      const result = battler.getShieldStates();

      // Assert
      expect(result).toEqual([ withPriority, noPriority ]);
    });
  });
  //endregion getShieldStates

  //region currentShieldState / value / cap / stacks
  describe('currentShieldState', () =>
  {
    it('returns null when there are no shield states', () =>
    {
      // Arrange
      const battler = buildBattler();
      vi.spyOn(battler, 'getShieldStates').mockReturnValue([]);

      // Act/Assert
      expect(battler.currentShieldState()).toBeNull();
    });

    it('returns the highest priority (first) shield state', () =>
    {
      // Arrange
      const battler = buildBattler();
      const top = buildShieldState();
      vi.spyOn(battler, 'getShieldStates').mockReturnValue([ top, buildShieldState() ]);

      // Act/Assert
      expect(battler.currentShieldState()).toBe(top);
    });
  });

  describe('currentShieldValue', () =>
  {
    it('returns 0 when there is no current shield state', () =>
    {
      // Arrange
      const battler = buildBattler();
      vi.spyOn(battler, 'currentShieldState').mockReturnValue(null);

      // Act/Assert
      expect(battler.currentShieldValue()).toEqual(0);
    });

    it("returns the current shield's value", () =>
    {
      // Arrange
      const battler = buildBattler();
      const state = buildShieldState({ shield: { getCurrent: vi.fn(() => 77) } });
      vi.spyOn(battler, 'currentShieldState').mockReturnValue(state);

      // Act/Assert
      expect(battler.currentShieldValue()).toEqual(77);
    });
  });

  describe('currentShieldCap', () =>
  {
    it('returns 0 when there is no current shield state', () =>
    {
      // Arrange
      const battler = buildBattler();
      vi.spyOn(battler, 'currentShieldState').mockReturnValue(null);

      // Act/Assert
      expect(battler.currentShieldCap()).toEqual(0);
    });

    it("returns the current shield's cap", () =>
    {
      // Arrange
      const battler = buildBattler();
      const state = buildShieldState({ shield: { getCap: vi.fn(() => 88) } });
      vi.spyOn(battler, 'currentShieldState').mockReturnValue(state);

      // Act/Assert
      expect(battler.currentShieldCap()).toEqual(88);
    });
  });

  describe('currentShieldStacks', () =>
  {
    it('returns 0 when there is no current shield state', () =>
    {
      // Arrange
      const battler = buildBattler();
      vi.spyOn(battler, 'currentShieldState').mockReturnValue(null);

      // Act/Assert
      expect(battler.currentShieldStacks()).toEqual(0);
    });

    it('returns the current stack count', () =>
    {
      // Arrange
      const battler = buildBattler();
      const state = buildShieldState({ stackCount: 3 });
      vi.spyOn(battler, 'currentShieldState').mockReturnValue(state);

      // Act/Assert
      expect(battler.currentShieldStacks()).toEqual(3);
    });
  });
  //endregion currentShieldState / value / cap / stacks

  //region onShieldBreak
  describe('onShieldBreak', () =>
  {
    it('stores the break value then clears it when there is no JABS caster for this battler', () =>
    {
      // Arrange
      const battler = buildBattler();
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(null);

      // Act
      battler.onShieldBreak(50);

      // Assert
      expect(battler.lastShieldBreakValue).toEqual(0);
      expect(globalThis.$jabsEngine.forceMapAction).not.toHaveBeenCalled();
    });

    it('defaults the break value to 0 when not provided', () =>
    {
      // Arrange
      const battler = buildBattler();
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(null);

      // Act
      battler.onShieldBreak();

      // Assert
      expect(battler.lastShieldBreakValue).toEqual(0);
    });

    it('clears the break value and does not fire skills when no shield-break skill ids are found', () =>
    {
      // Arrange
      const battler = buildBattler();
      const caster = {};
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(caster);
      globalThis.RPGManager.getArrayFromNotesByRegex.mockReturnValue([]);

      // Act
      battler.onShieldBreak(50);

      // Assert
      expect(battler.lastShieldBreakValue).toEqual(0);
      expect(globalThis.$jabsEngine.forceMapAction).not.toHaveBeenCalled();
    });

    it('pulls shield break skills from every source it is handed', () =>
    {
      // Arrange- shieldBreakSources() is contractually non-null, so every entry is queried.
      const databaseData = { id: 7 };
      const battler = buildBattler({ databaseData: vi.fn(() => databaseData), states: vi.fn(() => [ { id: 1 } ]) });
      const caster = {};
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(caster);

      // Act
      battler.onShieldBreak(50);

      // Assert
      expect(globalThis.RPGManager.getArrayFromNotesByRegex).toHaveBeenCalledTimes(2);
      expect(globalThis.RPGManager.getArrayFromNotesByRegex).toHaveBeenCalledWith(databaseData, globalThis.J.ABS.EXT.SHIELD.RegExp.Break, true);
      expect(globalThis.RPGManager.getArrayFromNotesByRegex).toHaveBeenCalledWith({ id: 1 }, globalThis.J.ABS.EXT.SHIELD.RegExp.Break, true);
    });

    it('fires every discovered shield-break skill against the caster then clears the stored value', () =>
    {
      // Arrange
      const battler = buildBattler({ states: vi.fn(() => [ { id: 1 } ]) });
      const caster = {};
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(caster);
      globalThis.RPGManager.getArrayFromNotesByRegex.mockReturnValue([ 10, 11 ]);

      // Act
      battler.onShieldBreak(50);

      // Assert
      expect(globalThis.$jabsEngine.forceMapAction).toHaveBeenCalledWith(caster, 10, true);
      expect(globalThis.$jabsEngine.forceMapAction).toHaveBeenCalledWith(caster, 11, true);
      expect(battler.lastShieldBreakValue).toEqual(0);
    });
  });
  //endregion onShieldBreak

  describe('shieldBreakSources', () =>
  {
    it('combines the database data and all current states into a single array', () =>
    {
      // Arrange
      const dbData = { id: 'db' };
      const stateA = { id: 'a' };
      const stateB = { id: 'b' };
      const battler = buildBattler({ databaseData: vi.fn(() => dbData), states: vi.fn(() => [ stateA, stateB ]) });

      // Act/Assert
      expect(battler.shieldBreakSources()).toEqual([ dbData, stateA, stateB ]);
    });
  });
});
//endregion plugins/abs/ext/shield/objects/_game-battler.test.js
