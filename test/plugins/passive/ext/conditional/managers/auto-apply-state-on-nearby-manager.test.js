//region plugins/passive/ext/conditional/managers/auto-apply-state-on-nearby-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('AutoApplyStateOnNearbyManager (direct src import)', () =>
{
  let AutoApplyStateOnNearbyManager;
  let FakePassiveRuleJabsAccess;

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

    ({ default: AutoApplyStateOnNearbyManager } = await import('../../../../../../src/plugins/passive/ext/conditional/managers/AutoApplyStateOnNearbyManager.js'));
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.Graphics = { frameCount: 1000 };
  });

  function makeBattler(overrides = {})
  {
    return {
      isStateAddable: vi.fn().mockReturnValue(true),
      addState: vi.fn(),
      getAutoRuleLastFrame: vi.fn().mockReturnValue(0),
      setAutoRuleLastFrame: vi.fn(),
      ...overrides,
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
    it('does not apply the state when it is not addable', () =>
    {
      // Arrange
      const battler = makeBattler({ isStateAddable: vi.fn().mockReturnValue(false) });

      // Act
      const result = AutoApplyStateOnNearbyManager.dispatch(battler, 5);

      // Assert
      expect(result).toEqual(false);
      expect(battler.addState).not.toHaveBeenCalled();
    });

    it('applies the state to the battler using itself as the source', () =>
    {
      // Arrange
      const battler = makeBattler();

      // Act
      const result = AutoApplyStateOnNearbyManager.dispatch(battler, 5);

      // Assert
      expect(battler.addState).toHaveBeenCalledWith(5, battler);
      expect(result).toEqual(true);
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

    it('dispatches the state to nearby enemies and stamps the cooldown when the gate passes', () =>
    {
      // Arrange
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
      expect(battler.setAutoRuleLastFrame).toHaveBeenCalledWith(expect.any(String), 1000);
    });

    it('does not stamp the cooldown when every nearby target rejects the state', () =>
    {
      // Arrange
      const battler = makeBattler();
      const source = { constructor: { name: 'RPG_State' }, id: 1 };
      const nearbyTarget = makeBattler({ isStateAddable: vi.fn().mockReturnValue(false) });
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([ { getBattler: () => nearbyTarget } ]);

      // Act
      AutoApplyStateOnNearbyManager._tryDispatchProximityRule(
        battler, source, 0, 5, 'enemiesNearby', [ 5, 'enemiesNearby', 1, 60 ],
      );

      // Assert
      expect(nearbyTarget.addState).not.toHaveBeenCalled();
      expect(battler.setAutoRuleLastFrame).not.toHaveBeenCalled();
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
