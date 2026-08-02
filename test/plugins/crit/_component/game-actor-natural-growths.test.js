//region plugins/crit/_component/game-actor-natural-growths.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installCritHostGlobals,
  installNaturalCompanionStubs,
  setPluginContextToJBase,
  setPluginContextToJCrit,
} from './fixtures/install-crit-host-globals.js';

describe('J-CriticalFactors Game_Actor natural growths (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installCritHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/core/managers/RPGManager.js'));

    await import('../../../../src/plugins/_base/core/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/_base/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/_base/core/objects/Game_Actor.js');

    installNaturalCompanionStubs();

    // natural/core/objects/Game_Actor.js extends applyNaturalCustomGrowths() with unrelated HAR/param
    // growths; crit's own Game_Actor.js further extends that same hook, so the "previous layer" here
    // is a no-op stand-in for natural's own version.
    globalThis.Game_Actor.prototype.applyNaturalCustomGrowths = function()
    {
    };

    setPluginContextToJCrit();
    await import('../../../../src/plugins/crit/core/_metadata/initialization.js');

    await import('../../../../src/plugins/crit/core/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/crit/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/crit/core/objects/Game_Actor.js');
  });

  /**
   * @returns {object}
   */
  function buildActor()
  {
    const actor = new globalThis.Game_Actor();
    actor.getSdpBonusForParameterKey = () => 0;
    actor.initMembers();
    return actor;
  }

  describe('applyNaturalCustomGrowths', () =>
  {
    it('performs the original logic then applies cdm/ctr growths when J.NATURAL is loaded', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.applyNaturalCdmGrowths = vi.fn();
      actor.applyNaturalCtrGrowths = vi.fn();

      // Act
      actor.applyNaturalCustomGrowths();

      // Assert
      expect(actor.applyNaturalCdmGrowths).toHaveBeenCalledTimes(1);
      expect(actor.applyNaturalCtrGrowths).toHaveBeenCalledTimes(1);
    });

    it('skips cdm/ctr growths entirely when J.NATURAL is not loaded', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.applyNaturalCdmGrowths = vi.fn();
      actor.applyNaturalCtrGrowths = vi.fn();
      const savedNatural = globalThis.J.NATURAL;
      delete globalThis.J.NATURAL;

      // Act
      actor.applyNaturalCustomGrowths();

      // Assert
      expect(actor.applyNaturalCdmGrowths).not.toHaveBeenCalled();
      expect(actor.applyNaturalCtrGrowths).not.toHaveBeenCalled();

      globalThis.J.NATURAL = savedNatural;
    });
  });

  describe('applyNaturalCdmGrowths', () =>
  {
    it('derives growth from the cdm-regex-slot formulas and mods cdmPlus/cdmRate', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.__testNoteSources = [
        { note: '<critMultiplierBase: 100>' },
        { note: '<cdmGrowthPlus:[7]>' },
        { note: '<cdmGrowthRate:[3]>' },
      ];

      // Act
      actor.applyNaturalCdmGrowths();

      // Assert
      // getNaturalGrowthsRegexForCrit() destructures [ , , growthPlusStructure, growthRateStructure ]
      // as the CDM slots- CritDamageMultiplierGrowthPlus/Rate, matching the <cdmGrowthPlus>/<cdmGrowthRate> tags.
      expect(actor.cdmPlus()).toBe(7);
      expect(actor.cdmRate()).toBe(3);
    });
  });

  describe('applyNaturalCtrGrowths', () =>
  {
    it('derives growth from the ctr-regex-slot formulas and mods ctrPlus/ctrRate', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.__testNoteSources = [
        { note: '<critReductionBase: 50>' },
        { note: '<ctrGrowthPlus:[4]>' },
        { note: '<ctrGrowthRate:[2]>' },
      ];

      // Act
      actor.applyNaturalCtrGrowths();

      // Assert
      // getNaturalGrowthsRegexForCrit() destructures [ growthPlusStructure, growthRateStructure, , ]
      // as the CTR slots- CritTakenRateGrowthPlus/Rate, matching the <ctrGrowthPlus>/<ctrGrowthRate> tags.
      expect(actor.ctrPlus()).toBe(4);
      expect(actor.ctrRate()).toBe(2);
    });
  });

  describe('getNaturalGrowthsRegexForCrit', () =>
  {
    it('returns the four regexes in [ctrPlus, ctrRate, cdmPlus, cdmRate] order', () =>
    {
      // Arrange
      const actor = buildActor();

      // Act
      const [ ctrPlus, ctrRate, cdmPlus, cdmRate ] = actor.getNaturalGrowthsRegexForCrit();

      // Assert
      expect(ctrPlus).toBe(globalThis.J.CRIT.RegExp.CritTakenRateGrowthPlus);
      expect(ctrRate).toBe(globalThis.J.CRIT.RegExp.CritTakenRateGrowthRate);
      expect(cdmPlus).toBe(globalThis.J.CRIT.RegExp.CritDamageMultiplierGrowthPlus);
      expect(cdmRate).toBe(globalThis.J.CRIT.RegExp.CritDamageMultiplierGrowthRate);
    });
  });

  describe('critSdpBonuses', () =>
  {
    it('resolves the "cdm" parameter key for critParamId 0', () =>
    {
      // Arrange
      const actor = buildActor();
      const getSdpBonusForParameterKey = vi.fn(() => 42);
      actor.getSdpBonusForParameterKey = getSdpBonusForParameterKey;

      // Act & Assert
      expect(actor.critSdpBonuses(0, 0.5)).toBe(42);
      expect(getSdpBonusForParameterKey).toHaveBeenCalledWith('cdm', 0.5);
    });

    it('resolves the "ctr" parameter key for any non-zero critParamId', () =>
    {
      // Arrange
      const actor = buildActor();
      const getSdpBonusForParameterKey = vi.fn(() => 13);
      actor.getSdpBonusForParameterKey = getSdpBonusForParameterKey;

      // Act & Assert
      expect(actor.critSdpBonuses(1, 0.5)).toBe(13);
      expect(getSdpBonusForParameterKey).toHaveBeenCalledWith('ctr', 0.5);
    });
  });
});
//endregion plugins/crit/_component/game-actor-natural-growths.test.js
