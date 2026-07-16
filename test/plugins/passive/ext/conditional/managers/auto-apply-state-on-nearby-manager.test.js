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
      // Arrange
      const battler = makeBattler();
      const source = { constructor: { name: 'RPG_State' }, id: 1 };

      // Act/Assert (no throw, no dispatch)
      expect(() => AutoApplyStateOnNearbyManager._tryDispatchProximityRule(
        battler, source, 0, 5, 'enemiesNearby', [ 5, 'enemiesNearby', 0, 60 ],
      )).not.toThrow();
      expect(battler.addState).not.toHaveBeenCalled();
    });

    it('skips when the cooldown tuple field is invalid', () =>
    {
      // Arrange
      const battler = makeBattler();
      const source = { constructor: { name: 'RPG_State' }, id: 1 };
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([ { getBattler: () => makeBattler() } ]);

      // Act
      AutoApplyStateOnNearbyManager._tryDispatchProximityRule(
        battler, source, 0, 5, 'enemiesNearby', [ 5, 'enemiesNearby', 1, -1 ],
      );

      // Assert
      expect(battler.addState).not.toHaveBeenCalled();
    });

    it('does nothing when fewer nearby battlers are found than the required minimum', () =>
    {
      // Arrange
      const battler = makeBattler();
      const source = { constructor: { name: 'RPG_State' }, id: 1 };
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([]);

      // Act
      AutoApplyStateOnNearbyManager._tryDispatchProximityRule(
        battler, source, 0, 5, 'enemiesNearby', [ 5, 'enemiesNearby', 1, 60 ],
      );

      // Assert
      expect(battler.addState).not.toHaveBeenCalled();
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
