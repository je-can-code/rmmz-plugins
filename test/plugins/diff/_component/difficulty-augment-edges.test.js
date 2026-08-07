//region plugins/diff/_component/difficulty-augment-edges.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installDiffHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJDiff,
} from './fixtures/install-diff-host-globals.js';

/**
 * Every place the applied difficulty reaches into a battler or into the party's budget.
 *
 * The multipliers here are the entire plugin: a difficulty is not a switch that swaps behavior, it is
 * a set of percentages that every parameter and every reward is quietly filtered through. That makes
 * these augments unusually easy to get subtly wrong and unusually hard to notice - a param scaled
 * against the wrong table still produces a plausible number.
 */
describe('J-Difficulty augment edges', () =>
{
  /**
   * Builds the applied difficulty the augments read their multipliers off.
   * @param {object=} overrides Which multiplier blocks to change.
   * @returns {object} The applied difficulty stand-in.
   */
  const appliedDifficulty = (overrides = {}) => ({
    actorEffects: {
      bparams: Array(8)
        .fill(100),
      sparams: Array(10)
        .fill(100),
      xparams: Array(10)
        .fill(100),
    },
    enemyEffects: {
      bparams: Array(8)
        .fill(100),
      sparams: Array(10)
        .fill(100),
      xparams: Array(10)
        .fill(100),
    },
    rewards: {
      exp: 100,
      gold: 100,
      drops: 100,
      sdp: 100,
    },
    ...overrides,
  });

  beforeAll(async () =>
  {
    vi.resetModules();

    installDiffHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJDiff();
    await import('../../../../src/plugins/diff/core/_metadata/initialization.js');

    // both optional siblings present, so the reward augments they gate actually get defined.
    globalThis.J.DROPS = {};
    globalThis.J.SDP = {};

    // the methods those siblings own, and the engine hook `onAfterLoad` extends. An alias captures
    // whatever sits here at import time, so these must exist before the patches land or the chain
    // captures undefined and detonates on the first call.
    globalThis.Game_Enemy.prototype.getBaseDropRate = function()
    {
      return 10;
    };

    globalThis.Game_Enemy.prototype.sdpPoints = function()
    {
      return 20;
    };

    globalThis.Game_System.prototype.onAfterLoad = function()
    {
    };

    await import('../../../../src/plugins/diff/core/objects/Game_System.js');
    await import('../../../../src/plugins/diff/core/objects/Game_Temp.js');
    await import('../../../../src/plugins/diff/core/objects/Game_Actor.js');
    await import('../../../../src/plugins/diff/core/objects/Game_Enemy.js');
  });

  beforeEach(() =>
  {
    globalThis.$gameSystem = new globalThis.Game_System();
    globalThis.$gameSystem.initialize();
    globalThis.$gameTemp = new globalThis.Game_Temp();
    globalThis.$gameTemp.initMembers();
  });

  //region the actor side
  describe('Game_Actor.xparam()', () =>
  {
    it('scales the ex-parameter by the applied difficulty', () =>
    {
      // Arrange
      const actor = new globalThis.Game_Actor();
      actor.initMembers();
      const difficulty = appliedDifficulty();
      difficulty.actorEffects.xparams[1] = 50;
      globalThis.$gameTemp.getAppliedDifficulty = () => difficulty;

      // Act
      const result = actor.xparam(1);

      // Assert: unrounded on purpose - ex-parameters are rates, and rounding a 0.05 evasion to zero
      // would silently delete the stat rather than halve it.
      const original = globalThis.J.DIFFICULTY.Aliased.Game_Actor.get('xparam')
        .call(actor, 1);
      expect(result)
        .toBe(original * 0.5);
    });
  });
  //endregion the actor side

  //region the enemy side
  describe('Game_Enemy.param()', () =>
  {
    it('scales the base parameter by the applied difficulty and rounds it', () =>
    {
      // Arrange: base parameters are whole numbers everywhere else in the engine, so this one rounds
      // where the rate-shaped ones deliberately do not.
      const enemy = new globalThis.Game_Enemy();
      enemy.initMembers();
      const difficulty = appliedDifficulty();
      difficulty.enemyEffects.bparams[0] = 250;
      globalThis.$gameTemp.getAppliedDifficulty = () => difficulty;

      // Act
      const result = enemy.param(0);

      // Assert
      const original = globalThis.J.DIFFICULTY.Aliased.Game_Enemy.get('param')
        .call(enemy, 0);
      expect(result)
        .toBe(Math.round(original * 2.5));
    });
  });

  describe('Game_Enemy.sparam()', () =>
  {
    it('scales the special parameter by the applied difficulty', () =>
    {
      // Arrange
      const enemy = new globalThis.Game_Enemy();
      enemy.initMembers();
      const difficulty = appliedDifficulty();
      difficulty.enemyEffects.sparams[2] = 50;
      globalThis.$gameTemp.getAppliedDifficulty = () => difficulty;

      // Act
      const result = enemy.sparam(2);

      // Assert
      const original = globalThis.J.DIFFICULTY.Aliased.Game_Enemy.get('sparam')
        .call(enemy, 2);
      expect(result)
        .toBe(original * 0.5);
    });
  });

  describe('Game_Enemy.xparam()', () =>
  {
    it('scales the ex-parameter by the applied difficulty', () =>
    {
      // Arrange
      const enemy = new globalThis.Game_Enemy();
      enemy.initMembers();
      const difficulty = appliedDifficulty();
      difficulty.enemyEffects.xparams[3] = 200;
      globalThis.$gameTemp.getAppliedDifficulty = () => difficulty;

      // Act
      const result = enemy.xparam(3);

      // Assert
      const original = globalThis.J.DIFFICULTY.Aliased.Game_Enemy.get('xparam')
        .call(enemy, 3);
      expect(result)
        .toBe(original * 2);
    });
  });
  //endregion the enemy side

  //region the rewards
  describe('Game_Enemy.exp()', () =>
  {
    it('scales the experience reward by the applied difficulty', () =>
    {
      // Arrange
      const enemy = new globalThis.Game_Enemy();
      enemy.initMembers();
      const difficulty = appliedDifficulty();
      difficulty.rewards.exp = 150;
      globalThis.$gameTemp.getAppliedDifficulty = () => difficulty;

      // Act
      const result = enemy.exp();

      // Assert
      const original = globalThis.J.DIFFICULTY.Aliased.Game_Enemy.get('exp')
        .call(enemy);
      expect(result)
        .toBe(Math.round(original * 1.5));
    });
  });

  describe('Game_Enemy.gold()', () =>
  {
    it('scales the gold reward by the applied difficulty', () =>
    {
      // Arrange
      const enemy = new globalThis.Game_Enemy();
      enemy.initMembers();
      const difficulty = appliedDifficulty();
      difficulty.rewards.gold = 50;
      globalThis.$gameTemp.getAppliedDifficulty = () => difficulty;

      // Act
      const result = enemy.gold();

      // Assert
      const original = globalThis.J.DIFFICULTY.Aliased.Game_Enemy.get('gold')
        .call(enemy);
      expect(result)
        .toBe(Math.round(original * 0.5));
    });
  });

  describe('Game_Enemy.getBaseDropRate()', () =>
  {
    it('scales the drop rate by the applied difficulty when J-DropsControl is installed', () =>
    {
      // Arrange: this augment only exists at all when the drops plugin is present, since without it
      // there is no base drop rate to multiply.
      const enemy = new globalThis.Game_Enemy();
      enemy.initMembers();
      const difficulty = appliedDifficulty();
      difficulty.rewards.drops = 200;
      globalThis.$gameTemp.getAppliedDifficulty = () => difficulty;

      // Act
      const result = enemy.getBaseDropRate();

      // Assert
      const original = globalThis.J.DIFFICULTY.Aliased.Game_Enemy.get('getBaseDropRate')
        .call(enemy);
      expect(result)
        .toBe(Math.round(original * 2));
    });
  });

  describe('Game_Enemy.sdpPoints()', () =>
  {
    it('scales the sdp reward by the applied difficulty when J-SDP is installed', () =>
    {
      // Arrange
      const enemy = new globalThis.Game_Enemy();
      enemy.initMembers();
      const difficulty = appliedDifficulty();
      difficulty.rewards.sdp = 300;
      globalThis.$gameTemp.getAppliedDifficulty = () => difficulty;

      // Act
      const result = enemy.sdpPoints();

      // Assert
      const original = globalThis.J.DIFFICULTY.Aliased.Game_Enemy.get('sdpPoints')
        .call(enemy);
      expect(result)
        .toBe(Math.round(original * 3));
    });
  });
  //endregion the rewards

  //region the layer point budget
  describe('Game_System layer points', () =>
  {
    it('sets and reads the ceiling on how much difficulty can be stacked', () =>
    {
      // Arrange
      // Act
      globalThis.$gameSystem.setLayerPointMax(30);

      // Assert
      expect(globalThis.$gameSystem.getLayerPointMax())
        .toBe(30);
    });

    it('raises the ceiling by a modifier rather than replacing it', () =>
    {
      // Arrange: story progress hands out budget in increments, so the modifier form is what an
      // event actually calls.
      globalThis.$gameSystem.setLayerPointMax(30);

      // Act
      globalThis.$gameSystem.modLayerPointMax(5);

      // Assert
      expect(globalThis.$gameSystem.getLayerPointMax())
        .toBe(35);
    });

    it('sets and reads how much budget is currently spent', () =>
    {
      // Arrange
      // Act
      globalThis.$gameSystem.setLayerPoints(12);

      // Assert
      expect(globalThis.$gameSystem.getLayerPoints())
        .toBe(12);
    });

    it('adjusts the spend by a modifier rather than replacing it', () =>
    {
      // Arrange
      globalThis.$gameSystem.setLayerPoints(12);

      // Act
      globalThis.$gameSystem.modLayerPoints(-4);

      // Assert
      expect(globalThis.$gameSystem.getLayerPoints())
        .toBe(8);
    });

    it('reports what is left as the ceiling minus the spend', () =>
    {
      // Arrange: this is what every layer's `canPayCost` is measured against, so a sign error here
      // would let the player stack difficulties they never paid for.
      globalThis.$gameSystem.setLayerPointMax(30);
      globalThis.$gameSystem.setLayerPoints(12);

      // Act
      const remaining = globalThis.$gameSystem.getRemainingLayerPoints();

      // Assert
      expect(remaining)
        .toBe(18);
    });
  });

  describe('Game_System.registerDifficultyConfig()', () =>
  {
    it('registers a configuration the system has not seen before', () =>
    {
      // Arrange
      const config = {
        key: 'brutal',
        unlocked: false,
        hidden: false,
        enabled: false,
      };

      // Act
      globalThis.$gameSystem.registerDifficultyConfig(config);

      // Assert
      expect(globalThis.$gameSystem.getDifficultyConfigByKey('brutal'))
        .toBe(config);
    });

    it('leaves an already-registered configuration alone', () =>
    {
      // Arrange: this runs on every boot against a savefile that already carries the player's
      // choices, and overwriting would silently reset every difficulty they had unlocked.
      const original = {
        key: 'brutal',
        unlocked: true,
        hidden: false,
        enabled: true,
      };
      globalThis.$gameSystem.registerDifficultyConfig(original);

      // Act
      globalThis.$gameSystem.registerDifficultyConfig({
        key: 'brutal',
        unlocked: false,
        hidden: false,
        enabled: false,
      });

      // Assert
      expect(globalThis.$gameSystem.getDifficultyConfigByKey('brutal'))
        .toBe(original);
    });
  });

  describe('Game_System.onAfterLoad()', () =>
  {
    it('rebuilds the difficulty layers from the latest plugin metadata', () =>
    {
      // Arrange: the layers themselves are metadata rather than save data, so a savefile written
      // before a rebalance has to pick up the new numbers rather than its own frozen copy.
      const setupDifficultySystem = vi.spyOn(globalThis.$gameTemp, 'setupDifficultySystem');

      // Act
      globalThis.$gameSystem.onAfterLoad();

      // Assert
      expect(setupDifficultySystem)
        .toHaveBeenCalled();

      setupDifficultySystem.mockRestore();
    });
  });
  //endregion the layer point budget
});
//endregion plugins/diff/_component/difficulty-augment-edges.test.js