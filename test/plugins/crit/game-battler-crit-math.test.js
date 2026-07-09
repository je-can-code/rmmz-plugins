//region plugins/crit/game-battler-crit-math.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadCriticalFactorsPluginVm } from './crit-vm.js';
import { clearRpgManagerCacheInVm } from '../../setup/shipped-plugin-vm.js';
import { resetNaturalGrowthPluginSandbox } from '../natural/natural-vm.js';

describe('J-CriticalFactors Game_Battler crit math (out/crit/J-CriticalFactors.js)', () =>
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

  /**
   * Builds an actor stubbed with a zero SDP bonus (SDP itself is out of scope for this suite).
   * @returns {object}
   */
  function buildActor()
  {
    const actor = new sandbox.Game_Actor();
    actor.getSdpBonusForParameterKey = () => 0;
    actor.initMembers();
    return actor;
  }

  describe('cdmPlus/modCdmPlus and cdmRate/modCdmRate', () =>
  {
    it('accumulates repeated modCdmPlus calls', () =>
    {
      const actor = buildActor();

      actor.modCdmPlus(5);
      actor.modCdmPlus(3);

      expect(actor.cdmPlus()).toBe(8);
    });

    it('accumulates repeated modCdmRate calls', () =>
    {
      const actor = buildActor();

      actor.modCdmRate(10);
      actor.modCdmRate(-2);

      expect(actor.cdmRate()).toBe(8);
    });
  });

  describe('ctrPlus/modCtrPlus and ctrRate/modCtrRate', () =>
  {
    it('accumulates repeated modCtrPlus calls', () =>
    {
      const actor = buildActor();

      actor.modCtrPlus(4);
      actor.modCtrPlus(6);

      expect(actor.ctrPlus()).toBe(10);
    });

    it('accumulates repeated modCtrRate calls', () =>
    {
      const actor = buildActor();

      actor.modCtrRate(20);
      actor.modCtrRate(5);

      expect(actor.ctrRate()).toBe(25);
    });
  });

  describe('baseCriticalMultiplier', () =>
  {
    it('sums all critMultiplierBase tags across note sources and divides by 100', () =>
    {
      const actor = buildActor();
      actor.__testNoteSources = [ { note: '<critMultiplierBase: 40>' }, { note: '<critMultiplierBase: 10>' } ];

      expect(actor.baseCriticalMultiplier()).toBe(0.5);
    });

    it('is 0 when there are no critMultiplierBase tags', () =>
    {
      const actor = buildActor();
      actor.__testNoteSources = [];

      expect(actor.baseCriticalMultiplier()).toBe(0);
    });
  });

  describe('baseCriticalReduction', () =>
  {
    it('sums all critReductionBase tags across note sources and divides by 100', () =>
    {
      const actor = buildActor();
      actor.__testNoteSources = [ { note: '<critReductionBase: 30>' } ];

      expect(actor.baseCriticalReduction()).toBe(0.3);
    });
  });

  describe('getCriticalDamageMultiplier', () =>
  {
    it('sums all critMultiplier tags across note sources without dividing', () =>
    {
      const actor = buildActor();
      actor.__testNoteSources = [ { note: '<critMultiplier: 15>' }, { note: '<critMultiplier: 5>' } ];

      expect(actor.getCriticalDamageMultiplier()).toBe(20);
    });
  });

  describe('getCriticalDamageReduction', () =>
  {
    it('sums all critReduction tags across note sources without dividing', () =>
    {
      const actor = buildActor();
      actor.__testNoteSources = [ { note: '<critReduction: 12>' } ];

      expect(actor.getCriticalDamageReduction()).toBe(12);
    });
  });

  describe('criticalDamageMultiplier', () =>
  {
    it('combines note bonuses, natural bonuses, and sdp bonuses into a single /100 factor', () =>
    {
      const actor = buildActor();
      actor.__testNoteSources = [ { note: '<critMultiplier: 20>' } ];

      // no natural growths/buffs applied (cdmPlus/cdmRate remain 0 from initMembers), sdp stubbed to 0.
      expect(actor.criticalDamageMultiplier()).toBe(0.2);
    });
  });

  describe('criticalDamageReduction', () =>
  {
    it('combines note bonuses, natural bonuses, and sdp bonuses into a single /100 factor', () =>
    {
      const actor = buildActor();
      actor.__testNoteSources = [ { note: '<critReduction: 40>' } ];

      expect(actor.criticalDamageReduction()).toBe(0.4);
    });
  });

  describe('cdmNaturalBonuses', () =>
  {
    it('is 0 when J.NATURAL is not loaded', () =>
    {
      const actor = buildActor();
      const savedNatural = sandbox.J.NATURAL;
      delete sandbox.J.NATURAL;

      expect(actor.cdmNaturalBonuses()).toBe(0);

      sandbox.J.NATURAL = savedNatural;
    });

    it('sums natural buffs and natural growths when J.NATURAL is loaded', () =>
    {
      const actor = buildActor();
      actor.__testNoteSources = [ { note: '<cdmBuffPlus:[10]>' } ];
      actor.modCdmPlus(5);

      // buff: calculatePlusRate(base=0, plus=10, rate=0) = (0+10)*1 - 0 = 10.
      // growth: calculatePlusRate(base=0, plus=5, rate=0) = (0+5)*1 - 0 = 5.
      expect(actor.cdmNaturalBonuses()).toBe(15);
    });
  });

  describe('cdmNaturalBuffs', () =>
  {
    it('is 0 when there are no cdm buff tags', () =>
    {
      const actor = buildActor();
      actor.__testNoteSources = [];

      expect(actor.cdmNaturalBuffs()).toBe(0);
    });

    it('applies calculatePlusRate against the base cdm using the parsed buff formulas', () =>
    {
      const actor = buildActor();
      actor.__testNoteSources = [
        { note: '<critMultiplierBase: 100>' },
        { note: '<cdmBuffPlus:[20]>' },
        { note: '<cdmBuffRate:[50]>' },
      ];

      // base = 100/100 = 1. calculatePlusRate(1, 20, 50) = (1+20)*(150/100) - 1 = 31.5 - 1 = 30.5.
      expect(actor.cdmNaturalBuffs()).toBeCloseTo(30.5, 5);
    });
  });

  describe('cdmNaturalGrowths', () =>
  {
    it('is 0 when there are no accumulated cdm growths', () =>
    {
      const actor = buildActor();

      expect(actor.cdmNaturalGrowths()).toBe(0);
    });

    it('applies calculatePlusRate against the base cdm using accumulated growth state', () =>
    {
      const actor = buildActor();
      actor.__testNoteSources = [ { note: '<critMultiplierBase: 100>' } ];
      actor.modCdmPlus(20);
      actor.modCdmRate(50);

      // base = 1. calculatePlusRate(1, 20, 50) = (1+20)*1.5 - 1 = 30.5.
      expect(actor.cdmNaturalGrowths()).toBeCloseTo(30.5, 5);
    });
  });

  describe('ctrNaturalBonuses', () =>
  {
    it('is 0 when J.NATURAL is not loaded', () =>
    {
      const actor = buildActor();
      const savedNatural = sandbox.J.NATURAL;
      delete sandbox.J.NATURAL;

      expect(actor.ctrNaturalBonuses()).toBe(0);

      sandbox.J.NATURAL = savedNatural;
    });

    it('sums natural buffs and natural growths when J.NATURAL is loaded', () =>
    {
      const actor = buildActor();
      actor.__testNoteSources = [ { note: '<ctrBuffPlus:[8]>' } ];
      actor.modCtrPlus(2);

      // buff: calculatePlusRate(0, 8, 0) = 8. growth: calculatePlusRate(0, 2, 0) = 2.
      expect(actor.ctrNaturalBonuses()).toBe(10);
    });
  });

  describe('ctrNaturalBuffs', () =>
  {
    it('applies calculatePlusRate against the base ctr using the parsed buff formulas', () =>
    {
      const actor = buildActor();
      actor.__testNoteSources = [
        { note: '<critReductionBase: 50>' },
        { note: '<ctrBuffPlus:[10]>' },
      ];

      // base = 50/100 = 0.5. calculatePlusRate(0.5, 10, 0) = (0.5+10)*1 - 0.5 = 10.
      expect(actor.ctrNaturalBuffs()).toBeCloseTo(10, 5);
    });
  });

  describe('ctrNaturalGrowths', () =>
  {
    it('applies calculatePlusRate against the base ctr using accumulated growth state', () =>
    {
      const actor = buildActor();
      actor.__testNoteSources = [ { note: '<critReductionBase: 50>' } ];
      actor.modCtrPlus(10);

      // base = 0.5. calculatePlusRate(0.5, 10, 0) = 10.5 - 0.5 = 10.
      expect(actor.ctrNaturalGrowths()).toBeCloseTo(10, 5);
    });
  });
});
//endregion plugins/crit/game-battler-crit-math.test.js
