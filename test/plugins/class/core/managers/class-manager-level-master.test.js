//region plugins/class/core/managers/class-manager-level-master.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { installClassLevelMasterRealm } from '../_component/fixtures/install-class-level-master-realm.js';

/**
 * J-Classes' measure for Max Tech under J-LevelMaster, which gives max tech a curve through a class's
 * `<mtpGrowthCurve>` tag: a class authored as its starting class's curve times some number shows that number,
 * the same way a base parameter's curve does.
 */
describe('ClassManager (under J-LevelMaster)', () =>
{
  let ClassManager;

  beforeAll(async () =>
  {
    await installClassLevelMasterRealm();

    ({ default: ClassManager } = await import('../../../../../src/plugins/class/core/managers/ClassManager.js'));
  });

  beforeEach(() =>
  {
    // actor 1 wears the starting class, at level one.
    const actor = globalThis.$gameActors.actor(1);
    actor.changeClass(1, true);
    actor.changeLevel(1, false);
  });

  describe('referenceValue()', () =>
  {
    it('measures Max Tech by its curve, which has no row in the params table', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const value = ClassManager.referenceValue(actor, 2, 'mtp');

      // Assert- the starting class's 3120 at level 99, times Brawler's 1.20.
      expect(value)
        .toBe(3744);
    });
  });

  describe('maxTpCurveValue()', () =>
  {
    it('reads a class\'s curve at level 99, the base max tech J-LevelMaster gives an actor there', () =>
    {
      // Arrange
      // Act
      const value = ClassManager.maxTpCurveValue(1);

      // Assert- 180, and 30 more for each of the 98 levels after the first.
      expect(value)
        .toBe(3120);
    });

    it('measures nothing for a class with no curve', () =>
    {
      // Arrange- Scholar carries no Max Tech curve, and Brawler, beside it, does.
      // Act
      const scholar = ClassManager.maxTpCurveValue(3);
      const brawler = ClassManager.maxTpCurveValue(2);

      // Assert- Brawler's reading proves curves are being read at all, so Scholar's nothing is its own.
      expect(scholar)
        .toBe(0);
      expect(brawler)
        .toBe(3744);
    });
  });

  describe('multiplierText()', () =>
  {
    it('shows the multiplier Max Tech\'s curve was authored with', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const text = ClassManager.multiplierText(actor, 2, 'mtp');

      // Assert
      expect(text)
        .toBe('×1.20');
    });
  });
});
//endregion plugins/class/core/managers/class-manager-level-master.test.js
