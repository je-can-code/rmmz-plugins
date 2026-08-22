//region plugins/passive/ext/conditional/managers/passive-stack-count-evaluator.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('PassiveStackCountEvaluator (direct src import)', () =>
{
  let PassiveStackCountEvaluator;
  let FakePassiveRuleJabsAccess;

  beforeAll(async () =>
  {
    vi.resetModules();

    FakePassiveRuleJabsAccess = {
      enemiesTargetingMe: vi.fn().mockReturnValue([]),
      nearbyAlliesExcludingSelf: vi.fn().mockReturnValue([]),
      nearbyEnemies: vi.fn().mockReturnValue([]),
    };
    globalThis.FakePassiveRuleThreshold = { resolveRuleValue: vi.fn().mockReturnValue(0) };
    globalThis.FakePassiveGateEvaluator = { countNegativeStates: vi.fn().mockReturnValue(0) };
    vi.doMock('../../../../../../src/plugins/passive/ext/conditional/helpers/PassiveRuleJabsAccess.js', () => ({ default: FakePassiveRuleJabsAccess }));
    vi.doMock('../../../../../../src/plugins/passive/ext/conditional/helpers/PassiveRuleThreshold.js', () => ({ default: globalThis.FakePassiveRuleThreshold }));
    vi.doMock('../../../../../../src/plugins/passive/ext/conditional/managers/PassiveGateEvaluator.js', () => ({ default: globalThis.FakePassiveGateEvaluator }));

    ({ default: PassiveStackCountEvaluator } = await import('../../../../../../src/plugins/passive/ext/conditional/managers/PassiveStackCountEvaluator.js'));
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    FakePassiveRuleJabsAccess.enemiesTargetingMe.mockReturnValue([]);
    FakePassiveRuleJabsAccess.nearbyAlliesExcludingSelf.mockReturnValue([]);
    FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([]);
    globalThis.FakePassiveRuleThreshold.resolveRuleValue.mockReturnValue(0);
    globalThis.FakePassiveGateEvaluator.countNegativeStates.mockReturnValue(0);
  });

  function makeBattler()
  {
    return {};
  }

  describe('enemiesTargetingMe', () =>
  {
    it('contributes zero stacks when no enemies are targeting this battler', () =>
    {
      // Arrange
      const battler = makeBattler();
      FakePassiveRuleJabsAccess.enemiesTargetingMe.mockReturnValue([]);

      // Act
      const result = PassiveStackCountEvaluator.evaluate(battler, 'enemiesTargetingMe', 1);

      // Assert
      expect(result).toEqual(0);
    });

    it('contributes one stack per enemy targeting this battler when param is 1', () =>
    {
      // Arrange
      const battler = makeBattler();
      FakePassiveRuleJabsAccess.enemiesTargetingMe.mockReturnValue([ {}, {}, {} ]);

      // Act
      const result = PassiveStackCountEvaluator.evaluate(battler, 'enemiesTargetingMe', 1);

      // Assert
      expect(result).toEqual(3);
    });

    it('floors partial thresholds so they do not grant an extra stack', () =>
    {
      // Arrange
      const battler = makeBattler();
      FakePassiveRuleJabsAccess.enemiesTargetingMe.mockReturnValue([ {}, {}, {} ]);

      // Act
      const result = PassiveStackCountEvaluator.evaluate(battler, 'enemiesTargetingMe', 2);

      // Assert
      expect(result).toEqual(1);
    });

    it('never forwards a scope/radius param- this kind is not proximity-scoped', () =>
    {
      // Arrange
      const battler = makeBattler();

      // Act
      PassiveStackCountEvaluator.evaluate(battler, 'enemiesTargetingMe', 1, 3);

      // Assert
      expect(FakePassiveRuleJabsAccess.enemiesTargetingMe).toHaveBeenCalledWith(battler);
    });
  });

  describe('evaluateTuple', () =>
  {
    it('unpacks [stateId, kind, param, scope] and delegates to evaluate', () =>
    {
      // Arrange
      const battler = makeBattler();
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([ {}, {} ]);

      // Act
      const result = PassiveStackCountEvaluator.evaluateTuple(battler, [ 1001, 'enemiesNearby', 1, 5 ]);

      // Assert
      expect(FakePassiveRuleJabsAccess.nearbyEnemies).toHaveBeenCalledWith(battler, 5);
      expect(result).toBe(2);
    });
  });

  describe('per-{key} scaling', () =>
  {
    it('scales by floor(value / pointsPerStack)', () =>
    {
      // Arrange
      const battler = makeBattler();
      globalThis.FakePassiveRuleThreshold.resolveRuleValue.mockReturnValue(9);

      // Act
      const result = PassiveStackCountEvaluator.evaluate(battler, 'per-cri', 3);

      // Assert
      expect(globalThis.FakePassiveRuleThreshold.resolveRuleValue).toHaveBeenCalledWith(battler, 'cri');
      expect(result).toBe(3);
    });

    it('returns 0 when pointsPerStack is zero or negative (divide-by-zero guard)', () =>
    {
      // Arrange
      const battler = makeBattler();
      globalThis.FakePassiveRuleThreshold.resolveRuleValue.mockReturnValue(9);

      // Act & Assert
      expect(PassiveStackCountEvaluator.evaluate(battler, 'per-cri', 0)).toBe(0);
      expect(PassiveStackCountEvaluator.evaluate(battler, 'per-cri', -1)).toBe(0);
    });
  });

  describe('negativeStateCount', () =>
  {
    it('scales by floor(negativeStateCount / param)', () =>
    {
      // Arrange
      const battler = makeBattler();
      globalThis.FakePassiveGateEvaluator.countNegativeStates.mockReturnValue(5);

      // Act
      const result = PassiveStackCountEvaluator.evaluate(battler, 'negativeStateCount', 2);

      // Assert
      expect(result).toBe(2);
    });
  });

  describe('alliesNearby', () =>
  {
    it('scales by floor(nearbyAllyCount / param), forwarding an explicit scope radius', () =>
    {
      // Arrange
      const battler = makeBattler();
      FakePassiveRuleJabsAccess.nearbyAlliesExcludingSelf.mockReturnValue([ {}, {}, {} ]);

      // Act
      const result = PassiveStackCountEvaluator.evaluate(battler, 'alliesNearby', 1, 4);

      // Assert
      expect(FakePassiveRuleJabsAccess.nearbyAlliesExcludingSelf).toHaveBeenCalledWith(battler, 4);
      expect(result).toBe(3);
    });

    it('resolves scope to null when omitted', () =>
    {
      // Arrange
      const battler = makeBattler();

      // Act
      PassiveStackCountEvaluator.evaluate(battler, 'alliesNearby', 1);

      // Assert
      expect(FakePassiveRuleJabsAccess.nearbyAlliesExcludingSelf).toHaveBeenCalledWith(battler, null);
    });
  });

  describe('enemiesNearby', () =>
  {
    it('scales by floor(nearbyEnemyCount / param)', () =>
    {
      // Arrange
      const battler = makeBattler();
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([ {}, {} ]);

      // Act
      const result = PassiveStackCountEvaluator.evaluate(battler, 'enemiesNearby', 1, 6);

      // Assert
      expect(FakePassiveRuleJabsAccess.nearbyEnemies).toHaveBeenCalledWith(battler, 6);
      expect(result).toBe(2);
    });
  });

  describe('lessIsMore{Hp,Mp,Tp}', () =>
  {
    it.each([
      [ 'lessIsMoreHp', 'hp', 7 ], [ 'lessIsMoreMp', 'mp', 4 ], [ 'lessIsMoreTp', 'tp', 1 ],
    ])('scales by floor(missingPercent / param) for %s', (kind, resourceKey, expectedStacks) =>
    {
      // Arrange- each pool sits at a different fill level (hp 30%, mp 60%, tp 90%), so a kind
      // that read the wrong resource would produce a different stack count rather than the same one.
      const battler = makeBattler();
      const currentPercentByResource = { hp: 30, mp: 60, tp: 90 };
      globalThis.FakePassiveRuleThreshold.resolveRuleValue
        .mockImplementation((_battler, key) => currentPercentByResource[key]);

      // Act
      const result = PassiveStackCountEvaluator.evaluate(battler, kind, 10);

      // Assert
      expect(globalThis.FakePassiveRuleThreshold.resolveRuleValue).toHaveBeenCalledWith(battler, resourceKey);
      expect(result).toBe(expectedStacks);
    });

    it('clamps missing percent at 0 for an overfilled resource (never negative stacks)', () =>
    {
      // Arrange- 150% current (overheal) would be -50% missing without the clamp.
      const battler = makeBattler();
      globalThis.FakePassiveRuleThreshold.resolveRuleValue.mockReturnValue(150);

      // Act
      const result = PassiveStackCountEvaluator.evaluate(battler, 'lessIsMoreHp', 10);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('moreIsMore{Hp,Mp,Tp}', () =>
  {
    it.each([
      [ 'moreIsMoreHp', 'hp' ], [ 'moreIsMoreMp', 'mp' ], [ 'moreIsMoreTp', 'tp' ],
    ])('scales by floor(currentValue / param) for %s', (kind, resourceKey) =>
    {
      // Arrange
      const battler = makeBattler();
      globalThis.FakePassiveRuleThreshold.resolveRuleValue.mockReturnValue(55);

      // Act
      const result = PassiveStackCountEvaluator.evaluate(battler, kind, 10);

      // Assert
      expect(globalThis.FakePassiveRuleThreshold.resolveRuleValue).toHaveBeenCalledWith(battler, resourceKey);
      expect(result).toBe(5);
    });
  });

  describe('unknown kind', () =>
  {
    it('contributes zero stacks for an unrecognized scaler kind', () =>
    {
      // Arrange
      const battler = makeBattler();

      // Act & Assert
      expect(PassiveStackCountEvaluator.evaluate(battler, 'notARealKind', 1)).toBe(0);
    });
  });
});
//endregion plugins/passive/ext/conditional/managers/passive-stack-count-evaluator.test.js
