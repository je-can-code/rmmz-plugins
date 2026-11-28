//region plugins/passive/ext/conditional/managers/auto-apply-state-on-nearby-manager.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildFateBattlerStub, installJabsFate } from '../../../../_base/core/_component/fixtures/install-jabs-fate.js';

describe('AutoApplyStateOnNearbyManager (direct src import)', () =>
{
  let AutoApplyStateOnNearbyManager;
  let FakePassiveRuleJabsAccess;

  /** @type {Function|undefined} */
  let originalRandomInt;

  beforeAll(async () =>
  {
    vi.resetModules();

    FakePassiveRuleJabsAccess = {
      nearbyEnemies: vi.fn().mockReturnValue([]),
      nearbyAlliesExcludingSelf: vi.fn().mockReturnValue([]),
    };
    vi.doMock('../../../../../../src/plugins/passive/ext/conditional/helpers/PassiveRuleJabsAccess.js', () => ({ default: FakePassiveRuleJabsAccess }));

    class FakeAutoRuleManager
    {
      static buildRuleKey(source, tupleIndex, id, condition)
      {
        return `${source.constructor.name}:${source.id}:${tupleIndex}:${id}:${condition}`;
      }

      static nearbyBattlersForKind(battler, kind, triggerTiles)
      {
        return (kind === 'enemiesNearby' || kind === 'enemiesNearbyBelow')
          ? FakePassiveRuleJabsAccess.nearbyEnemies(battler, triggerTiles)
          : FakePassiveRuleJabsAccess.nearbyAlliesExcludingSelf(battler);
      }

      static proximityGatePasses(nearbyCount, minCount, kind)
      {
        if (kind === 'enemiesNearbyBelow' || kind === 'alliesNearbyBelow') return nearbyCount < minCount;

        return nearbyCount >= minCount;
      }
    }
    vi.doMock('../../../../../../src/plugins/passive/ext/conditional/managers/AutoRuleManager.js', () => ({ default: FakeAutoRuleManager }));

    // the aura rolls through J-ABS's shared state roll, the real one, which reads RPGManager as a bare global.
    ({ default: globalThis.RPGManager } = await import('../../../../../../src/plugins/_base/core/managers/RPGManager.js'));
    installJabsFate();

    ({ default: AutoApplyStateOnNearbyManager } = await import('../../../../../../src/plugins/passive/ext/conditional/managers/AutoApplyStateOnNearbyManager.js'));
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.Graphics = { frameCount: 1000 };

    // every die lands on 1 unless a test pins its own faces, so any roll with a chance above nothing lands.
    originalRandomInt = Math.randomInt;
    Math.randomInt = () => 0;
  });

  afterEach(() =>
  {
    Math.randomInt = originalRandomInt;
  });

  /**
   * Builds a battler stand-in that answers the shared roll neutrally unless told otherwise- no resistance, no luck gap,
   * no fate, every state read as help- takes any state, and has never pulsed a rule.
   * @param {object} [overrides] Members to replace on the stand-in.
   * @returns {object}
   */
  function makeBattler(overrides = {})
  {
    return buildFateBattlerStub({
      isStateAddable: vi.fn().mockReturnValue(true),
      addState: vi.fn(),
      getAutoRuleLastFrame: vi.fn().mockReturnValue(0),
      setAutoRuleLastFrame: vi.fn(),
      ...overrides,
    });
  }

  /**
   * A target resisting every state by half through State Rate and by a quarter through its type, with 50 LUK, reading
   * every state as harm so luck weighs in: against a bearer with 110 LUK, the aura's full 100% becomes
   * 100 x 0.5 x 0.75 x 1.06 = 39.75, rolled against as 40. Rolled by the target itself instead, the luck would fall
   * away and leave 37.5, rolled against as 38.
   * @param {object} [overrides] Members to replace on the stand-in.
   * @returns {object}
   */
  function makeResistantTarget(overrides = {})
  {
    return makeBattler({
      luk: 50,
      stateRate: () => 0.5,
      stateTypeResistRate: () => 0.75,
      state: stateId => ({ id: stateId, isNegativeType: () => true, isImmuneToFate: () => false }),
      ...overrides,
    });
  }

  /**
   * Pins the dice to the given faces, in order; each face is what one roll reads, from 1 to 100. A roll past the last
   * pinned face throws, so a test can never quietly roll more dice than it accounted for.
   * @param {number[]} faces The faces to land on.
   */
  function rollDice(faces)
  {
    const remaining = [ ...faces ];
    Math.randomInt = () =>
    {
      if (remaining.length === 0) throw new Error('rolled more dice than the test pinned');
      return remaining.shift() - 1;
    };
  }

  describe('rulesProperty', () =>
  {
    it('exposes the autoApplyStateOnNearbyRules property name', () =>
    {
      // Arrange/Act/Assert
      expect(AutoApplyStateOnNearbyManager.rulesProperty).toEqual('autoApplyStateOnNearbyRules');
    });
  });

  describe('dispatch', () =>
  {
    /**
     * A target carrying two curses that reads state 60 as negative and state 61 as anything else, so one target
     * answers both ways and only the state handed to it decides which side of the roll its curse weighs on.
     * @returns {object}
     */
    function makeCursedTarget()
    {
      return makeBattler({
        getNegativeRolls: () => 2,
        state: stateId => ({ id: stateId, isNegativeType: () => stateId === 60, isImmuneToFate: () => false }),
      });
    }

    /**
     * A bearer with one lucky roll and three cursed rolls of its own, battler-wide, beside skill-scoped totals an aura
     * never reads, having no skill to read them for.
     * @returns {object}
     */
    function makeFatedBearer()
    {
      return makeBattler({
        getPositiveRolls: () => 1,
        getNegativeRolls: () => 3,
        getPositiveRollsForSkill: () => 7,
        getNegativeRollsForSkill: () => 8,
      });
    }

    it('neither rolls for nor applies a state the target cannot take', () =>
    {
      // Arrange- this target is otherwise neutral, so a roll made anyway would land on the default die.
      const target = makeBattler({ isStateAddable: vi.fn().mockReturnValue(false) });
      const bearer = makeBattler();
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount');

      // Act
      const result = AutoApplyStateOnNearbyManager.dispatch(target, 5, bearer);

      // Assert
      expect(result).toBe(false);
      expect(procSpy).not.toHaveBeenCalled();
      expect(target.addState).not.toHaveBeenCalled();

      // spies on the bare-global RPGManager leak into later tests in this file, so restore by hand.
      procSpy.mockRestore();
    });

    it('applies the state once per landing, with the target as its own nominal source', () =>
    {
      // Arrange- the die lands exactly on the 40 the target's resistances and the bearer's luck leave.
      const target = makeResistantTarget();
      const bearer = makeBattler({ luk: 110 });
      rollDice([ 40 ]);

      // Act
      const result = AutoApplyStateOnNearbyManager.dispatch(target, 5, bearer);

      // Assert
      expect(result).toBe(true);
      expect(target.addState.mock.calls).toEqual([ [ 5, target ] ]);
    });

    it('reports the state as rolled for when the roll misses', () =>
    {
      // Arrange- the die lands one past the 40 the target's resistances and the bearer's luck leave.
      const target = makeResistantTarget();
      const bearer = makeBattler({ luk: 110 });
      rollDice([ 41 ]);

      // Act
      const result = AutoApplyStateOnNearbyManager.dispatch(target, 5, bearer);

      // Assert
      expect(result).toBe(true);
      expect(target.addState).not.toHaveBeenCalled();
    });

    it('counts the target\'s curse as more chances to land when the state is negative', () =>
    {
      // Arrange
      const target = makeCursedTarget();
      const bearer = makeFatedBearer();
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount');

      // Act
      AutoApplyStateOnNearbyManager.dispatch(target, 60, bearer);

      // Assert- the bearer's own chance and its one lucky roll, plus the target's two curses; the bearer's own three
      // curses stay hurdles.
      expect(procSpy).toHaveBeenCalledWith(bearer, 100, 4, 3);

      // spies on the bare-global RPGManager leak into later tests in this file, so restore by hand.
      procSpy.mockRestore();
    });

    it('counts the target\'s curse as more hurdles to clear when the state is not negative', () =>
    {
      // Arrange
      const target = makeCursedTarget();
      const bearer = makeFatedBearer();
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount');

      // Act
      AutoApplyStateOnNearbyManager.dispatch(target, 61, bearer);

      // Assert- the bearer's own chance and its one lucky roll; its three curses and the target's two are all hurdles.
      expect(procSpy).toHaveBeenCalledWith(bearer, 100, 2, 5);

      // spies on the bare-global RPGManager leak into later tests in this file, so restore by hand.
      procSpy.mockRestore();
    });
  });

  describe('_tryDispatchProximityRule', () =>
  {
    it('skips when the minimum-count tuple field is not a valid positive number', () =>
    {
      // Arrange- a target is genuinely in range, so a threshold of zero would otherwise sail
      // through the gate (any count is >= 0) and pulse the state onto them.
      const battler = makeBattler();
      const source = { constructor: { name: 'RPG_State' }, id: 1 };
      const nearbyTarget = makeBattler();
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([ { getBattler: () => nearbyTarget } ]);

      // Act
      AutoApplyStateOnNearbyManager._tryDispatchProximityRule(
        battler, source, 0, 5, 'enemiesNearby', [ 5, 'enemiesNearby', 0, 60 ],
      );

      // Assert
      expect(nearbyTarget.addState).not.toHaveBeenCalled();
      expect(battler.setAutoRuleLastFrame).not.toHaveBeenCalled();
    });

    it('skips when the cooldown tuple field is invalid', () =>
    {
      // Arrange- the count gate passes and the rule has never fired, so the invalid cooldown is
      // the only thing left that can stop this pulse.
      const battler = makeBattler();
      const source = { constructor: { name: 'RPG_State' }, id: 1 };
      const nearbyTarget = makeBattler();
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([ { getBattler: () => nearbyTarget } ]);

      // Act
      AutoApplyStateOnNearbyManager._tryDispatchProximityRule(
        battler, source, 0, 5, 'enemiesNearby', [ 5, 'enemiesNearby', 1, -1 ],
      );

      // Assert
      expect(nearbyTarget.addState).not.toHaveBeenCalled();
      expect(battler.setAutoRuleLastFrame).not.toHaveBeenCalled();
    });

    it('does nothing when fewer nearby battlers are found than the required minimum', () =>
    {
      // Arrange- two enemies are in range against a threshold of three, so the target set is
      // populated and only the count gate stands between them and the state.
      const battler = makeBattler();
      const source = { constructor: { name: 'RPG_State' }, id: 1 };
      const firstTarget = makeBattler();
      const secondTarget = makeBattler();
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([
        { getBattler: () => firstTarget },
        { getBattler: () => secondTarget },
      ]);

      // Act
      AutoApplyStateOnNearbyManager._tryDispatchProximityRule(
        battler, source, 0, 5, 'enemiesNearby', [ 5, 'enemiesNearby', 3, 60 ],
      );

      // Assert
      expect(firstTarget.addState).not.toHaveBeenCalled();
      expect(secondTarget.addState).not.toHaveBeenCalled();
      expect(battler.setAutoRuleLastFrame).not.toHaveBeenCalled();
    });

    it('does nothing when the cooldown window has not yet elapsed', () =>
    {
      // Arrange
      const battler = makeBattler({ getAutoRuleLastFrame: vi.fn().mockReturnValue(990) });
      const source = { constructor: { name: 'RPG_State' }, id: 1 };
      const nearbyTarget = makeBattler();
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([ { getBattler: () => nearbyTarget } ]);

      // Act
      AutoApplyStateOnNearbyManager._tryDispatchProximityRule(
        battler, source, 0, 5, 'enemiesNearby', [ 5, 'enemiesNearby', 1, 60 ],
      );

      // Assert
      expect(nearbyTarget.addState).not.toHaveBeenCalled();
    });

    it('pulses immediately when the rule has never fired, even inside its first cooldown window', () =>
    {
      // Arrange- only thirty frames have elapsed since boot against a sixty-frame cooldown, so a
      // rule that treated "never fired" as "fired on frame zero" would refuse this first pulse.
      globalThis.Graphics = { frameCount: 30 };
      const battler = makeBattler();
      const source = { constructor: { name: 'RPG_State' }, id: 1 };
      const nearbyTarget = makeBattler();
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([ { getBattler: () => nearbyTarget } ]);

      // Act
      AutoApplyStateOnNearbyManager._tryDispatchProximityRule(
        battler, source, 0, 5, 'enemiesNearby', [ 5, 'enemiesNearby', 1, 60 ],
      );

      // Assert
      expect(nearbyTarget.addState).toHaveBeenCalledWith(5, nearbyTarget);
      expect(battler.setAutoRuleLastFrame).toHaveBeenCalledWith(expect.any(String), 30);
    });

    it('pulses again once the cooldown window has fully elapsed', () =>
    {
      // Arrange- the rule last fired on frame 900 and it is now frame 1000, comfortably past the
      // sixty-frame window, so the pulse is due again.
      const battler = makeBattler({ getAutoRuleLastFrame: vi.fn().mockReturnValue(900) });
      const source = { constructor: { name: 'RPG_State' }, id: 1 };
      const nearbyTarget = makeBattler();
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([ { getBattler: () => nearbyTarget } ]);

      // Act
      AutoApplyStateOnNearbyManager._tryDispatchProximityRule(
        battler, source, 0, 5, 'enemiesNearby', [ 5, 'enemiesNearby', 1, 60 ],
      );

      // Assert
      expect(nearbyTarget.addState).toHaveBeenCalledWith(5, nearbyTarget);
      expect(battler.setAutoRuleLastFrame).toHaveBeenCalledWith(expect.any(String), 1000);
    });

    it('rolls each nearby enemy at the aura\'s full strength with the bearer rolling, and stamps the cooldown', () =>
    {
      // Arrange- the bearer's 110 LUK meets a resistant target's 50, leaving 40; the die lands on it.
      const battler = makeBattler({ luk: 110 });
      const source = { constructor: { name: 'RPG_State' }, id: 1 };
      const nearbyTarget = makeResistantTarget();
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([ { getBattler: () => nearbyTarget } ]);
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount');
      rollDice([ 40 ]);

      // Act
      AutoApplyStateOnNearbyManager._tryDispatchProximityRule(
        battler, source, 0, 5, 'enemiesNearby', [ 5, 'enemiesNearby', 1, 60 ],
      );

      // Assert
      expect(procSpy).toHaveBeenCalledWith(battler, 40, 1, 0);
      expect(nearbyTarget.addState.mock.calls).toEqual([ [ 5, nearbyTarget ] ]);
      expect(battler.setAutoRuleLastFrame).toHaveBeenCalledWith(expect.any(String), 1000);

      // spies on the bare-global RPGManager leak into later tests in this file, so restore by hand.
      procSpy.mockRestore();
    });

    it('stamps the cooldown when the roll misses, even beside a target that cannot take the state', () =>
    {
      // Arrange- the first target is rolled for and the die clears its 40 by one; the second cannot take the state
      // at all and is never rolled for, so it comes last, where it would have the last word on the stamp.
      const battler = makeBattler({ luk: 110 });
      const source = { constructor: { name: 'RPG_State' }, id: 1 };
      const missedTarget = makeResistantTarget();
      const unaddableTarget = makeBattler({ isStateAddable: vi.fn().mockReturnValue(false) });
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([
        { getBattler: () => missedTarget },
        { getBattler: () => unaddableTarget },
      ]);
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount');
      rollDice([ 41 ]);

      // Act
      AutoApplyStateOnNearbyManager._tryDispatchProximityRule(
        battler, source, 0, 5, 'enemiesNearby', [ 5, 'enemiesNearby', 1, 60 ],
      );

      // Assert
      expect(procSpy).toHaveBeenCalledTimes(1);
      expect(missedTarget.addState).not.toHaveBeenCalled();
      expect(unaddableTarget.addState).not.toHaveBeenCalled();
      expect(battler.setAutoRuleLastFrame).toHaveBeenCalledWith(expect.any(String), 1000);

      // spies on the bare-global RPGManager leak into later tests in this file, so restore by hand.
      procSpy.mockRestore();
    });

    it('does not stamp the cooldown when every nearby target rejects the state', () =>
    {
      // Arrange- the target is otherwise neutral, so a roll made anyway would land on the default die.
      const battler = makeBattler();
      const source = { constructor: { name: 'RPG_State' }, id: 1 };
      const nearbyTarget = makeBattler({ isStateAddable: vi.fn().mockReturnValue(false) });
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([ { getBattler: () => nearbyTarget } ]);
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount');

      // Act
      AutoApplyStateOnNearbyManager._tryDispatchProximityRule(
        battler, source, 0, 5, 'enemiesNearby', [ 5, 'enemiesNearby', 1, 60 ],
      );

      // Assert
      expect(procSpy).not.toHaveBeenCalled();
      expect(nearbyTarget.addState).not.toHaveBeenCalled();
      expect(battler.setAutoRuleLastFrame).not.toHaveBeenCalled();

      // spies on the bare-global RPGManager leak into later tests in this file, so restore by hand.
      procSpy.mockRestore();
    });

    it('lands the state once for every roll an Accumulating bearer lands in one pulse', () =>
    {
      // Arrange- an Accumulating bearer with two lucky rolls rolls all three of its chances against the 50 a
      // target's half State Rate leaves, and two of the three dice land.
      const battler = makeBattler({ isAccumulating: () => true, getPositiveRolls: () => 2 });
      const source = { constructor: { name: 'RPG_State' }, id: 1 };
      const nearbyTarget = makeBattler({ stateRate: () => 0.5 });
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([ { getBattler: () => nearbyTarget } ]);
      rollDice([ 10, 90, 50 ]);

      // Act
      AutoApplyStateOnNearbyManager._tryDispatchProximityRule(
        battler, source, 0, 5, 'enemiesNearby', [ 5, 'enemiesNearby', 1, 60 ],
      );

      // Assert
      expect(nearbyTarget.addState.mock.calls).toEqual([ [ 5, nearbyTarget ], [ 5, nearbyTarget ] ]);
      expect(battler.setAutoRuleLastFrame).toHaveBeenCalledWith(expect.any(String), 1000);
    });

    it('uses alliesNearby (excluding self) for the alliesNearby condition kind', () =>
    {
      // Arrange
      const battler = makeBattler();
      const source = { constructor: { name: 'RPG_State' }, id: 1 };
      const nearbyAlly = makeBattler();
      FakePassiveRuleJabsAccess.nearbyAlliesExcludingSelf.mockReturnValue([ { getBattler: () => nearbyAlly } ]);

      // Act
      AutoApplyStateOnNearbyManager._tryDispatchProximityRule(
        battler, source, 0, 5, 'alliesNearby', [ 5, 'alliesNearby', 1, 60 ],
      );

      // Assert
      expect(FakePassiveRuleJabsAccess.nearbyAlliesExcludingSelf).toHaveBeenCalledWith(battler);
      expect(nearbyAlly.addState).toHaveBeenCalled();
    });

    it('skips a nearby jabs target whose underlying battler cannot be resolved', () =>
    {
      // Arrange
      const battler = makeBattler();
      const source = { constructor: { name: 'RPG_State' }, id: 1 };
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([ { getBattler: () => null } ]);

      // Act/Assert (no throw)
      expect(() => AutoApplyStateOnNearbyManager._tryDispatchProximityRule(
        battler, source, 0, 5, 'enemiesNearby', [ 5, 'enemiesNearby', 1, 60 ],
      )).not.toThrow();
      expect(battler.setAutoRuleLastFrame).not.toHaveBeenCalled();
    });

    it('passes the explicit trigger radius through to nearbyEnemies when the tuple has a 5th field', () =>
    {
      // Arrange
      const battler = makeBattler();
      const source = { constructor: { name: 'RPG_State' }, id: 1 };
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([]);

      // Act
      AutoApplyStateOnNearbyManager._tryDispatchProximityRule(
        battler, source, 0, 5, 'enemiesNearby', [ 5, 'enemiesNearby', 1, 60, 3 ],
      );

      // Assert
      expect(FakePassiveRuleJabsAccess.nearbyEnemies).toHaveBeenCalledWith(battler, 3);
    });

    it('falls back to the default radius when the authored trigger radius is not a number', () =>
    {
      // Arrange- a five-field tuple whose radius is garbage must be treated exactly like a
      // four-field tuple: null, meaning "use the plugin default", never NaN tiles.
      const battler = makeBattler();
      const source = { constructor: { name: 'RPG_State' }, id: 1 };
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([]);

      // Act
      AutoApplyStateOnNearbyManager._tryDispatchProximityRule(
        battler, source, 0, 5, 'enemiesNearby', [ 5, 'enemiesNearby', 1, 60, 'three' ],
      );

      // Assert
      expect(FakePassiveRuleJabsAccess.nearbyEnemies).toHaveBeenCalledWith(battler, null);
    });

    it('dispatches enemiesNearbyBelow onto the straggler still under the threshold', () =>
    {
      // Arrange
      const battler = makeBattler();
      const source = { constructor: { name: 'RPG_State' }, id: 1 };
      const straggler = makeBattler();
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([ { getBattler: () => straggler } ]);

      // Act
      AutoApplyStateOnNearbyManager._tryDispatchProximityRule(
        battler, source, 0, 5, 'enemiesNearbyBelow', [ 5, 'enemiesNearbyBelow', 2, 60 ],
      );

      // Assert
      expect(straggler.addState).toHaveBeenCalledWith(5, straggler);
    });

    it('gate-passes but applies to nobody when enemiesNearbyBelow requires zero targets', () =>
    {
      // Arrange — threshold of 1 only passes at zero nearby enemies, which is also the target set.
      const battler = makeBattler();
      const source = { constructor: { name: 'RPG_State' }, id: 1 };
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([]);

      // Act
      AutoApplyStateOnNearbyManager._tryDispatchProximityRule(
        battler, source, 0, 5, 'enemiesNearbyBelow', [ 5, 'enemiesNearbyBelow', 1, 60 ],
      );

      // Assert — nothing to dispatch to, so the cooldown never stamps either.
      expect(battler.setAutoRuleLastFrame).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/passive/ext/conditional/managers/auto-apply-state-on-nearby-manager.test.js
