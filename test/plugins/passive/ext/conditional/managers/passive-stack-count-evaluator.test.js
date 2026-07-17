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
    };
    vi.doMock('../../../../../../src/plugins/passive/ext/conditional/helpers/PassiveRuleJabsAccess.js', () => ({ default: FakePassiveRuleJabsAccess }));
    vi.doMock('../../../../../../src/plugins/passive/ext/conditional/helpers/PassiveRuleThreshold.js', () => ({ default: {} }));
    vi.doMock('../../../../../../src/plugins/passive/ext/conditional/managers/PassiveGateEvaluator.js', () => ({ default: { countNegativeStates: vi.fn() } }));

    ({ default: PassiveStackCountEvaluator } = await import('../../../../../../src/plugins/passive/ext/conditional/managers/PassiveStackCountEvaluator.js'));
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    FakePassiveRuleJabsAccess.enemiesTargetingMe.mockReturnValue([]);
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
});
//endregion plugins/passive/ext/conditional/managers/passive-stack-count-evaluator.test.js
