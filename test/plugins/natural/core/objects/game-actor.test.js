//region plugins/natural/core/objects/game-actor.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installNaturalHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJNatural,
} from '../../_component/fixtures/install-natural-host-globals.js';

/**
 * Actors are the only battler type that accrues permanent growth, so everything here is the second
 * layer stacked on top of the buffs Game_Battler already resolved. Growth accumulates for every
 * level gained and is deliberately never lost on level-down, which is why the growth totals are
 * modified rather than assigned - the same reason the buff equivalents are assigned rather than
 * modified. Getting those two backwards would either erase progression or compound it every frame.
 */
describe('J-NaturalGrowth Game_Actor growths (direct src import)', () =>
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
    await import('../../../../../src/plugins/_base/core/objects/Game_Actor.js');

    setPluginContextToJNatural();
    await import('../../../../../src/plugins/natural/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/natural/core/objects/Game_Battler.js');
    await import('../../../../../src/plugins/natural/core/objects/Game_Actor.js');
  });

  let actor;

  beforeEach(() =>
  {
    actor = new globalThis.Game_Actor();
    actor.initMembers();
  });

  //region max tp growth
  describe('getMaxTpGrowth', () =>
  {
    it('reports no growth on an actor that has gained none', () =>
    {
      // Arrange: a level-one actor with no growth tags has nothing to add, and the short
      // circuit spares every max tp read the arithmetic.
      // Act
      const result = actor.getMaxTpGrowth(100);

      // Assert
      expect(result).toBe(0);
    });

    it('computes growth from an accumulated flat bonus', () =>
    {
      // Arrange
      actor.modMaxTpGrowthPlus(15);

      // Act
      const result = actor.getMaxTpGrowth(100);

      // Assert
      expect(result).toBeCloseTo(15, 10);
    });

    it('compounds accumulated flat and rate growth', () =>
    {
      // Arrange
      actor.modMaxTpGrowthPlus(20);
      actor.modMaxTpGrowthRate(10);

      // Act
      const result = actor.getMaxTpGrowth(100);

      // Assert
      expect(result).toBeCloseTo(32, 10);
    });
  });

  describe('getMaxTpNaturalBonuses', () =>
  {
    it('sums buff and growth rather than letting one shadow the other', () =>
    {
      // Arrange: buffs come and go with equipment and states while growth is permanent, so an
      // actor carrying both must receive both.
      actor.setMaxTpBuffPlus(10);
      actor.modMaxTpGrowthPlus(25);

      // Act
      const result = actor.getMaxTpNaturalBonuses(100);

      // Assert
      expect(result).toBeCloseTo(35, 10);
    });

    it('reports only the growth when nothing is buffed', () =>
    {
      // Arrange
      actor.modMaxTpGrowthPlus(25);

      // Act
      const result = actor.getMaxTpNaturalBonuses(100);

      // Assert
      expect(result).toBeCloseTo(25, 10);
    });
  });

  describe('maxTp', () =>
  {
    it('includes accumulated growth in the reported max tp', () =>
    {
      // Arrange
      const before = actor.maxTp();
      actor.modMaxTpGrowthPlus(12);

      // Act
      const after = actor.maxTp();

      // Assert
      expect(after - before).toBeCloseTo(12, 10);
    });
  });
  //endregion max tp growth

  //region har growth
  describe('getHarGrowth', () =>
  {
    it('reports no growth on an actor that has gained none', () =>
    {
      // Arrange & Act
      const result = actor.getHarGrowth(100);

      // Assert
      expect(result).toBe(0);
    });

    it('computes growth from an accumulated flat bonus', () =>
    {
      // Arrange
      actor.modHarGrowthPlus(8);

      // Act
      const result = actor.getHarGrowth(100);

      // Assert
      expect(result).toBeCloseTo(8, 10);
    });

    it('compounds accumulated flat and rate growth', () =>
    {
      // Arrange
      actor.modHarGrowthPlus(20);
      actor.modHarGrowthRate(10);

      // Act
      const result = actor.getHarGrowth(100);

      // Assert
      expect(result).toBeCloseTo(32, 10);
    });
  });

  describe('har getter', () =>
  {
    it('layers growth on top of the buff-inclusive value from Game_Battler', () =>
    {
      // Arrange: the actor getter chains onto the battler getter rather than replacing it, so
      // an actor carrying both a buff and a growth receives both.
      const base = actor.har;
      actor.setHarBuffPlus(3);
      actor.modHarGrowthPlus(5);

      // Act
      const layered = actor.har;

      // Assert
      expect(layered - base).toBeCloseTo(8, 10);
    });

    it('leaves HAR untouched on an actor with neither buff nor growth', () =>
    {
      // Arrange
      const first = actor.har;

      // Act
      const second = actor.har;

      // Assert
      expect(second).toBe(first);
    });
  });
  //endregion har growth

  //region base parameter growth
  describe('getBparamGrowth', () =>
  {
    it('reports no growth for a parameter the actor has gained none in', () =>
    {
      // Arrange & Act
      const result = actor.getBparamGrowth(0, 100);

      // Assert
      expect(result).toBe(0);
    });

    it('compounds accumulated flat and rate growth for a base parameter', () =>
    {
      // Arrange
      actor.modBparamGrowthPlus(0, 20);
      actor.modBparamGrowthRate(0, 10);

      // Act
      const result = actor.getBparamGrowth(0, 100);

      // Assert
      expect(result).toBeCloseTo(32, 10);
    });

    it('keeps each parameter growth independent of the others', () =>
    {
      // Arrange: growth is tracked per parameter, so buffing power must not leak into defense.
      actor.modBparamGrowthPlus(2, 30);

      // Act
      const untouched = actor.getBparamGrowth(3, 100);

      // Assert
      expect(untouched).toBe(0);
    });
  });

  describe('paramBaseNaturalBonuses', () =>
  {
    it('contributes nothing for a parameter id with no regex mapping', () =>
    {
      // Arrange: without a regex pair there is no tag to read growth from, so there is nothing
      // to contribute rather than an error to raise.
      // Act
      const result = actor.paramBaseNaturalBonuses(99);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('getGrowthRegexByBparamId', () =>
  {
    it.each([ 0, 1, 2, 3, 4, 5, 6, 7 ])('resolves a growth regex pair for base param %i', (paramId) =>
    {
      // Arrange & Act
      const structures = actor.getGrowthRegexByBparamId(paramId);

      // Assert
      expect(structures.length).toBe(2);
    });

    it('resolves nothing for a base param id outside the eight', () =>
    {
      // Arrange & Act
      const structures = actor.getGrowthRegexByBparamId(8);

      // Assert
      expect(structures).toBeNull();
    });
  });
  //endregion base parameter growth

  //region ex and sp parameter growth
  describe('getXparamGrowth', () =>
  {
    it('reports no growth for an ex-parameter the actor has gained none in', () =>
    {
      // Arrange & Act
      const result = actor.getXparamGrowth(0, 100);

      // Assert
      expect(result).toBe(0);
    });

    it('compounds accumulated flat and rate growth for an ex-parameter', () =>
    {
      // Arrange
      actor.modXparamGrowthPlus(0, 20);
      actor.modXparamGrowthRate(0, 10);

      // Act
      const result = actor.getXparamGrowth(0, 100);

      // Assert
      expect(result).toBeCloseTo(32, 10);
    });
  });

  describe('getSparamGrowth', () =>
  {
    it('reports no growth for an sp-parameter the actor has gained none in', () =>
    {
      // Arrange & Act
      const result = actor.getSparamGrowth(0, 100);

      // Assert
      expect(result).toBe(0);
    });

    it('compounds accumulated flat and rate growth for an sp-parameter', () =>
    {
      // Arrange
      actor.modSparamGrowthPlus(0, 20);
      actor.modSparamGrowthRate(0, 10);

      // Act
      const result = actor.getSparamGrowth(0, 100);

      // Assert
      expect(result).toBeCloseTo(32, 10);
    });
  });
  //endregion ex and sp parameter growth

  //region regex mappings without a match
  describe('regex mappings without a match', () =>
  {
    it('contributes no ex-parameter bonus for an id with no regex mapping', () =>
    {
      // Arrange: there are exactly ten ex-parameters; anything beyond has no tag to read.
      // Act
      const result = actor.xparamNaturalBonuses(99);

      // Assert
      expect(result).toBe(0);
    });

    it('contributes no sp-parameter bonus for an id with no regex mapping', () =>
    {
      // Arrange & Act
      const result = actor.sparamNaturalBonuses(99);

      // Assert
      expect(result).toBe(0);
    });

    it.each([ 0, 9 ])('resolves an ex-param growth regex pair for id %i', (paramId) =>
    {
      // Arrange & Act
      const structures = actor.getGrowthRegexByXparamId(paramId);

      // Assert
      expect(structures.length).toBe(2);
    });

    it('resolves no ex-param growth regex for an id outside the ten', () =>
    {
      // Arrange & Act
      const structures = actor.getGrowthRegexByXparamId(10);

      // Assert
      expect(structures).toBeNull();
    });

    it.each([ 0, 9 ])('resolves an sp-param growth regex pair for id %i', (paramId) =>
    {
      // Arrange & Act
      const structures = actor.getGrowthRegexBySparamId(paramId);

      // Assert
      expect(structures.length).toBe(2);
    });

    it('resolves no sp-param growth regex for an id outside the ten', () =>
    {
      // Arrange & Act
      const structures = actor.getGrowthRegexBySparamId(10);

      // Assert
      expect(structures).toBeNull();
    });
  });
  //endregion regex mappings without a match

  //region fractional parameter scaling
  describe('growth tags on fractional parameters', () =>
  {
    /**
     * Applies growth to an actor carrying a single notetag.
     * @param {string} note The note text driving this step.
     * @param {string} method The growth application method to invoke.
     * @returns {Game_Actor}
     */
    function applyGrowthFromNote(note, method)
    {
      const tagged = new globalThis.Game_Actor();
      tagged.initMembers();
      tagged.getAllNotes = () => [ { note } ];
      tagged[method]();

      return tagged;
    }

    it('reads an ex-parameter growth tag as whole percents', () =>
    {
      // Arrange & Act: ex-parameters live on a 0-1 scale, so a tag asking for five percent has
      // to land as 0.05 rather than as a flat 5, which would be five hundred percent - per level.
      const tagged = applyGrowthFromNote('<hitGrowthPlus:[5]>', 'applyNaturalXparamGrowths');

      // Assert
      expect(tagged.xParamGrowthPlus(0)).toBeCloseTo(0.05, 10);
    });

    it('reads an sp-parameter growth tag as whole percents', () =>
    {
      // Arrange & Act
      const tagged = applyGrowthFromNote('<tgrGrowthPlus:[5]>', 'applyNaturalSparamGrowths');

      // Assert
      expect(tagged.sParamGrowthPlus(0)).toBeCloseTo(0.05, 10);
    });

    it('leaves base parameter growth unscaled, since those are whole numbers already', () =>
    {
      // Arrange & Act: max life is a raw integer, so ten means ten points and must not be
      // divided the way the fractional parameters are.
      const tagged = applyGrowthFromNote('<mhpGrowthPlus:[10]>', 'applyNaturalBparamGrowths');

      // Assert
      expect(tagged.bParamGrowthPlus(0)).toBeCloseTo(10, 10);
    });

    it('matches the buff tag of the same value on the same parameter', () =>
    {
      // Arrange: the whole point of the scaling is that an author writing five means five
      // percent whichever family of tag they reach for.
      const grown = applyGrowthFromNote('<hitGrowthPlus:[5]>', 'applyNaturalXparamGrowths');
      const buffed = applyGrowthFromNote('<hitBuffPlus:[5]>', 'refreshXParamBuffs');

      // Act
      const growthBonus = grown.getXparamGrowth(0, 0.95);
      const buffBonus = buffed.calculateExParamBuff(0, 0.95);

      // Assert
      expect(growthBonus).toBeCloseTo(buffBonus, 10);
    });
  });
  //endregion fractional parameter scaling

  //region applying growth
  describe('applyNaturalHarGrowths', () =>
  {
    it('folds an SDP bonus into the HAR value growth is calculated against', () =>
    {
      // Arrange: growth formulas are based off the pre-natural HAR, so a panel-granted HAR has
      // to be visible to the formula rather than being bolted on afterwards.
      const previousSdp = globalThis.J.SDP;
      globalThis.J.SDP = {};
      let observedBase = null;
      actor.getSdpBonusForParameterKey = () => 7;
      actor.naturalParamBuff = (_structure, baseParam) =>
      {
        observedBase = baseParam;

        return 0;
      };

      // Act
      actor.applyNaturalHarGrowths();

      // Assert
      expect(observedBase).toBeCloseTo(actor.baseHarFactor() + 7, 10);

      // restore the bare-global namespace rather than leaking it into later tests in this file.
      globalThis.J.SDP = previousSdp;
    });

    it('uses the bare HAR factor when SDP is not installed', () =>
    {
      // Arrange
      let observedBase = null;
      actor.naturalParamBuff = (_structure, baseParam) =>
      {
        observedBase = baseParam;

        return 0;
      };

      // Act
      actor.applyNaturalHarGrowths();

      // Assert
      expect(observedBase).toBeCloseTo(actor.baseHarFactor(), 10);
    });

    it('accumulates growth across repeated applications, one per level gained', () =>
    {
      // Arrange: growth is permanent and additive, so levelling twice must grant twice - and
      // must never be lost, which is exactly why these accumulate instead of being assigned.
      actor.naturalParamBuff = () => 4;

      // Act
      actor.applyNaturalHarGrowths();
      actor.applyNaturalHarGrowths();

      // Assert
      expect(actor.harGrowthPlus()).toBeCloseTo(8, 10);
    });
  });
  //endregion applying growth
});
//endregion plugins/natural/core/objects/game-actor.test.js