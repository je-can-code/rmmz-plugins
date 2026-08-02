//region plugins/drops/core/objects/game-battler.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installDropsHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJDrops,
} from '../../_component/fixtures/install-drops-host-globals.js';

/**
 * Drop rate ("dor") is registered as a natural-growth parameter, which makes the whole family here
 * conditional on J-NaturalGrowth being installed. That plugin is optional, and the guard is not
 * cosmetic: the aliased method this file wraps is *defined by* J-NaturalGrowth, so without it the
 * alias holds nothing to call. Both arms therefore matter - the working path when it is present,
 * and a clean no-op when it is not.
 */
describe('J-DropsControl Game_Battler drop rate (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installDropsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    await import('../../../../../src/plugins/_base/core/objects/Game_BattlerBase.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Battler.js');

    // stand in for the pieces J-NaturalGrowth contributes: the method this plugin aliases, and
    // the shared plus/rate arithmetic every natural parameter is resolved through.
    globalThis.Game_Battler.prototype.initNaturalGrowthParameters = function()
    {
      this._j ||= {};
      this._j._natural ||= {};
    };
    globalThis.Game_Battler.prototype.calculatePlusRate = function(baseValue, paramPlus, paramRate)
    {
      return ((baseValue + paramPlus) * ((paramRate + 100) / 100)) - baseValue;
    };
    globalThis.Game_Battler.prototype.getAllNotes = function()
    {
      return this.__notes ?? [];
    };

    setPluginContextToJDrops();
    await import('../../../../../src/plugins/drops/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/drops/core/objects/Game_Battler.js');
  });

  let battler;
  let previousNatural;

  beforeEach(() =>
  {
    previousNatural = globalThis.J.NATURAL;
    globalThis.J.NATURAL = {};

    battler = new globalThis.Game_Battler();
    battler.initNaturalGrowthParameters();
  });

  /**
   * Restores the bare-global namespace so a scenario that toggles it cannot leak into the next.
   */
  function restoreNatural()
  {
    globalThis.J.NATURAL = previousNatural;
  }

  //region accessors
  describe('drop rate accessors', () =>
  {
    it('starts both drop rate bonuses at zero', () =>
    {
      // Arrange & Act & Assert
      expect([ battler.dorPlus(), battler.dorRate() ]).toEqual([ 0, 0 ]);

      restoreNatural();
    });

    it('accumulates the flat bonus, since growth is gained per level', () =>
    {
      // Arrange & Act
      battler.modDorPlus(5);
      battler.modDorPlus(3);

      // Assert
      expect(battler.dorPlus()).toBe(8);

      restoreNatural();
    });

    it('accumulates the multiplicative bonus', () =>
    {
      // Arrange & Act
      battler.modDorRate(10);
      battler.modDorRate(15);

      // Assert
      expect(battler.dorRate()).toBe(25);

      restoreNatural();
    });
  });
  //endregion accessors

  //region growths
  describe('dorNaturalGrowths', () =>
  {
    it('contributes nothing on a battler that has grown none', () =>
    {
      // Arrange & Act
      const result = battler.dorNaturalGrowths();

      // Assert
      expect(result).toBe(0);

      restoreNatural();
    });

    it('resolves an accumulated flat growth', () =>
    {
      // Arrange: growth is measured against a base of zero, since drop rate has no engine-side
      // base parameter for it to scale off.
      battler.modDorPlus(20);

      // Act
      const result = battler.dorNaturalGrowths();

      // Assert
      expect(result).toBeCloseTo(20, 10);

      restoreNatural();
    });

    it('compounds an accumulated flat and rate growth', () =>
    {
      // Arrange
      battler.modDorPlus(20);
      battler.modDorRate(50);

      // Act
      const result = battler.dorNaturalGrowths();

      // Assert
      expect(result).toBeCloseTo(30, 10);

      restoreNatural();
    });
  });
  //endregion growths

  //region buffs
  describe('dorNaturalBuffs', () =>
  {
    it('contributes nothing on a battler with no drop rate tags', () =>
    {
      // Arrange & Act
      const result = battler.dorNaturalBuffs();

      // Assert
      expect(result).toBe(0);

      restoreNatural();
    });

    it('resolves a flat drop rate buff from a notetag', () =>
    {
      // Arrange
      battler.__notes = [ { note: '<dorBuffPlus:[15]>' } ];

      // Act
      const result = battler.dorNaturalBuffs();

      // Assert
      expect(result).toBeCloseTo(15, 10);

      restoreNatural();
    });
  });
  //endregion buffs

  //region composition
  describe('dorNaturalBonuses', () =>
  {
    it('sums buffs and growths rather than letting one shadow the other', () =>
    {
      // Arrange: buffs come and go with equipment while growth is permanent; a battler carrying
      // both must receive both.
      battler.__notes = [ { note: '<dorBuffPlus:[10]>' } ];
      battler.modDorPlus(25);

      // Act
      const result = battler.dorNaturalBonuses();

      // Assert
      expect(result).toBeCloseTo(35, 10);

      restoreNatural();
    });

    it('contributes nothing at all when natural growth is not installed', () =>
    {
      // Arrange: J-NaturalGrowth is optional, and drop rate simply has no growth model without
      // it- asking for one has to answer zero rather than reaching for absent machinery.
      battler.modDorPlus(25);
      globalThis.J.NATURAL = undefined;

      // Act
      const result = battler.dorNaturalBonuses();

      // Assert
      expect(result).toBe(0);

      restoreNatural();
    });
  });

  describe('initNaturalGrowthParameters', () =>
  {
    it('seeds both drop rate bonuses when natural growth is installed', () =>
    {
      // Arrange
      const fresh = new globalThis.Game_Battler();

      // Act
      fresh.initNaturalGrowthParameters();

      // Assert
      expect([ fresh.dorPlus(), fresh.dorRate() ]).toEqual([ 0, 0 ]);

      restoreNatural();
    });

    it('seeds nothing when natural growth is not installed', () =>
    {
      // Arrange: the method this extends is defined by J-NaturalGrowth itself, so without that
      // plugin there is nothing to call through to and nothing to seed.
      globalThis.J.NATURAL = undefined;
      const fresh = new globalThis.Game_Battler();

      // Act
      fresh.initNaturalGrowthParameters();

      // Assert
      expect(fresh._j).toBeUndefined();

      restoreNatural();
    });
  });
  //endregion composition
});
//endregion plugins/drops/core/objects/game-battler.test.js