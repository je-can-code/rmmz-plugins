//region plugins/natural/core/objects/game-battler.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installNaturalHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJNatural,
} from '../../_component/fixtures/install-natural-host-globals.js';

/**
 * Every actor and enemy in the game reads its parameters through this layer, so the arithmetic
 * here is load-bearing for all combat math downstream. The shape to keep in mind is that these
 * methods return the *bonus* rather than the total: `calculatePlusRate` adds the flat plus, scales
 * by the rate, then subtracts the base back out, because the caller adds the base itself. Getting
 * that inversion wrong would silently double every stat in the game, so the tests below assert
 * concrete numbers rather than merely that something came back.
 */
describe('J-NaturalGrowth Game_Battler bonuses (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installNaturalHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/managers/RPGManager.js'));

    await import('../../../../../src/plugins/_base/objects/Game_BattlerBase.js');
    await import('../../../../../src/plugins/_base/objects/Game_Battler.js');

    setPluginContextToJNatural();
    await import('../../../../../src/plugins/natural/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/natural/core/objects/Game_Battler.js');
  });

  let battler;

  beforeEach(() =>
  {
    battler = new globalThis.Game_Battler();
    battler.initMembers();
  });

  //region calculatePlusRate
  describe('calculatePlusRate', () =>
  {
    it('returns only the bonus, with the base subtracted back out', () =>
    {
      // Arrange: base 100 with a flat +20 and a +10% rate resolves to a 132 total, of which
      // 32 is the bonus this method is responsible for reporting.
      // Act
      const result = battler.calculatePlusRate(100, 20, 10);

      // Assert
      expect(result).toBeCloseTo(32, 10);
    });

    it('applies the rate to the flat bonus as well as to the base', () =>
    {
      // Arrange: the flat bonus is folded in before scaling, which is what makes plus and rate
      // compound rather than stack independently.
      // Act
      const result = battler.calculatePlusRate(100, 100, 100);

      // Assert: (100 + 100) * 2 - 100 = 300.
      expect(result).toBeCloseTo(300, 10);
    });

    it('reports a flat bonus untouched when the rate is neutral', () =>
    {
      // Arrange & Act
      const result = battler.calculatePlusRate(50, 7, 0);

      // Assert
      expect(result).toBeCloseTo(7, 10);
    });

    it('reports a negative bonus for a rate below neutral', () =>
    {
      // Arrange: a debuff rate has to be able to pull the parameter below its base.
      // Act
      const result = battler.calculatePlusRate(100, 0, -25);

      // Assert
      expect(result).toBeCloseTo(-25, 10);
    });

    it('reports no bonus at all when both parts are neutral', () =>
    {
      // Arrange & Act
      const result = battler.calculatePlusRate(100, 0, 0);

      // Assert
      expect(result).toBeCloseTo(0, 10);
    });
  });
  //endregion calculatePlusRate

  //region har
  describe('HAR accessors', () =>
  {
    it('starts every HAR bonus at zero', () =>
    {
      // Arrange & Act & Assert
      expect([
        battler.harGrowthPlus(),
        battler.harGrowthRate(),
        battler.harBuffPlus(),
        battler.harBuffRate(),
      ]).toEqual([ 0, 0, 0, 0 ]);
    });

    it('accumulates the permanent flat bonus, since growth is gained per level', () =>
    {
      // Arrange & Act: two levels each granting the same growth.
      battler.modHarGrowthPlus(5);
      battler.modHarGrowthPlus(5);

      // Assert
      expect(battler.harGrowthPlus()).toBe(10);
    });

    it('accumulates the permanent multiplicative bonus', () =>
    {
      // Arrange & Act
      battler.modHarGrowthRate(3);
      battler.modHarGrowthRate(4);

      // Assert
      expect(battler.harGrowthRate()).toBe(7);
    });

    it('replaces the temporary flat bonus rather than accumulating it', () =>
    {
      // Arrange: buffs are recalculated wholesale each refresh, so setting must overwrite -
      // accumulating would make every refresh inflate the buff further.
      battler.setHarBuffPlus(5);

      // Act
      battler.setHarBuffPlus(8);

      // Assert
      expect(battler.harBuffPlus()).toBe(8);
    });

    it('replaces the temporary multiplicative bonus rather than accumulating it', () =>
    {
      // Arrange
      battler.setHarBuffRate(5);

      // Act
      battler.setHarBuffRate(8);

      // Assert
      expect(battler.harBuffRate()).toBe(8);
    });
  });

  describe('getHarBuff', () =>
  {
    it('reports no bonus while no HAR buff is applied', () =>
    {
      // Arrange: the short-circuit spares every parameter read the arithmetic when nothing
      // is buffed, which is the overwhelmingly common case.
      // Act
      const result = battler.getHarBuff(100);

      // Assert
      expect(result).toBe(0);
    });

    it('computes the bonus from a flat HAR buff alone', () =>
    {
      // Arrange
      battler.setHarBuffPlus(10);

      // Act
      const result = battler.getHarBuff(100);

      // Assert
      expect(result).toBeCloseTo(10, 10);
    });

    it('computes the bonus from a rate HAR buff alone', () =>
    {
      // Arrange
      battler.setHarBuffRate(50);

      // Act
      const result = battler.getHarBuff(100);

      // Assert
      expect(result).toBeCloseTo(50, 10);
    });

    it('compounds a flat and rate HAR buff together', () =>
    {
      // Arrange
      battler.setHarBuffPlus(20);
      battler.setHarBuffRate(10);

      // Act
      const result = battler.getHarBuff(100);

      // Assert
      expect(result).toBeCloseTo(32, 10);
    });
  });

  describe('har getter', () =>
  {
    it('layers the buff on top of the pre-natural HAR value', () =>
    {
      // Arrange: the getter chains onto whatever J-Base already resolved, so the buff is
      // additive to that rather than replacing it.
      const baseHar = battler.har;
      battler.setHarBuffPlus(3);

      // Act
      const buffedHar = battler.har;

      // Assert
      expect(buffedHar - baseHar).toBeCloseTo(3, 10);
    });

    it('leaves HAR untouched while nothing is buffed', () =>
    {
      // Arrange
      const baseHar = battler.har;

      // Act
      const unbuffedHar = battler.har;

      // Assert
      expect(unbuffedHar).toBe(baseHar);
    });
  });
  //endregion har

  //region regex lookups
  describe('regex lookups by parameter id', () =>
  {
    it.each([ 0, 1, 2, 3, 4, 5, 6, 7 ])('resolves a buff regex pair for base param %i', (paramId) =>
    {
      // Arrange & Act
      const structures = battler.getRegexByParamId(paramId);

      // Assert
      expect(structures.length).toBe(2);
    });

    it('resolves nothing for a base param id outside the eight', () =>
    {
      // Arrange: there are exactly eight base parameters, so anything else is a caller error
      // and must not silently resolve to some other parameter's regex.
      // Act
      const structures = battler.getRegexByParamId(8);

      // Assert
      expect(structures).toBeNull();
    });

    it.each([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ])('resolves a buff regex pair for ex-param %i', (paramId) =>
    {
      // Arrange & Act
      const structures = battler.getRegexByExParamId(paramId);

      // Assert
      expect(structures.length).toBe(2);
    });

    it('resolves nothing for an ex-param id outside the ten', () =>
    {
      // Arrange & Act
      const structures = battler.getRegexByExParamId(10);

      // Assert
      expect(structures).toBeNull();
    });

    it.each([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ])('resolves a buff regex pair for sp-param %i', (paramId) =>
    {
      // Arrange & Act
      const structures = battler.getRegexBySpParamId(paramId);

      // Assert
      expect(structures.length).toBe(2);
    });

    it('resolves nothing for an sp-param id outside the ten', () =>
    {
      // Arrange & Act
      const structures = battler.getRegexBySpParamId(10);

      // Assert
      expect(structures).toBeNull();
    });
  });
  //endregion regex lookups

  //region out-of-range parameter access
  describe('out-of-range parameter access', () =>
  {
    it.each([
      [ 'bParamGrowthPlus', 8 ],
      [ 'bParamGrowthRate', 8 ],
      [ 'bParamBuffPlus', 8 ],
      [ 'bParamBuffRate', 8 ],
      [ 'sParamGrowthPlus', 10 ],
      [ 'sParamGrowthRate', 10 ],
      [ 'sParamBuffPlus', 10 ],
      [ 'sParamBuffRate', 10 ],
      [ 'xParamGrowthPlus', 10 ],
      [ 'xParamGrowthRate', 10 ],
      [ 'xParamBuffPlus', 10 ],
      [ 'xParamBuffRate', 10 ],
    ])('%s yields no bonus for an id past the end of its table', (accessor, outOfRangeId) =>
    {
      // Arrange: the bonus tables are fixed-length, and every one of these feeds directly into
      // parameter arithmetic. An undefined escaping here would turn the parameter into NaN
      // rather than merely being wrong, so the absent case has to answer with a real zero.
      // Act
      const result = battler[accessor](outOfRangeId);

      // Assert
      expect(result).toBe(0);
    });
  });
  //endregion out-of-range parameter access

  //region buff calculations
  describe('calculateExParamBuff', () =>
  {
    it('reports no bonus while the ex-param carries no buff', () =>
    {
      // Arrange & Act
      const result = battler.calculateExParamBuff(0, 100);

      // Assert
      expect(result).toBe(0);
    });

    it('computes the bonus once the ex-param is buffed', () =>
    {
      // Arrange
      battler.setXparamBuffPlus(0, 20);
      battler.setXparamBuffRate(0, 10);

      // Act
      const result = battler.calculateExParamBuff(0, 100);

      // Assert
      expect(result).toBeCloseTo(32, 10);
    });
  });

  describe('calculateSpParamBuff', () =>
  {
    it('reports no bonus while the sp-param carries no buff', () =>
    {
      // Arrange & Act
      const result = battler.calculateSpParamBuff(0, 100);

      // Assert
      expect(result).toBe(0);
    });

    it('computes the bonus once the sp-param is buffed', () =>
    {
      // Arrange
      battler.setSparamBuffPlus(0, 20);
      battler.setSparamBuffRate(0, 10);

      // Act
      const result = battler.calculateSpParamBuff(0, 100);

      // Assert
      expect(result).toBeCloseTo(32, 10);
    });
  });
  //endregion buff calculations

  //region max tp
  describe('max tp', () =>
  {
    it('reports no natural bonus while max tp is unbuffed', () =>
    {
      // Arrange & Act
      const result = battler.getMaxTpBuff(100);

      // Assert
      expect(result).toBe(0);
    });

    it('computes the max tp bonus from a flat buff', () =>
    {
      // Arrange
      battler.setMaxTpBuffPlus(15);

      // Act
      const result = battler.getMaxTpBuff(100);

      // Assert
      expect(result).toBeCloseTo(15, 10);
    });

    it('compounds flat and rate max tp buffs', () =>
    {
      // Arrange
      battler.setMaxTpBuffPlus(20);
      battler.setMaxTpBuffRate(10);

      // Act
      const result = battler.getMaxTpBuff(100);

      // Assert
      expect(result).toBeCloseTo(32, 10);
    });

    it('routes the natural bonus through the buffed base max tp', () =>
    {
      // Arrange
      battler.setMaxTpBuffPlus(10);

      // Act
      const bonuses = battler.maxTpNaturalBonuses();

      // Assert
      expect(bonuses).toBeCloseTo(10, 10);
    });

    it('adds the natural bonus onto the base when reporting actual max tp', () =>
    {
      // Arrange
      const unbuffed = battler.actualMaxTp();
      battler.setMaxTpBuffPlus(10);

      // Act
      const buffed = battler.actualMaxTp();

      // Assert
      expect(buffed - unbuffed).toBeCloseTo(10, 10);
    });

    it('never reports a negative max tp, however steep the debuff', () =>
    {
      // Arrange: a debuff large enough to drive the total below zero would otherwise hand the
      // engine a negative resource cap, which breaks every gauge that reads it.
      battler.setMaxTpBuffPlus(-9999);

      // Act
      const result = battler.maxTp();

      // Assert
      expect(result).toBe(0);
    });
  });
  //endregion max tp

  //region sdp interplay
  describe('refreshHarBuffs', () =>
  {
    /**
     * Runs a HAR buff refresh and reports the base the formula was handed.
     * @param {Game_Battler} subject The battler driving this step.
     * @returns {number} The base parameter the formula received.
     */
    function observedHarBase(subject)
    {
      let observed = null;
      subject.naturalParamBuff = (_structure, baseParam) =>
      {
        observed = baseParam;

        return 0;
      };
      subject.refreshHarBuffs();

      return observed;
    }

    it('folds an SDP bonus into the pre-natural HAR base for an actor when SDP is installed', () =>
    {
      // Arrange: HAR buffs are formula-driven off a base that already includes the notetag
      // factor and any SDP contribution, so a panel-granted HAR has to be visible to the
      // formula rather than being added on afterwards.
      const previousSdp = globalThis.J.SDP;
      globalThis.J.SDP = {};
      battler.isActor = () => true;
      battler.getSdpBonusForParameterKey = () => 7;

      // Act
      const observed = observedHarBase(battler);

      // Assert
      expect(observed).toBeCloseTo(battler.baseHarFactor() + 7, 10);

      // restore the bare-global namespace rather than leaking it into later tests in this file.
      globalThis.J.SDP = previousSdp;
    });

    it('asks nothing of SDP for an enemy, which panels never apply to', () =>
    {
      // Arrange: panels are an actor-only system, so the bonus accessor only exists on actors.
      // Asking an enemy for it would throw the moment its data changed.
      const previousSdp = globalThis.J.SDP;
      globalThis.J.SDP = {};
      battler.isActor = () => false;

      // Act
      const observed = observedHarBase(battler);

      // Assert
      expect(observed).toBeCloseTo(battler.baseHarFactor(), 10);

      // restore the bare-global namespace.
      globalThis.J.SDP = previousSdp;
    });

    it('uses the bare HAR factor when SDP is not installed', () =>
    {
      // Arrange: J-SDP is optional, so its absence must leave the base untouched rather than
      // poisoning the formula input.
      battler.isActor = () => true;

      // Act
      const observed = observedHarBase(battler);

      // Assert
      expect(observed).toBeCloseTo(battler.baseHarFactor(), 10);
    });
  });
  //endregion sdp interplay

  //region subclass contract
  describe('getParamBaseNaturalBonuses', () =>
  {
    it('contributes nothing from the base battler, which has no growth model of its own', () =>
    {
      // Arrange: actors and enemies each implement this; a bare battler reaching it means some
      // other subclass slipped through, so it contributes nothing rather than guessing.
      const warn = vi.spyOn(console, 'warn')
        .mockImplementation(() => {});

      // Act
      const result = battler.getParamBaseNaturalBonuses(0, 100);

      // Assert
      expect(result).toBe(0);

      // restore manually so the spy cannot leak into whichever test runs next in this file.
      warn.mockRestore();
    });

    it('warns about the unrecognized subclass rather than failing silently', () =>
    {
      // Arrange
      const warn = vi.spyOn(console, 'warn')
        .mockImplementation(() => {});

      // Act
      battler.getParamBaseNaturalBonuses(0, 100);

      // Assert
      expect(warn).toHaveBeenCalled();

      warn.mockRestore();
    });
  });
  //endregion subclass contract
});
//endregion plugins/natural/core/objects/game-battler.test.js