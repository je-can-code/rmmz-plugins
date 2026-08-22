//region plugins/crit/_component/game-battler-crit-math.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installCritHostGlobals,
  installNaturalCompanionStubs,
  setPluginContextToJBase,
  setPluginContextToJCrit,
} from './fixtures/install-crit-host-globals.js';

describe('J-CriticalFactors Game_Battler crit math (direct src import)', () =>
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

    setPluginContextToJCrit();
    await import('../../../../src/plugins/crit/core/_metadata/initialization.js');

    await import('../../../../src/plugins/crit/core/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/crit/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/crit/core/objects/Game_Actor.js');
  });

  /**
   * Builds an actor stubbed with a zero SDP bonus (SDP itself is out of scope for this suite).
   * @returns {object}
   */
  function buildActor()
  {
    const actor = new globalThis.Game_Actor();
    actor.getSdpBonusForParameterKey = () => 0;
    actor.initMembers();
    return actor;
  }

  describe('cdmPlus/modCdmPlus', () =>
  {
    it('accumulates repeated modCdmPlus calls', () =>
    {
      // Arrange
      const actor = buildActor();

      // Act
      actor.modCdmPlus(5);
      actor.modCdmPlus(3);

      // Assert
      expect(actor.cdmPlus()).toBe(8);
    });
  });

  describe('cdmRate/modCdmRate', () =>
  {
    it('accumulates repeated modCdmRate calls', () =>
    {
      // Arrange
      const actor = buildActor();

      // Act
      actor.modCdmRate(10);
      actor.modCdmRate(-2);

      // Assert
      expect(actor.cdmRate()).toBe(8);
    });
  });

  describe('ctrPlus/modCtrPlus', () =>
  {
    it('accumulates repeated modCtrPlus calls', () =>
    {
      // Arrange
      const actor = buildActor();

      // Act
      actor.modCtrPlus(4);
      actor.modCtrPlus(6);

      // Assert
      expect(actor.ctrPlus()).toBe(10);
    });
  });

  describe('ctrRate/modCtrRate', () =>
  {
    it('accumulates repeated modCtrRate calls', () =>
    {
      // Arrange
      const actor = buildActor();

      // Act
      actor.modCtrRate(20);
      actor.modCtrRate(5);

      // Assert
      expect(actor.ctrRate()).toBe(25);
    });
  });

  describe('baseCriticalMultiplier', () =>
  {
    it('adds all critMultiplierBase tags on top of the plugin-configured floor', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.__testNoteSources = [ { note: '<critMultiplierBase: 40>' }, { note: '<critMultiplierBase: 10>' } ];

      // Act & Assert
      // floor (unconfigured plugin param default) = 0.5; tags sum to 50/100 = 0.5; total = 1.0.
      expect(actor.baseCriticalMultiplier()).toBe(1);
    });

    it('is just the plugin-configured floor when there are no critMultiplierBase tags', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.__testNoteSources = [];

      // Act & Assert
      expect(actor.baseCriticalMultiplier()).toBe(0.5);
    });
  });

  describe('baseCriticalReduction', () =>
  {
    it('adds all critReductionBase tags on top of the plugin-configured floor', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.__testNoteSources = [ { note: '<critReductionBase: 30>' } ];

      // Act & Assert
      // floor (unconfigured plugin param default) = 0.5; tag = 30/100 = 0.3; total = 0.8.
      expect(actor.baseCriticalReduction()).toBeCloseTo(0.8, 5);
    });
  });

  describe('getCriticalDamageMultiplier', () =>
  {
    it('sums all critMultiplier tags across note sources without dividing', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.__testNoteSources = [ { note: '<critMultiplier: 15>' }, { note: '<critMultiplier: 5>' } ];

      // Act & Assert
      expect(actor.getCriticalDamageMultiplier()).toBe(20);
    });
  });

  describe('getCriticalDamageReduction', () =>
  {
    it('sums all critReduction tags across note sources without dividing', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.__testNoteSources = [ { note: '<critReduction: 12>' } ];

      // Act & Assert
      expect(actor.getCriticalDamageReduction()).toBe(12);
    });
  });

  describe('criticalDamageMultiplier', () =>
  {
    it('combines note bonuses, natural bonuses, and sdp bonuses into a single /100 factor', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.__testNoteSources = [ { note: '<critMultiplier: 20>' } ];

      // Act & Assert
      // no natural growths/buffs applied (cdmPlus/cdmRate remain 0 from initMembers), sdp stubbed to 0.
      expect(actor.criticalDamageMultiplier()).toBe(0.2);
    });
  });

  describe('criticalDamageReduction', () =>
  {
    it('combines note bonuses, natural bonuses, and sdp bonuses into a single /100 factor', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.__testNoteSources = [ { note: '<critReduction: 40>' } ];

      // Act & Assert
      expect(actor.criticalDamageReduction()).toBe(0.4);
    });
  });

  describe('cdmNaturalBonuses', () =>
  {
    it('is 0 when J.NATURAL is not loaded', () =>
    {
      // Arrange- the buffs and growths are stocked with the exact values the sibling test below
      // sums to 15, so the 0 here can only come from the plugin gate and not from having nothing
      // to add up in the first place.
      const actor = buildActor();
      actor.__testNoteSources = [ { note: '<cdmBuffPlus:[10]>' } ];
      actor.modCdmPlus(5);
      const savedNatural = globalThis.J.NATURAL;
      delete globalThis.J.NATURAL;

      // Act & Assert
      expect(actor.cdmNaturalBonuses()).toBe(0);

      globalThis.J.NATURAL = savedNatural;
    });

    it('sums natural buffs and natural growths when J.NATURAL is loaded', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.__testNoteSources = [ { note: '<cdmBuffPlus:[10]>' } ];
      actor.modCdmPlus(5);

      // Act & Assert
      // buff: calculatePlusRate(base=0, plus=10, rate=0) = (0+10)*1 - 0 = 10.
      // growth: calculatePlusRate(base=0, plus=5, rate=0) = (0+5)*1 - 0 = 5.
      expect(actor.cdmNaturalBonuses()).toBe(15);
    });
  });

  describe('cdmNaturalBuffs', () =>
  {
    it('is 0 when there are no cdm buff tags', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.__testNoteSources = [];

      // Act & Assert
      expect(actor.cdmNaturalBuffs()).toBe(0);
    });

    it('applies calculatePlusRate against the base cdm using the parsed buff formulas', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.__testNoteSources = [
        { note: '<critMultiplierBase: 100>' },
        { note: '<cdmBuffPlus:[20]>' },
        { note: '<cdmBuffRate:[50]>' },
      ];

      // Act & Assert
      // base = floor(0.5) + 100/100 = 1.5. calculatePlusRate(1.5, 20, 50) = (1.5+20)*1.5 - 1.5 = 30.75.
      expect(actor.cdmNaturalBuffs()).toBeCloseTo(30.75, 5);
    });
  });

  describe('cdmNaturalGrowths', () =>
  {
    it('is 0 when there are no accumulated cdm growths', () =>
    {
      // Arrange
      const actor = buildActor();

      // Act & Assert
      expect(actor.cdmNaturalGrowths()).toBe(0);
    });

    it('applies calculatePlusRate against the base cdm using accumulated growth state', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.__testNoteSources = [ { note: '<critMultiplierBase: 100>' } ];
      actor.modCdmPlus(20);
      actor.modCdmRate(50);

      // Act & Assert
      // base = floor(0.5) + 100/100 = 1.5. calculatePlusRate(1.5, 20, 50) = (1.5+20)*1.5 - 1.5 = 30.75.
      expect(actor.cdmNaturalGrowths()).toBeCloseTo(30.75, 5);
    });
  });

  describe('ctrNaturalBonuses', () =>
  {
    it('is 0 when J.NATURAL is not loaded', () =>
    {
      // Arrange- stocked with the same buffs and growths the sibling test below sums to 10, so the
      // 0 here is the plugin gate refusing to contribute rather than an empty tally.
      const actor = buildActor();
      actor.__testNoteSources = [ { note: '<ctrBuffPlus:[8]>' } ];
      actor.modCtrPlus(2);
      const savedNatural = globalThis.J.NATURAL;
      delete globalThis.J.NATURAL;

      // Act & Assert
      expect(actor.ctrNaturalBonuses()).toBe(0);

      globalThis.J.NATURAL = savedNatural;
    });

    it('sums natural buffs and natural growths when J.NATURAL is loaded', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.__testNoteSources = [ { note: '<ctrBuffPlus:[8]>' } ];
      actor.modCtrPlus(2);

      // Act & Assert
      // buff: calculatePlusRate(0, 8, 0) = 8. growth: calculatePlusRate(0, 2, 0) = 2.
      expect(actor.ctrNaturalBonuses()).toBe(10);
    });
  });

  describe('ctrNaturalBuffs', () =>
  {
    it('applies calculatePlusRate against the base ctr using the parsed buff formulas', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.__testNoteSources = [
        { note: '<critReductionBase: 50>' },
        { note: '<ctrBuffPlus:[10]>' },
      ];

      // Act & Assert
      // base = floor(0.5) + 50/100 = 1.0. calculatePlusRate(1.0, 10, 0) = (1+10)*1 - 1 = 10.
      expect(actor.ctrNaturalBuffs()).toBeCloseTo(10, 5);
    });
  });

  describe('ctrNaturalGrowths', () =>
  {
    it('applies calculatePlusRate against the base ctr using accumulated growth state', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.__testNoteSources = [ { note: '<critReductionBase: 50>' } ];
      actor.modCtrPlus(10);

      // Act & Assert
      // base = floor(0.5) + 50/100 = 1.0. calculatePlusRate(1.0, 10, 0) = 11 - 1 = 10.
      expect(actor.ctrNaturalGrowths()).toBeCloseTo(10, 5);
    });
  });
});
//endregion plugins/crit/_component/game-battler-crit-math.test.js
