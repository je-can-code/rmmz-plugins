//region plugins/passive/ext/conditional/managers/passive-gate-evaluator.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('PassiveGateEvaluator (direct src import)', () =>
{
  let PassiveGateEvaluator;
  let FakePassiveRuleJabsAccess;

  beforeAll(async () =>
  {
    vi.resetModules();

    FakePassiveRuleJabsAccess = {
      nearbyEnemies: vi.fn().mockReturnValue([]),
      nearbyAlliesExcludingSelf: vi.fn().mockReturnValue([]),
    };
    vi.doMock('../../../../../../src/plugins/passive/ext/conditional/helpers/PassiveRuleJabsAccess.js', () => ({ default: FakePassiveRuleJabsAccess }));

    ({ default: PassiveGateEvaluator } = await import('../../../../../../src/plugins/passive/ext/conditional/managers/PassiveGateEvaluator.js'));
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([]);
    FakePassiveRuleJabsAccess.nearbyAlliesExcludingSelf.mockReturnValue([]);
  });

  function makeBattler()
  {
    return {};
  }

  describe('enemiesNearby', () =>
  {
    it('fails when fewer opposing battlers are in range than the required count', () =>
    {
      // Arrange
      const battler = makeBattler();
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([]);

      // Act
      const result = PassiveGateEvaluator.evaluate(battler, 'enemiesNearby', 1);

      // Assert
      expect(result).toEqual(false);
    });

    it('passes when at least the required count of opposing battlers are in range', () =>
    {
      // Arrange
      const battler = makeBattler();
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([ {}, {} ]);

      // Act
      const result = PassiveGateEvaluator.evaluate(battler, 'enemiesNearby', 2);

      // Assert
      expect(result).toEqual(true);
    });

    it('forwards an explicit radius param to the proximity lookup', () =>
    {
      // Arrange
      const battler = makeBattler();

      // Act
      PassiveGateEvaluator.evaluate(battler, 'enemiesNearby', 1, 3);

      // Assert
      expect(FakePassiveRuleJabsAccess.nearbyEnemies).toHaveBeenCalledWith(battler, 3);
    });
  });

  describe('enemiesNearbyBelow', () =>
  {
    it('passes when zero enemies are in range and the threshold is 1 (melee-range emptiness)', () =>
    {
      // Arrange
      const battler = makeBattler();
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([]);

      // Act
      const result = PassiveGateEvaluator.evaluate(battler, 'enemiesNearbyBelow', 1, 1);

      // Assert
      expect(result).toEqual(true);
    });

    it('fails once the number of nearby enemies meets the threshold', () =>
    {
      // Arrange
      const battler = makeBattler();
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([ {} ]);

      // Act
      const result = PassiveGateEvaluator.evaluate(battler, 'enemiesNearbyBelow', 1, 1);

      // Assert
      expect(result).toEqual(false);
    });

    it('forwards an explicit radius param to the proximity lookup', () =>
    {
      // Arrange
      const battler = makeBattler();

      // Act
      PassiveGateEvaluator.evaluate(battler, 'enemiesNearbyBelow', 1, 1);

      // Assert
      expect(FakePassiveRuleJabsAccess.nearbyEnemies).toHaveBeenCalledWith(battler, 1);
    });
  });

  describe('alliesNearby', () =>
  {
    it('fails when fewer allied battlers are in range than the required count', () =>
    {
      // Arrange
      const battler = makeBattler();
      FakePassiveRuleJabsAccess.nearbyAlliesExcludingSelf.mockReturnValue([]);

      // Act
      const result = PassiveGateEvaluator.evaluate(battler, 'alliesNearby', 1);

      // Assert
      expect(result).toEqual(false);
    });

    it('passes when at least the required count of allied battlers are in range', () =>
    {
      // Arrange
      const battler = makeBattler();
      FakePassiveRuleJabsAccess.nearbyAlliesExcludingSelf.mockReturnValue([ {} ]);

      // Act
      const result = PassiveGateEvaluator.evaluate(battler, 'alliesNearby', 1);

      // Assert
      expect(result).toEqual(true);
    });
  });

  describe('alliesNearbyBelow', () =>
  {
    it('passes when fewer allied battlers are in range than the threshold', () =>
    {
      // Arrange
      const battler = makeBattler();
      FakePassiveRuleJabsAccess.nearbyAlliesExcludingSelf.mockReturnValue([]);

      // Act
      const result = PassiveGateEvaluator.evaluate(battler, 'alliesNearbyBelow', 1);

      // Assert
      expect(result).toEqual(true);
    });

    it('fails once the number of nearby allies meets the threshold', () =>
    {
      // Arrange
      const battler = makeBattler();
      FakePassiveRuleJabsAccess.nearbyAlliesExcludingSelf.mockReturnValue([ {} ]);

      // Act
      const result = PassiveGateEvaluator.evaluate(battler, 'alliesNearbyBelow', 1);

      // Assert
      expect(result).toEqual(false);
    });
  });
});
//endregion plugins/passive/ext/conditional/managers/passive-gate-evaluator.test.js
