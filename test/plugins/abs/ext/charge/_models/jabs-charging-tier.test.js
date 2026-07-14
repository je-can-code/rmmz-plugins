//region plugins/abs/ext/charge/_models/jabs-charging-tier.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Charge JABS_ChargingTier (unit, pure class, no downstream dependencies)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/charge/_models/JABS_ChargingTier.js').default} */
  let JABS_ChargingTier;

  beforeAll(async () =>
  {
    ({ default: JABS_ChargingTier } = await import('../../../../../../src/plugins/abs/ext/charge/_models/JABS_ChargingTier.js'));
  });

  describe('constructor', () =>
  {
    it('assigns all provided values and defaults duration/completed', () =>
    {
      // Act
      const tier = new JABS_ChargingTier(2, 60, 7, 3, 4);

      // Assert
      expect(tier.tier).toBe(2);
      expect(tier.maxDuration).toBe(60);
      expect(tier.skillId).toBe(7);
      expect(tier.whileChargingAnimationId).toBe(3);
      expect(tier.chargeTierCompleteAnimationId).toBe(4);
      expect(tier.duration).toBe(0);
      expect(tier.completed).toBe(false);
    });
  });

  describe('defaultTier', () =>
  {
    it('builds a 30-frame filler tier with no skill or animations for the given tier number', () =>
    {
      // Act
      const tier = JABS_ChargingTier.defaultTier(3);

      // Assert
      expect(tier.tier).toBe(3);
      expect(tier.maxDuration).toBe(30);
      expect(tier.skillId).toBe(0);
      expect(tier.whileChargingAnimationId).toBe(0);
      expect(tier.chargeTierCompleteAnimationId).toBe(0);
    });

    it('defaults to tier 1 when no tier number is given', () =>
    {
      // Act
      const tier = JABS_ChargingTier.defaultTier();

      // Assert
      expect(tier.tier).toBe(1);
    });
  });

  describe('update', () =>
  {
    it('increments the duration while not yet completed', () =>
    {
      // Arrange
      const tier = new JABS_ChargingTier(1, 10, 0, 0, 0);

      // Act
      tier.update();

      // Assert
      expect(tier.duration).toBe(1);
      expect(tier.completed).toBe(false);
    });

    it('flags completion and fires the on-complete hook once the max duration is reached', () =>
    {
      // Arrange
      const tier = new JABS_ChargingTier(1, 1, 0, 0, 0);
      const onCompleteSpy = vi.spyOn(tier, 'onComplete');

      // Act
      tier.update();

      // Assert
      expect(tier.completed).toBe(true);
      expect(onCompleteSpy).toHaveBeenCalledTimes(1);
    });

    it('does not continue incrementing once completed', () =>
    {
      // Arrange
      const tier = new JABS_ChargingTier(1, 1, 0, 0, 0);
      tier.update();

      // Act
      tier.update();

      // Assert
      expect(tier.duration).toBe(1);
    });
  });
});
//endregion plugins/abs/ext/charge/_models/jabs-charging-tier.test.js
