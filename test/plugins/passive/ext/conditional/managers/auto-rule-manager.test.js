//region plugins/passive/ext/conditional/managers/auto-rule-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('AutoRuleManager (direct src import)', () =>
{
  let AutoRuleManager;
  let FakeAutoApplyManager;
  let FakePassiveRuleJabsAccess;

  beforeAll(async () =>
  {
    vi.resetModules();

    FakePassiveRuleJabsAccess = {
      nearbyEnemies: vi.fn().mockReturnValue([]),
      nearbyAlliesExcludingSelf: vi.fn().mockReturnValue([]),
    };
    vi.doMock('../../../../../../src/plugins/passive/ext/conditional/helpers/PassiveRuleJabsAccess.js', () => ({ default: FakePassiveRuleJabsAccess }));

    ({ default: AutoRuleManager } = await import('../../../../../../src/plugins/passive/ext/conditional/managers/AutoRuleManager.js'));

    // minimal concrete subclass so the abstract dispatch/rulesProperty contract is satisfiable.
    FakeAutoApplyManager = class extends AutoRuleManager
    {
      static get rulesProperty() { return 'fakeRules'; }

      static dispatch(battler, id)
      {
        battler.dispatched.push(id);
        return true;
      }
    };
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.Graphics = { frameCount: 1000 };
    globalThis.$jabsEngine = { absEnabled: true };
  });

  function makeBattler(sourceNotes = [])
  {
    return {
      dispatched: [],
      getPassiveStateSources: vi.fn().mockReturnValue(sourceNotes),
      getAutoRuleLastFrame: vi.fn().mockReturnValue(0),
      setAutoRuleLastFrame: vi.fn(),
    };
  }

  function makeSource(id, tuples)
  {
    return { constructor: { name: 'RPG_Skill' }, id, fakeRules: tuples };
  }

  describe('requiresPositiveId / tuple forwarding', () =>
  {
    it('defaults to requiring a positive id', () =>
    {
      // Arrange & Act & Assert
      expect(AutoRuleManager.requiresPositiveId).toBe(true);
    });

    it('rejects a non-positive id by default, never reaching dispatch', () =>
    {
      // Arrange
      const battler = makeBattler([ makeSource(1, [ [ -10, 'onKill', 0 ] ]) ]);

      // Act
      FakeAutoApplyManager.tryDispatch(battler, 'onKill');

      // Assert
      expect(battler.dispatched).toEqual([]);
    });

    it('forwards the full tuple to dispatch alongside id, not just id alone', () =>
    {
      // Arrange
      const seen = [];
      const FakeTupleCapturingManager = class extends AutoRuleManager
      {
        static get rulesProperty() { return 'fakeRules'; }

        static dispatch(battler, id, tuple)
        {
          seen.push({ id, tuple });
          return true;
        }
      };
      const tuple = [ 3, 'onKill', 0, 'extra-payload' ];
      const battler = makeBattler([ makeSource(1, [ tuple ]) ]);

      // Act
      FakeTupleCapturingManager.tryDispatch(battler, 'onKill');

      // Assert
      expect(seen).toEqual([ { id: 3, tuple } ]);
    });

    it('lets a subclass opt out of the positive-id requirement for a signed-value payload', () =>
    {
      // Arrange
      const FakeSignedAmountManager = class extends AutoRuleManager
      {
        static get rulesProperty() { return 'fakeRules'; }

        static get requiresPositiveId() { return false; }

        static dispatch(battler, amount)
        {
          battler.dispatched.push(amount);
          return true;
        }
      };
      const battler = makeBattler([ makeSource(1, [ [ -10, 'onKill', 0 ] ]) ]);

      // Act
      FakeSignedAmountManager.tryDispatch(battler, 'onKill');

      // Assert
      expect(battler.dispatched).toEqual([ -10 ]);
    });
  });

  describe('isProximityKind', () =>
  {
    it('recognizes enemiesNearby and its Below counterpart', () =>
    {
      // Arrange/Act/Assert
      expect(AutoRuleManager.isProximityKind('enemiesNearby')).toEqual(true);
      expect(AutoRuleManager.isProximityKind('enemiesNearbyBelow')).toEqual(true);
    });

    it('recognizes alliesNearby and its Below counterpart', () =>
    {
      // Arrange/Act/Assert
      expect(AutoRuleManager.isProximityKind('alliesNearby')).toEqual(true);
      expect(AutoRuleManager.isProximityKind('alliesNearbyBelow')).toEqual(true);
    });

    it('rejects unrelated condition kinds', () =>
    {
      // Arrange/Act/Assert
      expect(AutoRuleManager.isProximityKind('time')).toEqual(false);
    });
  });

  describe('proximityGatePasses', () =>
  {
    it('passes the default kind at or above the threshold', () =>
    {
      // Arrange/Act/Assert
      expect(AutoRuleManager.proximityGatePasses(2, 2, 'enemiesNearby')).toEqual(true);
      expect(AutoRuleManager.proximityGatePasses(1, 2, 'enemiesNearby')).toEqual(false);
    });

    it('passes the Below kind strictly under the threshold', () =>
    {
      // Arrange/Act/Assert
      expect(AutoRuleManager.proximityGatePasses(0, 1, 'enemiesNearbyBelow')).toEqual(true);
      expect(AutoRuleManager.proximityGatePasses(1, 1, 'enemiesNearbyBelow')).toEqual(false);
    });
  });

  describe('nearbyBattlersForKind', () =>
  {
    it('resolves enemies for enemiesNearby and enemiesNearbyBelow', () =>
    {
      // Arrange
      const battler = makeBattler();
      const enemies = [ {} ];
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue(enemies);

      // Act/Assert
      expect(AutoRuleManager.nearbyBattlersForKind(battler, 'enemiesNearby', null)).toBe(enemies);
      expect(AutoRuleManager.nearbyBattlersForKind(battler, 'enemiesNearbyBelow', null)).toBe(enemies);
    });

    it('resolves allies excluding self for alliesNearby and alliesNearbyBelow', () =>
    {
      // Arrange
      const battler = makeBattler();
      const allies = [ {} ];
      FakePassiveRuleJabsAccess.nearbyAlliesExcludingSelf.mockReturnValue(allies);

      // Act/Assert
      expect(AutoRuleManager.nearbyBattlersForKind(battler, 'alliesNearby', null)).toBe(allies);
      expect(AutoRuleManager.nearbyBattlersForKind(battler, 'alliesNearbyBelow', null)).toBe(allies);
    });
  });

  describe('enemiesNearbyBelow dispatch', () =>
  {
    it('does not dispatch while an enemy remains within the trigger radius', () =>
    {
      // Arrange
      const battler = makeBattler([ makeSource(1, [ [ 7, 'enemiesNearbyBelow', 1, 60, 1 ] ]) ]);
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([ {} ]);

      // Act
      FakeAutoApplyManager.processEnemiesNearbyRules(battler);

      // Assert
      expect(battler.dispatched).toEqual([]);
    });

    it('dispatches once no enemies remain within the trigger radius', () =>
    {
      // Arrange
      const battler = makeBattler([ makeSource(1, [ [ 7, 'enemiesNearbyBelow', 1, 60, 1 ] ]) ]);
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([]);

      // Act
      FakeAutoApplyManager.processEnemiesNearbyRules(battler);

      // Assert
      expect(battler.dispatched).toEqual([ 7 ]);
      expect(FakePassiveRuleJabsAccess.nearbyEnemies).toHaveBeenCalledWith(battler, 1);
    });

    it('does not disturb a sibling enemiesNearby rule evaluated on the same pass', () =>
    {
      // Arrange
      const battler = makeBattler([
        makeSource(1, [
          [ 7, 'enemiesNearbyBelow', 1, 60, 1 ],
          [ 9, 'enemiesNearby', 1, 60, 1 ],
        ]),
      ]);
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([ {} ]);

      // Act
      FakeAutoApplyManager.processEnemiesNearbyRules(battler);

      // Assert — one enemy present: enemiesNearby fires, enemiesNearbyBelow does not.
      expect(battler.dispatched).toEqual([ 9 ]);
    });
  });

  describe('alliesNearbyBelow dispatch', () =>
  {
    it('dispatches once fewer allies than the threshold are in range', () =>
    {
      // Arrange
      const battler = makeBattler([ makeSource(1, [ [ 3, 'alliesNearbyBelow', 2, 60 ] ]) ]);
      FakePassiveRuleJabsAccess.nearbyAlliesExcludingSelf.mockReturnValue([ {} ]);

      // Act
      FakeAutoApplyManager.processAlliesNearbyRules(battler);

      // Assert
      expect(battler.dispatched).toEqual([ 3 ]);
    });
  });

  describe('scheduleGlancingTriggers', () =>
  {
    it('dispatches whenGlanced rules on the glanced battler', () =>
    {
      // Arrange
      const battler = makeBattler([ makeSource(1, [ [ 9, 'whenGlanced', 0 ] ]) ]);

      // Act
      FakeAutoApplyManager.scheduleGlancingTriggers(battler);

      // Assert
      expect(battler.dispatched).toEqual([ 9 ]);
    });

    it('does not dispatch whenCrit rules', () =>
    {
      // Arrange
      const battler = makeBattler([ makeSource(1, [ [ 9, 'whenCrit', 0 ] ]) ]);

      // Act
      FakeAutoApplyManager.scheduleGlancingTriggers(battler);

      // Assert
      expect(battler.dispatched).toEqual([]);
    });
  });

  describe('scheduleSelfStateInflictedTriggers', () =>
  {
    beforeEach(() =>
    {
      globalThis.$dataStates = [];
    });

    it('does nothing when there is no ABS context', () =>
    {
      // Arrange
      globalThis.$jabsEngine = { absEnabled: false };
      globalThis.$dataStates[10] = { isNegativeType: () => true };
      const battler = makeBattler([ makeSource(1, [ [ 3, 'negaStateInflicted', 0 ] ]) ]);

      // Act
      FakeAutoApplyManager.scheduleSelfStateInflictedTriggers(battler, 10);

      // Assert
      expect(battler.dispatched).toEqual([]);
    });

    it('does nothing when no battler is given', () =>
    {
      // Arrange & Act & Assert- must not throw for a missing battler.
      expect(() => FakeAutoApplyManager.scheduleSelfStateInflictedTriggers(undefined, 10)).not.toThrow();
    });

    it('does nothing when the inflicted state id has no database row', () =>
    {
      // Arrange
      const battler = makeBattler([ makeSource(1, [ [ 3, 'negaStateInflicted', 0 ] ]) ]);

      // Act
      FakeAutoApplyManager.scheduleSelfStateInflictedTriggers(battler, 999);

      // Assert
      expect(battler.dispatched).toEqual([]);
    });

    it('fires negaStateInflicted and anyStateInflicted rules for a negative-tagged state', () =>
    {
      // Arrange
      globalThis.$dataStates[10] = { isNegativeType: () => true };
      const battler = makeBattler([
        makeSource(1, [
          [ 3, 'negaStateInflicted', 0 ],
          [ 4, 'anyStateInflicted', 0 ],
          [ 5, 'posiStateInflicted', 0 ],
        ]),
      ]);

      // Act
      FakeAutoApplyManager.scheduleSelfStateInflictedTriggers(battler, 10);

      // Assert
      expect(battler.dispatched.sort()).toEqual([ 3, 4 ]);
    });

    it('fires posiStateInflicted and anyStateInflicted rules for a non-negative state', () =>
    {
      // Arrange
      globalThis.$dataStates[11] = { isNegativeType: () => false };
      const battler = makeBattler([
        makeSource(1, [
          [ 3, 'negaStateInflicted', 0 ],
          [ 4, 'anyStateInflicted', 0 ],
          [ 5, 'posiStateInflicted', 0 ],
        ]),
      ]);

      // Act
      FakeAutoApplyManager.scheduleSelfStateInflictedTriggers(battler, 11);

      // Assert
      expect(battler.dispatched.sort()).toEqual([ 4, 5 ]);
    });
  });

  describe('ABS-inactive / missing-battler guards', () =>
  {
    it.each([
      'processTimeRules', 'processStandRules', 'processEnemiesNearbyRules', 'processAlliesNearbyRules',
    ])('%s is a no-op when $jabsEngine is absent', (methodName) =>
    {
      // Arrange
      globalThis.$jabsEngine = null;
      const battler = makeBattler([ makeSource(1, [ [ 1, 'time', 0 ] ]) ]);

      // Act & Assert
      expect(() => FakeAutoApplyManager[methodName](battler)).not.toThrow();
      expect(battler.dispatched).toEqual([]);
    });

    it.each([
      'processTimeRules', 'processStandRules', 'processEnemiesNearbyRules', 'processAlliesNearbyRules',
    ])('%s is a no-op when absEnabled is false', (methodName) =>
    {
      // Arrange
      globalThis.$jabsEngine = { absEnabled: false };
      const battler = makeBattler([ makeSource(1, [ [ 1, 'time', 0 ] ]) ]);

      // Act & Assert
      expect(() => FakeAutoApplyManager[methodName](battler)).not.toThrow();
      expect(battler.dispatched).toEqual([]);
    });

    it.each([ 'scheduleKillTriggers', 'scheduleDamageDealtTriggers', 'scheduleWeaponHitTriggers' ])(
      '%s is a no-op when $jabsEngine is absent', (methodName) =>
      {
        // Arrange
        globalThis.$jabsEngine = null;
        const battler = makeBattler([]);

        // Act & Assert
        expect(() => FakeAutoApplyManager[methodName](battler)).not.toThrow();
      });

    it.each([ 'scheduleKillTriggers', 'scheduleDamageDealtTriggers', 'scheduleWeaponHitTriggers' ])(
      '%s is a no-op when the battler is falsy', (methodName) =>
      {
        // Arrange
        globalThis.$jabsEngine = { absEnabled: true };

        // Act & Assert
        expect(() => FakeAutoApplyManager[methodName](null)).not.toThrow();
      });

    it('creditTileStep is a no-op when $jabsEngine is absent', () =>
    {
      // Arrange
      globalThis.$jabsEngine = null;
      const battler = makeBattler([ makeSource(1, [ [ 1, 'move', 1 ] ]) ]);

      // Act & Assert
      expect(() => FakeAutoApplyManager.creditTileStep(battler)).not.toThrow();
    });
  });

  describe('creditTileStep', () =>
  {
    beforeEach(() =>
    {
      globalThis.$jabsEngine = { absEnabled: true };
    });

    it('skips a tuple with an invalid id', () =>
    {
      // Arrange
      const battler = makeBattler([ makeSource(1, [ [ 0, 'move', 1 ] ]) ]);
      battler.getAutoRuleTileCredit = vi.fn();
      battler.setAutoRuleTileCredit = vi.fn();

      // Act
      FakeAutoApplyManager.creditTileStep(battler);

      // Assert
      expect(battler.setAutoRuleTileCredit).not.toHaveBeenCalled();
    });

    it('skips a non-move condition kind', () =>
    {
      // Arrange
      const battler = makeBattler([ makeSource(1, [ [ 1, 'time', 1 ] ]) ]);
      battler.getAutoRuleTileCredit = vi.fn();
      battler.setAutoRuleTileCredit = vi.fn();

      // Act
      FakeAutoApplyManager.creditTileStep(battler);

      // Assert
      expect(battler.setAutoRuleTileCredit).not.toHaveBeenCalled();
    });

    it('skips a tuple with an invalid tiles-per-dispatch threshold', () =>
    {
      // Arrange
      const battler = makeBattler([ makeSource(1, [ [ 1, 'move', 0 ] ]) ]);
      battler.getAutoRuleTileCredit = vi.fn();
      battler.setAutoRuleTileCredit = vi.fn();

      // Act
      FakeAutoApplyManager.creditTileStep(battler);

      // Assert
      expect(battler.setAutoRuleTileCredit).not.toHaveBeenCalled();
    });

    it('accumulates credit without dispatching until the tile threshold is reached', () =>
    {
      // Arrange
      const battler = makeBattler([ makeSource(1, [ [ 1, 'move', 3 ] ]) ]);
      battler.getAutoRuleTileCredit = vi.fn().mockReturnValue(0);
      battler.setAutoRuleTileCredit = vi.fn();

      // Act
      FakeAutoApplyManager.creditTileStep(battler);

      // Assert- 0 prior + 1 = 1, still under the 3-tile threshold.
      expect(battler.setAutoRuleTileCredit).toHaveBeenCalledWith(expect.any(String), 1);
      expect(battler.dispatched).toEqual([]);
    });

    it('dispatches and resets credit once the tile threshold is reached', () =>
    {
      // Arrange
      const battler = makeBattler([ makeSource(1, [ [ 1, 'move', 3 ] ]) ]);
      battler.getAutoRuleTileCredit = vi.fn().mockReturnValue(2);
      battler.setAutoRuleTileCredit = vi.fn();

      // Act
      FakeAutoApplyManager.creditTileStep(battler);

      // Assert- 2 prior + 1 = 3, meets the threshold.
      expect(battler.dispatched).toEqual([ 1 ]);
      expect(battler.setAutoRuleTileCredit).toHaveBeenCalledWith(expect.any(String), 0);
    });
  });

  describe('processTileStepFromCharacter', () =>
  {
    it('does nothing when the character has no JABS wrapper', () =>
    {
      // Arrange
      const character = { getJabsBattler: () => null };

      // Act & Assert
      expect(() => FakeAutoApplyManager.processTileStepFromCharacter(character)).not.toThrow();
    });

    it('does nothing when the JABS wrapper has no underlying Game_Battler', () =>
    {
      // Arrange
      const character = { getJabsBattler: () => ({ getBattler: () => null }) };

      // Act & Assert
      expect(() => FakeAutoApplyManager.processTileStepFromCharacter(character)).not.toThrow();
    });

    it('forwards the tile step to the underlying battler', () =>
    {
      // Arrange
      globalThis.$jabsEngine = { absEnabled: true };
      const battler = makeBattler([ makeSource(1, [ [ 1, 'move', 1 ] ]) ]);
      battler.getAutoRuleTileCredit = vi.fn().mockReturnValue(0);
      battler.setAutoRuleTileCredit = vi.fn();
      const character = { getJabsBattler: () => ({ getBattler: () => battler }) };

      // Act
      FakeAutoApplyManager.processTileStepFromCharacter(character);

      // Assert
      expect(battler.setAutoRuleTileCredit).toHaveBeenCalled();
    });
  });

  describe('buildRuleKey', () =>
  {
    it('falls back to "Unknown" when the source constructor has no name', () =>
    {
      // Arrange
      const source = { constructor: {}, id: 5 };

      // Act
      const key = AutoRuleManager.buildRuleKey(source, 0, 10, 'time');

      // Assert
      expect(key).toBe('Unknown:5:0:10:time');
    });
  });

  describe('_tryDispatchRule cooldown gate', () =>
  {
    it('dispatches when the cooldown has fully elapsed since the last fire', () =>
    {
      // Arrange
      const battler = makeBattler([ makeSource(1, [ [ 7, 'time', 60 ] ]) ]);
      battler.getAutoRuleLastFrame = vi.fn().mockReturnValue(500);
      globalThis.Graphics.frameCount = 1000;

      // Act
      FakeAutoApplyManager.tryDispatch(battler, 'time');

      // Assert- 500 elapsed frames well past the 60-frame cooldown.
      expect(battler.dispatched).toEqual([ 7 ]);
      expect(battler.setAutoRuleLastFrame).toHaveBeenCalled();
    });

    it('does not stamp the cooldown when dispatch itself reports failure', () =>
    {
      // Arrange
      const FailingManager = class extends AutoRuleManager
      {
        static get rulesProperty() { return 'fakeRules'; }

        static dispatch() { return false; }
      };
      const battler = makeBattler([ makeSource(1, [ [ 7, 'time', 60 ] ]) ]);
      battler.getAutoRuleLastFrame = vi.fn().mockReturnValue(0);

      // Act
      FailingManager.tryDispatch(battler, 'time');

      // Assert
      expect(battler.setAutoRuleLastFrame).not.toHaveBeenCalled();
    });
  });

  describe('tryDispatch / proximity rule edge cases', () =>
  {
    it('tryDispatch itself is a no-op when ABS is inactive', () =>
    {
      // Arrange
      globalThis.$jabsEngine = { absEnabled: false };
      const battler = makeBattler([ makeSource(1, [ [ 7, 'time', 60 ] ]) ]);

      // Act
      FakeAutoApplyManager.tryDispatch(battler, 'time');

      // Assert
      expect(battler.dispatched).toEqual([]);
    });

    it('skips a non-proximity tuple with a negative parameter', () =>
    {
      // Arrange
      const battler = makeBattler([ makeSource(1, [ [ 7, 'time', -1 ] ]) ]);

      // Act
      FakeAutoApplyManager.tryDispatch(battler, 'time');

      // Assert
      expect(battler.dispatched).toEqual([]);
    });

    it('skips a proximity tuple with an invalid/zero count threshold', () =>
    {
      // Arrange
      const battler = makeBattler([ makeSource(1, [ [ 7, 'enemiesNearby', 0, 60, 1 ] ]) ]);
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([ {} ]);

      // Act
      FakeAutoApplyManager.processEnemiesNearbyRules(battler);

      // Assert
      expect(battler.dispatched).toEqual([]);
    });

    it('skips a proximity tuple with an invalid cooldown value', () =>
    {
      // Arrange
      const battler = makeBattler([ makeSource(1, [ [ 7, 'enemiesNearby', 1, -5, 1 ] ]) ]);
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([ {} ]);

      // Act
      FakeAutoApplyManager.processEnemiesNearbyRules(battler);

      // Assert
      expect(battler.dispatched).toEqual([]);
    });
  });

  describe('abstract interface guards', () =>
  {
    it('rulesProperty throws when a subclass forgets to override it', () =>
    {
      // Act & Assert
      expect(() => AutoRuleManager.rulesProperty).toThrow(/must implement static get rulesProperty/);
    });

    it('dispatch throws when a subclass forgets to override it', () =>
    {
      // Act & Assert
      expect(() => AutoRuleManager.dispatch({}, 1, [])).toThrow(/must implement static dispatch/);
    });
  });
});
//endregion plugins/passive/ext/conditional/managers/auto-rule-manager.test.js
