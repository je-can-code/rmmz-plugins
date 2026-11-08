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

  /** @type {object} the options instance every fake action options builder hands back. */
  let actionOptions;

  /** @type {object} the fake action options builder, so tests can see how the options were built. */
  let actionOptionsBuilder;

  beforeEach(() =>
  {
    originalCreateJabsState.mockClear();
    JABS_Shield_mock.fromStateId.mockReset();
    globalThis.RPGManager.getArrayFromNotesByRegex.mockReset().mockReturnValue([]);
    globalThis.$jabsEngine = {
      getJabsStatesByUuid: vi.fn(() => new Map()),
      canExecuteMapActions: vi.fn(() => true),
      executeMapAction: vi.fn(),
    };
    globalThis.JABS_AiManager = { getBattlerByUuid: vi.fn() };
    actionOptions = { id: 'options' };
    actionOptionsBuilder = { setIsRetaliation: vi.fn(() => actionOptionsBuilder), build: vi.fn(() => actionOptions) };
    globalThis.JABS_ActionOptions = { Builder: vi.fn(() => actionOptionsBuilder) };
  });

  function buildBattler(overrides = {})
  {
    const battler = Object.create(globalThis.Game_Battler.prototype);
    battler.getUuid = vi.fn(() => 'uuid-1');
    battler.databaseData = vi.fn(() => ({ id: 'db' }));
    battler.states = vi.fn(() => []);
    battler.allStates = vi.fn(() => []);
    return Object.assign(battler, overrides);
  }

  function buildJabsAction()
  {
    const gameAction = { setShieldBreakValue: vi.fn() };
    return { getAction: vi.fn(() => gameAction), gameAction };
  }

  function buildCaster(actions = [ buildJabsAction() ])
  {
    return { createJabsActionFromSkill: vi.fn(() => actions), actions };
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
      // the two battlers carry different shapes on purpose- deep equality would otherwise let the
      // target stand in for the attacker and the argument order would go unpinned.
      const target = { def: 12 };
      const attacker = { atk: 40 };

      // Act
      const result = battler.createJabsState(target, 5, 10, 60, 1, attacker);

      // Assert- the attacker rides along as the `a` binding for the shield point formulas.
      expect(originalCreateJabsState).toHaveBeenCalledWith(target, 5, 10, 60, 1, attacker, null);
      expect(JABS_Shield_mock.fromStateId).toHaveBeenCalledWith(5, target, attacker);
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

    it('sorts by priority descending when the higher priority state is inserted first', () =>
    {
      // Arrange (insertion order decides which shield the comparator receives as `b`; with the
      // higher priority inserted first, `bPri` is the operand carrying the whole comparison)
      const battler = buildBattler();
      const high = buildShieldState({ shield: { isBroken: vi.fn(() => false), getPriority: vi.fn(() => 5), getAppliedAt: vi.fn(() => 0) } });
      const low = buildShieldState({ shield: { isBroken: vi.fn(() => false), getPriority: vi.fn(() => 1), getAppliedAt: vi.fn(() => 0) } });
      globalThis.$jabsEngine.getJabsStatesByUuid.mockReturnValue(new Map([ [ 'high', high ], [ 'low', low ] ]));

      // Act
      const result = battler.getShieldStates();

      // Assert
      expect(result).toEqual([ high, low ]);
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
    it('reads no sources and fires nothing when there is no JABS caster for this battler', () =>
    {
      // Arrange (break skills are present, so the missing caster is the only thing that can stop
      // them from firing)
      const battler = buildBattler({ allStates: vi.fn(() => [ { id: 1 } ]) });
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(null);
      globalThis.RPGManager.getArrayFromNotesByRegex.mockReturnValue([ 10, 11 ]);

      // Act
      battler.onShieldBreak(50);

      // Assert
      expect(globalThis.RPGManager.getArrayFromNotesByRegex).not.toHaveBeenCalled();
      expect(globalThis.$jabsEngine.executeMapAction).not.toHaveBeenCalled();
    });

    it('builds nothing when no source carries a shield-break skill', () =>
    {
      // Arrange
      const battler = buildBattler({ allStates: vi.fn(() => [ { id: 1 } ]) });
      const caster = buildCaster();
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(caster);
      globalThis.RPGManager.getArrayFromNotesByRegex.mockReturnValue([]);

      // Act
      battler.onShieldBreak(50);

      // Assert
      expect(globalThis.RPGManager.getArrayFromNotesByRegex).toHaveBeenCalledTimes(2);
      expect(caster.createJabsActionFromSkill).not.toHaveBeenCalled();
    });

    it('pulls shield break skills from every source it is handed', () =>
    {
      // Arrange- shieldBreakSources() is contractually non-null, so every entry is queried.
      const databaseData = { id: 7 };
      const battler = buildBattler({ databaseData: vi.fn(() => databaseData), allStates: vi.fn(() => [ { id: 1 } ]) });
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(buildCaster());

      // Act
      battler.onShieldBreak(50);

      // Assert
      expect(globalThis.RPGManager.getArrayFromNotesByRegex).toHaveBeenCalledTimes(2);
      expect(globalThis.RPGManager.getArrayFromNotesByRegex).toHaveBeenCalledWith(databaseData, globalThis.J.ABS.EXT.SHIELD.RegExp.Break);
      expect(globalThis.RPGManager.getArrayFromNotesByRegex).toHaveBeenCalledWith({ id: 1 }, globalThis.J.ABS.EXT.SHIELD.RegExp.Break);
    });

    it('fires every discovered shield-break skill from the caster, each carrying the broken shield cap', () =>
    {
      // Arrange- each source names its own skill, so each id must fire exactly once.
      const battler = buildBattler({
        databaseData: vi.fn(() => ({ id: 'db', breakIds: [ 10 ] })),
        allStates: vi.fn(() => [ { id: 1, breakIds: [ 11 ] } ]),
      });
      const caster = buildCaster();
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(caster);
      globalThis.RPGManager.getArrayFromNotesByRegex.mockImplementation(source => source.breakIds);

      // Act
      battler.onShieldBreak(50);

      // Assert
      expect(caster.createJabsActionFromSkill).toHaveBeenCalledTimes(2);
      expect(caster.createJabsActionFromSkill).toHaveBeenCalledWith(10, actionOptions);
      expect(caster.createJabsActionFromSkill).toHaveBeenCalledWith(11, actionOptions);
      expect(caster.actions[0].gameAction.setShieldBreakValue).toHaveBeenCalledTimes(2);
      expect(caster.actions[0].gameAction.setShieldBreakValue).toHaveBeenCalledWith(50);
    });

    it('hands the break skills a cap of 0 when no break value is provided', () =>
    {
      // Arrange
      const battler = buildBattler({ allStates: vi.fn(() => [ { id: 1 } ]) });
      const caster = buildCaster();
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(caster);
      globalThis.RPGManager.getArrayFromNotesByRegex.mockImplementation(source => (source.id === 1 ? [ 10 ] : []));

      // Act
      battler.onShieldBreak();

      // Assert
      expect(caster.actions[0].gameAction.setShieldBreakValue).toHaveBeenCalledWith(0);
    });
  });
  //endregion onShieldBreak

  //region fireShieldBreakSkill
  describe('fireShieldBreakSkill', () =>
  {
    it('builds the break skill as a retaliation from the caster', () =>
    {
      // Arrange
      const battler = buildBattler();
      const caster = buildCaster();

      // Act
      battler.fireShieldBreakSkill(caster, 12, 240);

      // Assert
      expect(actionOptionsBuilder.setIsRetaliation).toHaveBeenCalledWith(true);
      expect(caster.createJabsActionFromSkill).toHaveBeenCalledWith(12, actionOptions);
    });

    it('writes the broken shield cap onto every action the skill builds', () =>
    {
      // Arrange
      const battler = buildBattler();
      const caster = buildCaster([ buildJabsAction(), buildJabsAction() ]);

      // Act
      battler.fireShieldBreakSkill(caster, 12, 240);

      // Assert
      expect(caster.actions[0].gameAction.setShieldBreakValue).toHaveBeenCalledWith(240);
      expect(caster.actions[1].gameAction.setShieldBreakValue).toHaveBeenCalledWith(240);
    });

    it('executes every action from the caster with no target coordinates', () =>
    {
      // Arrange
      const battler = buildBattler();
      const caster = buildCaster([ buildJabsAction(), buildJabsAction() ]);

      // Act
      battler.fireShieldBreakSkill(caster, 12, 240);

      // Assert
      expect(globalThis.$jabsEngine.canExecuteMapActions).toHaveBeenCalledWith(caster, caster.actions);
      expect(globalThis.$jabsEngine.executeMapAction).toHaveBeenCalledTimes(2);
      expect(globalThis.$jabsEngine.executeMapAction).toHaveBeenCalledWith(caster, caster.actions[0], null, null);
      expect(globalThis.$jabsEngine.executeMapAction).toHaveBeenCalledWith(caster, caster.actions[1], null, null);
    });

    it('executes nothing when the engine will not execute the actions', () =>
    {
      // Arrange- the skill built a real action, so the engine's refusal is the only thing stopping it.
      const battler = buildBattler();
      const caster = buildCaster();
      globalThis.$jabsEngine.canExecuteMapActions.mockReturnValue(false);

      // Act
      battler.fireShieldBreakSkill(caster, 12, 240);

      // Assert
      expect(globalThis.$jabsEngine.executeMapAction).not.toHaveBeenCalled();
    });
  });
  //endregion fireShieldBreakSkill

  describe('shieldBreakSources', () =>
  {
    it('combines the database data and every state, passives included, into a single array', () =>
    {
      // Arrange- the applied states alone hold only stateA, so the passive is only found through allStates.
      const dbData = { id: 'db' };
      const stateA = { id: 'a' };
      const passiveB = { id: 'b' };
      const battler = buildBattler({
        databaseData: vi.fn(() => dbData),
        states: vi.fn(() => [ stateA ]),
        allStates: vi.fn(() => [ stateA, passiveB ]),
      });

      // Act/Assert
      expect(battler.shieldBreakSources()).toEqual([ dbData, stateA, passiveB ]);
    });
  });
});
//endregion plugins/abs/ext/shield/objects/_game-battler.test.js
