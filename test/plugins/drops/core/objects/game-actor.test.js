//region plugins/drops/core/objects/game-actor.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installDropsHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJDrops,
} from '../../_component/fixtures/install-drops-host-globals.js';

/**
 * Actors are where reward bonuses actually come from - notetags on their equipment and states, SDP
 * panels they have ranked, and permanent growth accrued per level. The two multipliers are
 * assembled the same way and differ only in which tag and which panel key they read, so they share
 * an assembler; the drop side then layers natural growth on top, which gold has no equivalent of.
 * Every battler exposes `gdr`/`dor` so enemies can be asked the same question and answer zero.
 */
describe('J-DropsControl Game_Actor (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installDropsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/managers/RPGManager.js'));

    await import('../../../../../src/plugins/_base/objects/Game_BattlerBase.js');
    await import('../../../../../src/plugins/_base/objects/Game_Battler.js');

    // stand in for what J-NaturalGrowth contributes, so the growth path can be driven.
    globalThis.Game_Battler.prototype.initNaturalGrowthParameters = function()
    {
      this._j ||= {};
      this._j._natural ||= {};
    };
    globalThis.Game_Battler.prototype.calculatePlusRate = function(baseValue, paramPlus, paramRate)
    {
      return ((baseValue + paramPlus) * ((paramRate + 100) / 100)) - baseValue;
    };
    globalThis.Game_Actor.prototype.applyNaturalCustomGrowths = function()
    {
    };
    globalThis.Game_Actor.prototype.naturalParamBuff = function()
    {
      return this.__growthPerLevel ?? 0;
    };

    setPluginContextToJDrops();
    await import('../../../../../src/plugins/drops/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/drops/core/objects/Game_Battler.js');
    await import('../../../../../src/plugins/drops/core/objects/Game_Actor.js');
  });

  let actor;
  let previousNatural;
  let previousSdp;

  beforeEach(() =>
  {
    previousNatural = globalThis.J.NATURAL;
    previousSdp = globalThis.J.SDP;
    globalThis.J.NATURAL = {};

    actor = new globalThis.Game_Actor();
    actor.initMembers();
    actor.initNaturalGrowthParameters();
    actor.getAllNotes = function()
    {
      return this.__notes ?? [];
    };
  });

  /**
   * Restores the bare-global namespaces so a scenario that toggles one cannot leak into the next.
   */
  function restoreNamespaces()
  {
    globalThis.J.NATURAL = previousNatural;
    globalThis.J.SDP = previousSdp;
  }

  //region multiplier assembly
  describe('rewardMultiplierFactor', () =>
  {
    it('contributes nothing from an actor carrying no tags or panels', () =>
    {
      // Arrange
      globalThis.J.SDP = undefined;

      // Act
      const result = actor.rewardMultiplierFactor(globalThis.J.DROPS.RegExp.DropMultiplier, 'dor');

      // Assert
      expect(result).toBe(0);

      restoreNamespaces();
    });

    it('scales summed percent-points down into a factor', () =>
    {
      // Arrange: a tag granting twenty percent-points becomes a factor of 0.2 that callers add
      // on top of a neutral base.
      globalThis.J.SDP = undefined;
      actor.__notes = [ { note: '<dropMultiplier:20>' } ];

      // Act
      const result = actor.rewardMultiplierFactor(globalThis.J.DROPS.RegExp.DropMultiplier, 'dor');

      // Assert
      expect(result).toBeCloseTo(0.2, 10);
    });

    it('sums panel bonuses with notetag bonuses before scaling', () =>
    {
      // Arrange: both are expressed in percent-points, so they have to be added before the
      // divide rather than each being scaled and rounded separately.
      globalThis.J.SDP = {};
      actor.getSdpBonusForParameterKey = () => 5;
      actor.__notes = [ { note: '<dropMultiplier:20>' } ];

      // Act
      const result = actor.rewardMultiplierFactor(globalThis.J.DROPS.RegExp.DropMultiplier, 'dor');

      // Assert
      expect(result).toBeCloseTo(0.25, 10);

      restoreNamespaces();
    });

    it('asks nothing of panels when SDP is not installed', () =>
    {
      // Arrange: J-SDP is optional, and its bonus accessor only exists when it is present.
      globalThis.J.SDP = undefined;
      actor.__notes = [ { note: '<dropMultiplier:20>' } ];

      // Act
      const act = () => actor.rewardMultiplierFactor(globalThis.J.DROPS.RegExp.DropMultiplier, 'dor');

      // Assert
      expect(act).not.toThrow();

      restoreNamespaces();
    });
  });

  describe('getGoldMultiplier', () =>
  {
    it('reads the gold tag rather than the drop tag', () =>
    {
      // Arrange: the two multipliers share an assembler, so it matters that each passes its own
      // structure- swapping them would make gold respond to drop tags.
      globalThis.J.SDP = undefined;
      actor.__notes = [ { note: '<goldMultiplier:30>' } ];

      // Act
      const result = actor.getGoldMultiplier();

      // Assert
      expect(result).toBeCloseTo(0.3, 10);

      restoreNamespaces();
    });

    it('ignores a drop multiplier tag entirely', () =>
    {
      // Arrange
      globalThis.J.SDP = undefined;
      actor.__notes = [ { note: '<dropMultiplier:30>' } ];

      // Act
      const result = actor.getGoldMultiplier();

      // Assert
      expect(result).toBe(0);

      restoreNamespaces();
    });
  });

  describe('getDropMultiplierBonus', () =>
  {
    it('adds natural growth on top of the assembled factor', () =>
    {
      // Arrange: growth is the part gold has no counterpart for.
      globalThis.J.SDP = undefined;
      actor.__notes = [ { note: '<dropMultiplier:20>' } ];
      actor.modDorPlus(10);

      // Act
      const result = actor.getDropMultiplierBonus();

      // Assert
      expect(result).toBeCloseTo(10.2, 10);

      restoreNamespaces();
    });
  });
  //endregion multiplier assembly

  //region battler-wide properties
  describe('gdr and dor properties', () =>
  {
    it('reports zero for a battler with no reward model of its own', () =>
    {
      // Arrange: enemies answer the same questions actors do, so every consumer can ask without
      // first working out what kind of battler it is holding.
      const battler = new globalThis.Game_Battler();
      battler.initMembers();

      // Act & Assert
      expect([ battler.gdr, battler.dor ]).toEqual([ 0, 0 ]);

      restoreNamespaces();
    });

    it('routes an actor gdr through its gold multiplier', () =>
    {
      // Arrange
      globalThis.J.SDP = undefined;
      actor.__notes = [ { note: '<goldMultiplier:30>' } ];

      // Act & Assert
      expect(actor.gdr).toBeCloseTo(0.3, 10);

      restoreNamespaces();
    });

    it('routes an actor dor through its drop multiplier', () =>
    {
      // Arrange
      globalThis.J.SDP = undefined;
      actor.__notes = [ { note: '<dropMultiplier:20>' } ];

      // Act & Assert
      expect(actor.dor).toBeCloseTo(0.2, 10);

      restoreNamespaces();
    });
  });
  //endregion battler-wide properties

  //region growth application
  describe('applyNaturalCustomGrowths', () =>
  {
    it('accrues drop rate growth on level up', () =>
    {
      // Arrange
      actor.__growthPerLevel = 3;

      // Act
      actor.applyNaturalCustomGrowths();

      // Assert
      expect(actor.dorPlus()).toBeCloseTo(3, 10);

      restoreNamespaces();
    });

    it('accrues nothing when natural growth is not installed', () =>
    {
      // Arrange: without that plugin there is no growth model for drop rate to participate in.
      actor.__growthPerLevel = 3;
      globalThis.J.NATURAL = undefined;

      // Act
      actor.applyNaturalCustomGrowths();

      // Assert
      expect(actor.dorPlus()).toBe(0);

      restoreNamespaces();
    });

    it('accumulates across repeated level ups', () =>
    {
      // Arrange: growth is permanent and additive, so two levels grant twice.
      actor.__growthPerLevel = 3;

      // Act
      actor.applyNaturalCustomGrowths();
      actor.applyNaturalCustomGrowths();

      // Assert
      expect(actor.dorPlus()).toBeCloseTo(6, 10);

      restoreNamespaces();
    });

    it('accrues the rate growth alongside the flat one', () =>
    {
      // Arrange
      actor.__growthPerLevel = 4;

      // Act
      actor.applyNaturalDorGrowths();

      // Assert
      expect(actor.dorRate()).toBeCloseTo(4, 10);

      restoreNamespaces();
    });
  });
  //endregion growth application
});
//endregion plugins/drops/core/objects/game-actor.test.js