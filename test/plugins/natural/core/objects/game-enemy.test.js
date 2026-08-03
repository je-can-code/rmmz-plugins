//region plugins/natural/core/objects/game-enemy.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installNaturalHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJNatural,
} from '../../_component/fixtures/install-natural-host-globals.js';

/**
 * Enemies get buffs but never growth - they have no levels to grow with - so every natural bonus
 * on an enemy resolves through the buff path alone. That makes the parameter overrides here pure
 * pass-throughs that add the buff onto whatever the engine already computed, and the thing worth
 * pinning is that they stay additive: an enemy with no tags at all must read exactly the same
 * parameters it would have without this plugin installed.
 */
describe('J-NaturalGrowth Game_Enemy (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installNaturalHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    await import('../../../../../src/plugins/_base/core/objects/Game_BattlerBase.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Battler.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Enemy.js');

    setPluginContextToJNatural();
    await import('../../../../../src/plugins/natural/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/natural/core/objects/Game_Battler.js');
    await import('../../../../../src/plugins/natural/core/objects/Game_Enemy.js');
  });

  let enemy;

  beforeEach(() =>
  {
    enemy = new globalThis.Game_Enemy();
    enemy.initMembers();

    // the engine-side parameter lookups need a data row to read from; a flat set of known values
    // makes the additive contract below observable as exact numbers.
    enemy.paramBase = function()
    {
      return 100;
    };
  });

  //region base parameters
  describe('paramBaseNaturalBonuses', () =>
  {
    it('contributes nothing to an enemy carrying no buffs', () =>
    {
      // Arrange: an untagged enemy must read exactly as it would without this plugin.
      // Act
      const result = enemy.paramBaseNaturalBonuses(0);

      // Assert
      expect(result).toBe(0);
    });

    it('contributes the buff once one is applied', () =>
    {
      // Arrange: a flat-only buff resolves to exactly itself regardless of the base the engine
      // reports, which keeps this assertion independent of enemy database values. The compound
      // flat-and-rate case is asserted against an explicit base further below.
      enemy.setBparamBuffPlus(0, 20);

      // Act
      const result = enemy.paramBaseNaturalBonuses(0);

      // Assert
      expect(result).toBeCloseTo(20, 10);
    });

    it('contributes nothing for a parameter id with no regex mapping', () =>
    {
      // Arrange & Act
      const result = enemy.paramBaseNaturalBonuses(99);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('getParamBaseNaturalBonuses', () =>
  {
    it('resolves an enemy base parameter bonus purely from its buff', () =>
    {
      // Arrange: enemies have no growth at all, so the buff is the whole contribution.
      enemy.setBparamBuffPlus(2, 15);

      // Act
      const result = enemy.getParamBaseNaturalBonuses(2, 100);

      // Assert
      expect(result).toBeCloseTo(15, 10);
    });

    it('compounds a flat and rate base parameter buff against a known base', () =>
    {
      // Arrange: base parameter BUFF rates are stored as fractions rather than percentages -
      // 0.1 means ten percent - because the value is divided down when the formula is first
      // evaluated and must not be divided a second time here. This differs from every other
      // rate in the plugin (ex-param, sp-param, HAR, max tp, and base parameter GROWTH all take
      // whole percentages through calculatePlusRate), so the two are not interchangeable.
      enemy.setBparamBuffPlus(2, 20);
      enemy.setBparamBuffRate(2, 0.1);

      // Act
      const result = enemy.getParamBaseNaturalBonuses(2, 100);

      // Assert: 100 * 0.1 + 20.
      expect(result).toBeCloseTo(30, 10);
    });

    it('scales the base parameter buff rate against the base rather than against the total', () =>
    {
      // Arrange: unlike the percentage-based rates, a base parameter buff applies its rate to
      // the base alone and then adds the flat bonus on top, so plus and rate do not compound.
      enemy.setBparamBuffPlus(2, 50);
      enemy.setBparamBuffRate(2, 0.5);

      // Act
      const result = enemy.getParamBaseNaturalBonuses(2, 200);

      // Assert: 200 * 0.5 + 50, not (200 + 50) * 1.5 - 200.
      expect(result).toBeCloseTo(150, 10);
    });
  });
  //endregion base parameters

  //region ex parameters
  describe('xparamNaturalBonuses', () =>
  {
    it('contributes nothing to an enemy carrying no ex-parameter buffs', () =>
    {
      // Arrange & Act
      const result = enemy.xparamNaturalBonuses(0);

      // Assert
      expect(result).toBe(0);
    });

    it('contributes nothing for an ex-parameter id with no regex mapping', () =>
    {
      // Arrange & Act
      const result = enemy.xparamNaturalBonuses(99);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('getXparamNaturalBonuses', () =>
  {
    it('resolves an enemy ex-parameter bonus purely from its buff', () =>
    {
      // Arrange
      enemy.setXparamBuffPlus(0, 20);
      enemy.setXparamBuffRate(0, 10);

      // Act
      const result = enemy.getXparamNaturalBonuses(0, 100);

      // Assert
      expect(result).toBeCloseTo(32, 10);
    });
  });

  describe('xparam', () =>
  {
    it('adds the natural bonus on top of the engine ex-parameter', () =>
    {
      // Arrange
      const before = enemy.xparam(0);
      enemy.setXparamBuffPlus(0, 5);

      // Act
      const after = enemy.xparam(0);

      // Assert
      expect(after - before).toBeCloseTo(5, 10);
    });
  });
  //endregion ex parameters

  //region sp parameters
  describe('sparamNaturalBonuses', () =>
  {
    it('contributes nothing to an enemy carrying no sp-parameter buffs', () =>
    {
      // Arrange & Act
      const result = enemy.sparamNaturalBonuses(0);

      // Assert
      expect(result).toBe(0);
    });

    it('contributes nothing for an sp-parameter id with no regex mapping', () =>
    {
      // Arrange & Act
      const result = enemy.sparamNaturalBonuses(99);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('getSparamNaturalBonuses', () =>
  {
    it('resolves an enemy sp-parameter bonus purely from its buff', () =>
    {
      // Arrange
      enemy.setSparamBuffPlus(0, 20);
      enemy.setSparamBuffRate(0, 10);

      // Act
      const result = enemy.getSparamNaturalBonuses(0, 100);

      // Assert
      expect(result).toBeCloseTo(32, 10);
    });
  });

  describe('sparam', () =>
  {
    it('adds the natural bonus on top of the engine sp-parameter', () =>
    {
      // Arrange
      const before = enemy.sparam(0);
      enemy.setSparamBuffPlus(0, 5);

      // Act
      const after = enemy.sparam(0);

      // Assert
      expect(after - before).toBeCloseTo(5, 10);
    });
  });
  //endregion sp parameters

  //region max tp
  describe('maxTp', () =>
  {
    it('reports the calculated max tp rather than the engine default', () =>
    {
      // Arrange: the engine-side base and its trait bonuses read from the enemy database row,
      // which is not what this override is responsible for- pin them so the assertion isolates
      // the natural contribution.
      enemy.getBaseMaxTp = () => 100;
      enemy.getBaseMaxTpBonuses = () => 0;
      const before = enemy.maxTp();
      enemy.setMaxTpBuffPlus(12);

      // Act
      const after = enemy.maxTp();

      // Assert
      expect(after - before).toBeCloseTo(12, 10);
    });
  });
  //endregion max tp

  //region data change
  describe('onBattlerDataChange', () =>
  {
    it('refreshes every parameter buff, since the data behind them just changed', () =>
    {
      // Arrange: states and equipment carry buff tags, so anything altering the battler's data
      // invalidates the cached buff values computed from it.
      let refreshed = false;
      enemy.refreshAllParameterBuffs = function()
      {
        refreshed = true;
      };

      // Act
      enemy.onBattlerDataChange();

      // Assert
      expect(refreshed).toBe(true);
    });
  });
  //endregion data change
});
//endregion plugins/natural/core/objects/game-enemy.test.js