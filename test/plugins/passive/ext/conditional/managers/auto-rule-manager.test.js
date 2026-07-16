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
});
//endregion plugins/passive/ext/conditional/managers/auto-rule-manager.test.js
