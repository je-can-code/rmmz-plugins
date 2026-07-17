//region plugins/level/ext/flat/managers/experience-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('ExperienceManager (direct src import)', () =>
{
  let ExperienceManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { LEVEL: { EXT: { FLAT: { Metadata: { policyMultiplier: 1.0 } } } } };

    ({ default: ExperienceManager } = await import(
      '../../../../../../src/plugins/level/ext/flat/managers/ExperienceManager.js'
    ));
  });

  beforeEach(() =>
  {
    globalThis.J.LEVEL.EXT.FLAT.Metadata.policyMultiplier = 1.0;
  });

  describe('calculateRewardFromLevelDifference', () =>
  {
    it('returns parity experience when the rewardee level is falsy', () =>
    {
      // Arrange & Act
      const result = ExperienceManager.calculateRewardFromLevelDifference(0, 10);

      // Assert
      expect(result).toBe(25);
    });

    it('returns parity experience when the target level is falsy', () =>
    {
      // Arrange & Act
      const result = ExperienceManager.calculateRewardFromLevelDifference(10, 0);

      // Assert
      expect(result).toBe(25);
    });

    it('returns parity experience when both levels are equal', () =>
    {
      // Arrange & Act
      const result = ExperienceManager.calculateRewardFromLevelDifference(10, 10);

      // Assert
      expect(result).toBe(25);
    });

    it('returns the minimum experience when the rewardee is more than 15 levels above the target', () =>
    {
      // Arrange: levelDifference = levelB - levelA = 5 - 25 = -20, below the -15 floor.
      const result = ExperienceManager.calculateRewardFromLevelDifference(25, 5);

      // Assert
      expect(result).toBe(0);
    });

    it('returns the maximum experience when the rewardee is more than 15 levels below the target', () =>
    {
      // Arrange: levelDifference = levelB - levelA = 25 - 5 = 20, above the +15 ceiling.
      const result = ExperienceManager.calculateRewardFromLevelDifference(5, 25);

      // Assert
      expect(result).toBe(1000);
    });

    it('returns the mapped experience at the lower boundary of the difference map', () =>
    {
      // Arrange: levelDifference = levelB - levelA = 5 - 20 = -15.
      const result = ExperienceManager.calculateRewardFromLevelDifference(20, 5);

      // Assert
      expect(result).toBe(0);
    });

    it('returns the mapped experience at the upper boundary of the difference map', () =>
    {
      // Arrange: levelDifference = levelB - levelA = 20 - 5 = 15.
      const result = ExperienceManager.calculateRewardFromLevelDifference(5, 20);

      // Assert
      expect(result).toBe(1000);
    });

    it('returns the mapped experience for a target one level above the rewardee', () =>
    {
      // Arrange: levelDifference = levelB - levelA = 11 - 10 = 1.
      const result = ExperienceManager.calculateRewardFromLevelDifference(10, 11);

      // Assert
      expect(result).toBe(30);
    });

    it('returns the mapped experience for a target one level below the rewardee', () =>
    {
      // Arrange: levelDifference = levelB - levelA = 9 - 10 = -1.
      const result = ExperienceManager.calculateRewardFromLevelDifference(10, 9);

      // Assert
      expect(result).toBe(22);
    });

    it('scales the mapped experience by the configured policy multiplier', () =>
    {
      // Arrange
      globalThis.J.LEVEL.EXT.FLAT.Metadata.policyMultiplier = 2.0;

      // Act: parity (diff 0) base is 25, doubled by the multiplier.
      const result = ExperienceManager.calculateRewardFromLevelDifference(10, 10);

      // Assert
      expect(result).toBe(50);
    });

    it('rounds the scaled experience to the nearest integer', () =>
    {
      // Arrange
      globalThis.J.LEVEL.EXT.FLAT.Metadata.policyMultiplier = 0.5;

      // Act: parity (diff 0) base is 25, halved to 12.5, rounds to 13.
      const result = ExperienceManager.calculateRewardFromLevelDifference(10, 10);

      // Assert
      expect(result).toBe(13);
    });

    it('floors the scaled experience at the minimum experience even with a negative multiplier', () =>
    {
      // Arrange
      globalThis.J.LEVEL.EXT.FLAT.Metadata.policyMultiplier = -1.0;

      // Act
      const result = ExperienceManager.calculateRewardFromLevelDifference(10, 10);

      // Assert
      expect(result).toBe(0);
    });
  });
});
//endregion plugins/level/ext/flat/managers/experience-manager.test.js
