//region plugins/crit/game-actor-natural-growths.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { loadCriticalFactorsPluginVm } from './crit-vm.js';
import { clearRpgManagerCacheInVm } from '../../setup/shipped-plugin-vm.js';
import { resetNaturalGrowthPluginSandbox } from '../natural/natural-vm.js';

describe('J-CriticalFactors Game_Actor natural growths (out/crit/J-CriticalFactors.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadCriticalFactorsPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    resetNaturalGrowthPluginSandbox(sandbox);
    clearRpgManagerCacheInVm(sandbox);
  });

  describe('applyNaturalCustomGrowths', () =>
  {
    it('performs the original logic then applies cdm/ctr growths when J.NATURAL is loaded', () =>
    {
      const actor = new sandbox.Game_Actor();
      actor.getSdpBonusForParameterKey = () => 0;
      actor.initMembers();

      actor.applyNaturalCdmGrowths = vi.fn();
      actor.applyNaturalCtrGrowths = vi.fn();

      actor.applyNaturalCustomGrowths();

      expect(actor.applyNaturalCdmGrowths).toHaveBeenCalledTimes(1);
      expect(actor.applyNaturalCtrGrowths).toHaveBeenCalledTimes(1);
    });

    it('skips cdm/ctr growths entirely when J.NATURAL is not loaded', () =>
    {
      const actor = new sandbox.Game_Actor();
      actor.getSdpBonusForParameterKey = () => 0;
      actor.initMembers();

      actor.applyNaturalCdmGrowths = vi.fn();
      actor.applyNaturalCtrGrowths = vi.fn();

      // swap out the aliased "original" (Natural's own applyNaturalCustomGrowths) for a no-op
      // rather than deleting J.NATURAL outright- Natural's real original unconditionally reaches
      // into J.NATURAL for unrelated HAR/param growths, so removing J.NATURAL would break the
      // original call itself, not just the crit-specific `if (!J.NATURAL) return;` guard this
      // test means to exercise.
      const aliasMap = sandbox.J.CRIT.Aliased.Game_Actor;
      const savedOriginal = aliasMap.get('applyNaturalCustomGrowths');
      const savedNatural = sandbox.J.NATURAL;

      try
      {
        aliasMap.set('applyNaturalCustomGrowths', () => {});
        delete sandbox.J.NATURAL;

        actor.applyNaturalCustomGrowths();

        expect(actor.applyNaturalCdmGrowths).not.toHaveBeenCalled();
        expect(actor.applyNaturalCtrGrowths).not.toHaveBeenCalled();
      }
      finally
      {
        aliasMap.set('applyNaturalCustomGrowths', savedOriginal);
        sandbox.J.NATURAL = savedNatural;
      }
    });
  });

  describe('applyNaturalCdmGrowths', () =>
  {
    it('derives growth from the ctr-regex-slot formulas and mods cdmPlus/cdmRate', () =>
    {
      const actor = new sandbox.Game_Actor();
      actor.getSdpBonusForParameterKey = () => 0;
      actor.initMembers();
      actor.__testNoteSources = [
        { note: '<critMultiplierBase: 100>' },
        { note: '<cdmGrowthPlus:[7]>' },
        { note: '<cdmGrowthRate:[3]>' },
      ];

      actor.applyNaturalCdmGrowths();

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
      const actor = new sandbox.Game_Actor();
      actor.getSdpBonusForParameterKey = () => 0;
      actor.initMembers();
      actor.__testNoteSources = [
        { note: '<critReductionBase: 50>' },
        { note: '<ctrGrowthPlus:[4]>' },
        { note: '<ctrGrowthRate:[2]>' },
      ];

      actor.applyNaturalCtrGrowths();

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
      const actor = new sandbox.Game_Actor();
      actor.getSdpBonusForParameterKey = () => 0;
      actor.initMembers();

      const [ ctrPlus, ctrRate, cdmPlus, cdmRate ] = actor.getNaturalGrowthsRegexForCrit();

      expect(ctrPlus).toBe(sandbox.J.CRIT.RegExp.CritTakenRateGrowthPlus);
      expect(ctrRate).toBe(sandbox.J.CRIT.RegExp.CritTakenRateGrowthRate);
      expect(cdmPlus).toBe(sandbox.J.CRIT.RegExp.CritDamageMultiplierGrowthPlus);
      expect(cdmRate).toBe(sandbox.J.CRIT.RegExp.CritDamageMultiplierGrowthRate);
    });
  });

  describe('critSdpBonuses', () =>
  {
    it('resolves the "cdm" parameter key for critParamId 0', () =>
    {
      const actor = new sandbox.Game_Actor();
      const getSdpBonusForParameterKey = vi.fn(() => 42);
      actor.getSdpBonusForParameterKey = getSdpBonusForParameterKey;
      actor.initMembers();

      expect(actor.critSdpBonuses(0, 0.5)).toBe(42);
      expect(getSdpBonusForParameterKey).toHaveBeenCalledWith('cdm', 0.5);
    });

    it('resolves the "ctr" parameter key for any non-zero critParamId', () =>
    {
      const actor = new sandbox.Game_Actor();
      const getSdpBonusForParameterKey = vi.fn(() => 13);
      actor.getSdpBonusForParameterKey = getSdpBonusForParameterKey;
      actor.initMembers();

      expect(actor.critSdpBonuses(1, 0.5)).toBe(13);
      expect(getSdpBonusForParameterKey).toHaveBeenCalledWith('ctr', 0.5);
    });
  });
});
//endregion plugins/crit/game-actor-natural-growths.test.js
