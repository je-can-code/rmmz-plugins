//region plugins/natural/core/objects/game-battler.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installNaturalHostGlobals,
  installParameterCatalog,
  registerOwnedParameter,
  setPluginContextToJBase,
  setPluginContextToJNatural,
} from '../../_component/fixtures/install-natural-host-globals.js';

/**
 * Every parameter's natural state lives in four tables keyed by registry key, and every amount in them
 * is held in the numbers its tags were written in. The conversion into the parameter's own units
 * happens in exactly one place, {@link Game_Battler#naturalBonusAgainst}, driven by the parameter's
 * registered format- so most of what is pinned here is that the tables stay keyed, sparse and
 * separate, and that the one conversion lifts the base as well as shrinking the result.
 *
 * Two stand-in parameters carry the tests: `pct`, held as a fraction the way every rate is, and `flat`,
 * held in the numbers people read. Their bases answer from the battler, so each test decides them.
 */
describe('J-NaturalGrowth Game_Battler (direct src import)', () =>
{
  let ParameterFormat;

  beforeAll(async () =>
  {
    vi.resetModules();

    installNaturalHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    await import('../../../../../src/plugins/_base/core/objects/Game_BattlerBase.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Battler.js');

    ({ ParameterFormat } = await installParameterCatalog());

    setPluginContextToJNatural();
    await import('../../../../../src/plugins/natural/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/natural/core/objects/Game_Battler.js');

    const pctTags = [
      /<pctBuffPlus:\[([+\-*/ ().\w]+)]>/gi,
      /<pctBuffRate:\[([+\-*/ ().\w]+)]>/gi,
      /<pctGrowthPlus:\[([+\-*/ ().\w]+)]>/gi,
      /<pctGrowthRate:\[([+\-*/ ().\w]+)]>/gi,
    ];
    registerOwnedParameter('pct', ParameterFormat.PERCENT_SUFFIX, pctTags, battler => battler.__pctBase);

    const flatTags = [
      /<flatBuffPlus:\[([+\-*/ ().\w]+)]>/gi,
      /<flatBuffRate:\[([+\-*/ ().\w]+)]>/gi,
      /<flatGrowthPlus:\[([+\-*/ ().\w]+)]>/gi,
      /<flatGrowthRate:\[([+\-*/ ().\w]+)]>/gi,
    ];
    registerOwnedParameter('flat', ParameterFormat.FLAT, flatTags, battler => battler.__flatBase);
  });

  let battler;

  beforeEach(() =>
  {
    battler = new globalThis.Game_Battler();
    battler.initMembers();
    battler.__pctBase = 0.5;
    battler.__flatBase = 10;
    battler.getAllNotes = function()
    {
      return this.__notes ?? [];
    };
  });

  //region setup
  describe('initMembers', () =>
  {
    it('performs the original logic, then seeds the natural tables', () =>
    {
      // Arrange: the fixture's original initMembers resets the state list, which is the proof it ran.
      const fresh = new globalThis.Game_Battler();

      // Act
      fresh.initMembers();

      // Assert
      expect(fresh._states).toEqual([]);
      expect(fresh.naturalGrowthPlusTable()).toEqual({});
    });
  });

  describe('initNaturalGrowthParameters', () =>
  {
    it('builds the namespaces on a battler that has none yet', () =>
    {
      // Arrange
      const bare = Object.create(globalThis.Game_Battler.prototype);

      // Act
      bare.initNaturalGrowthParameters();

      // Assert
      expect(bare.naturalBuffPlusTable()).toEqual({});
      expect(bare.naturalBuffRateTable()).toEqual({});
      expect(bare.naturalGrowthPlusTable()).toEqual({});
      expect(bare.naturalGrowthRateTable()).toEqual({});
      expect([ bare.expPlus(), bare.goldPlus(), bare.sdpsPlus() ]).toEqual([ 0, 0, 0 ]);
    });

    it('keeps the namespaces other plugins already built, and resets only its own fields', () =>
    {
      // Arrange: another plugin's slice of _j, and a stray field on _natural, both predating this call.
      const bare = Object.create(globalThis.Game_Battler.prototype);
      bare._j = { _other: { kept: true }, _natural: { _stray: 3, _growthPlus: { pct: 9 } } };

      // Act
      bare.initNaturalGrowthParameters();

      // Assert
      expect(bare._j._other).toEqual({ kept: true });
      expect(bare._j._natural._stray).toBe(3);
      expect(bare.naturalGrowthPlusTable()).toEqual({});
    });
  });
  //endregion setup

  //region per parameter
  describe('naturalBuffPlus / setNaturalBuffPlus', () =>
  {
    it('reads back the buff recorded for a parameter, and only for that one', () =>
    {
      // Arrange: a sibling parameter is buffed too, so the read has to pick its own key.
      battler.setNaturalBuffPlus('pct', 5);
      battler.setNaturalBuffPlus('flat', 8);

      // Act
      const result = battler.naturalBuffPlus('pct');

      // Assert
      expect(result).toBe(5);
    });

    it('reads zero for a parameter nothing is buffing', () =>
    {
      // Arrange: a sibling carries a buff, which must not be what answers.
      battler.setNaturalBuffPlus('flat', 8);

      // Act
      const result = battler.naturalBuffPlus('pct');

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('naturalBuffRate / setNaturalBuffRate', () =>
  {
    it('reads back the buff recorded for a parameter, and only for that one', () =>
    {
      // Arrange
      battler.setNaturalBuffRate('pct', 15);
      battler.setNaturalBuffRate('flat', 40);

      // Act
      const result = battler.naturalBuffRate('pct');

      // Assert
      expect(result).toBe(15);
    });

    it('reads zero for a parameter nothing is buffing', () =>
    {
      // Arrange
      battler.setNaturalBuffRate('flat', 40);

      // Act
      const result = battler.naturalBuffRate('pct');

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('naturalGrowthPlus / modNaturalGrowthPlus', () =>
  {
    it('accumulates growth from zero, since it is the total of every level gained', () =>
    {
      // Arrange & Act
      battler.modNaturalGrowthPlus('pct', 1.5);
      battler.modNaturalGrowthPlus('pct', 1.5);

      // Assert
      expect(battler.naturalGrowthPlus('pct')).toBe(3);
    });

    it('reads zero for a parameter that has never grown, even while a sibling has', () =>
    {
      // Arrange
      battler.modNaturalGrowthPlus('flat', 2);

      // Act
      const result = battler.naturalGrowthPlus('pct');

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('naturalGrowthRate / modNaturalGrowthRate', () =>
  {
    it('accumulates growth from zero, since it is the total of every level gained', () =>
    {
      // Arrange & Act
      battler.modNaturalGrowthRate('pct', 10);
      battler.modNaturalGrowthRate('pct', 5);

      // Assert
      expect(battler.naturalGrowthRate('pct')).toBe(15);
    });

    it('reads zero for a parameter that has never grown, even while a sibling has', () =>
    {
      // Arrange
      battler.modNaturalGrowthRate('flat', 20);

      // Act
      const result = battler.naturalGrowthRate('pct');

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('table setters', () =>
  {
    it('replace the whole buff tables, which is how a refresh drops a removed buff', () =>
    {
      // Arrange
      battler.setNaturalBuffPlus('pct', 5);
      battler.setNaturalBuffRate('pct', 15);

      // Act
      battler.setNaturalBuffPlusTable({ flat: 1 });
      battler.setNaturalBuffRateTable({ flat: 2 });

      // Assert
      expect([ battler.naturalBuffPlus('pct'), battler.naturalBuffPlus('flat') ]).toEqual([ 0, 1 ]);
      expect([ battler.naturalBuffRate('pct'), battler.naturalBuffRate('flat') ]).toEqual([ 0, 2 ]);
    });
  });
  //endregion per parameter

  //region rewards
  describe('reward bonuses', () =>
  {
    it('reads back the experience bonus it was given', () =>
    {
      // Arrange & Act
      battler.setExpPlus(25);

      // Assert
      expect(battler.expPlus()).toBe(25);
    });

    it('reads back the gold bonus it was given', () =>
    {
      // Arrange & Act
      battler.setGoldPlus(10);

      // Assert
      expect(battler.goldPlus()).toBe(10);
    });

    it('reads back the SDP bonus it was given', () =>
    {
      // Arrange & Act
      battler.setSdpsPlus(3);

      // Assert
      expect(battler.sdpsPlus()).toBe(3);
    });
  });
  //endregion rewards

  //region resolving bonuses
  describe('naturalBonus', () =>
  {
    it('throws for a parameter nothing bound, even while it has nothing to add', () =>
    {
      // Arrange: an owner that folds natural bonuses in without binding would otherwise read zero forever.
      // Act
      const attempt = () => battler.naturalBonus('unbound');

      // Assert
      expect(attempt).toThrow('ParameterRegistry: no natural binding for key "unbound"; bind it with bindNatural at boot.');
    });

    it('passes the other contributors\' bonus through untouched when nothing is buffing or growing', () =>
    {
      // Arrange: another plugin's contribution comes back from the original, and the base is never asked for.
      const original = globalThis.J.NATURAL.Aliased.Game_Battler.get('naturalBonus');
      globalThis.J.NATURAL.Aliased.Game_Battler.set('naturalBonus', () => 0.25);
      Object.defineProperty(battler, '__pctBase', {
        get: () =>
        {
          throw new Error('base was resolved');
        },
      });

      // Act
      const result = battler.naturalBonus('pct');

      // Assert
      expect(result).toBe(0.25);

      globalThis.J.NATURAL.Aliased.Game_Battler.set('naturalBonus', original);
    });

    it('adds this battler\'s bonus, resolved against the bound base, on top of the other contributors\'', () =>
    {
      // Arrange: a flat 5 on a percent-held parameter is 0.05, plus the original's 0.25.
      const original = globalThis.J.NATURAL.Aliased.Game_Battler.get('naturalBonus');
      globalThis.J.NATURAL.Aliased.Game_Battler.set('naturalBonus', () => 0.25);
      battler.setNaturalBuffPlus('pct', 5);

      // Act
      const result = battler.naturalBonus('pct');

      // Assert
      expect(result).toBeCloseTo(0.3, 10);

      globalThis.J.NATURAL.Aliased.Game_Battler.set('naturalBonus', original);
    });
  });

  describe('engineNaturalBonus', () =>
  {
    it('adds nothing for an engine id that translates to no key', () =>
    {
      // Arrange: a buff exists on a real key, so a zero here can only come from the missing key.
      battler.setNaturalBuffPlus('flat', 5);

      // Act
      const result = battler.engineNaturalBonus(null, 10);

      // Assert
      expect(result).toBe(0);
    });

    it('adds nothing for a parameter nothing is buffing or growing', () =>
    {
      // Arrange: a sibling is buffed, and must not be what answers.
      battler.setNaturalBuffPlus('pct', 5);

      // Act
      const result = battler.engineNaturalBonus('flat', 10);

      // Assert
      expect(result).toBe(0);
    });

    it('resolves the bonus against the base it was handed rather than asking the binding for one', () =>
    {
      // Arrange: the bound base is 10, so a rate of 50% against it would be 5- against 40 it is 20.
      battler.setNaturalBuffRate('flat', 50);

      // Act
      const result = battler.engineNaturalBonus('flat', 40);

      // Assert
      expect(result).toBe(20);
    });
  });

  describe('hasNaturalBonus', () =>
  {
    it('is true when only a flat buff is present', () =>
    {
      // Arrange
      battler.setNaturalBuffPlus('pct', 1);

      // Act & Assert
      expect(battler.hasNaturalBonus('pct')).toBe(true);
    });

    it('is true when only a percent buff is present', () =>
    {
      // Arrange
      battler.setNaturalBuffRate('pct', 1);

      // Act & Assert
      expect(battler.hasNaturalBonus('pct')).toBe(true);
    });

    it('is true when only a flat growth is present', () =>
    {
      // Arrange
      battler.modNaturalGrowthPlus('pct', 1);

      // Act & Assert
      expect(battler.hasNaturalBonus('pct')).toBe(true);
    });

    it('is true when only a percent growth is present', () =>
    {
      // Arrange
      battler.modNaturalGrowthRate('pct', 1);

      // Act & Assert
      expect(battler.hasNaturalBonus('pct')).toBe(true);
    });

    it('is false for a parameter with none of the four, even while a sibling has all of them', () =>
    {
      // Arrange
      battler.setNaturalBuffPlus('flat', 1);
      battler.setNaturalBuffRate('flat', 1);
      battler.modNaturalGrowthPlus('flat', 1);
      battler.modNaturalGrowthRate('flat', 1);

      // Act & Assert
      expect(battler.hasNaturalBonus('pct')).toBe(false);
    });
  });

  describe('naturalBonusAgainst', () =>
  {
    it('brings a flat bonus on a percent-held parameter down into the fraction the engine stores', () =>
    {
      // Arrange: 1.5, as a class growth is authored, on a parameter held as a fraction.
      battler.modNaturalGrowthPlus('pct', 1.5);

      // Act
      const result = battler.naturalBonusAgainst('pct', 0.05);

      // Assert
      expect(result).toBeCloseTo(0.015, 10);
    });

    it('takes a percent rate of the base as displayed, not of the fraction the engine stores', () =>
    {
      // Arrange: 20% of a base of 0.5, which the screen shows as 50.
      battler.setNaturalBuffRate('pct', 20);

      // Act
      const result = battler.naturalBonusAgainst('pct', 0.5);

      // Assert: 20% of 50 is 10 points, which is 0.1 of the stored fraction.
      expect(result).toBeCloseTo(0.1, 10);
    });

    it('leaves a parameter held in display numbers unscaled', () =>
    {
      // Arrange
      battler.setNaturalBuffPlus('flat', 4);
      battler.setNaturalBuffRate('flat', 50);

      // Act
      const result = battler.naturalBonusAgainst('flat', 10);

      // Assert: (10 + 4) * 1.5 - 10.
      expect(result).toBe(11);
    });

    it('resolves buffs and growths each against the base and sums them, so neither compounds the other', () =>
    {
      // Arrange: a 50% buff rate and a flat growth of 4, on a base of 10.
      battler.setNaturalBuffRate('flat', 50);
      battler.modNaturalGrowthPlus('flat', 4);

      // Act
      const result = battler.naturalBonusAgainst('flat', 10);

      // Assert: 5 from the buff plus 4 from the growth- not the 7 a rate applied over the growth would give.
      expect(result).toBe(9);
    });
  });

  describe('naturalDisplayBase', () =>
  {
    it('lifts a percent-held parameter\'s base into the numbers its tags are written in', () =>
    {
      // Arrange
      battler.__pctBase = 0.05;

      // Act
      const result = battler.naturalDisplayBase('pct');

      // Assert
      expect(result).toBeCloseTo(5, 10);
    });

    it('hands back a parameter held in display numbers as it is', () =>
    {
      // Arrange
      battler.__flatBase = 12;

      // Act
      const result = battler.naturalDisplayBase('flat');

      // Assert
      expect(result).toBe(12);
    });
  });

  describe('calculatePlusRate', () =>
  {
    it('applies the rate to the base and the flat bonus together, returning only the difference', () =>
    {
      // Arrange & Act
      const result = battler.calculatePlusRate(100, 10, 20);

      // Assert: (100 + 10) * 1.2 - 100.
      expect(result).toBe(32);
    });
  });
  //endregion resolving bonuses

  //region refreshing buffs
  describe('refreshAllParameterBuffs', () =>
  {
    it('drops a buff whose source is gone and records the ones still present', () =>
    {
      // Arrange: a stale buff on pct from before the note changed, and a live one on flat.
      battler.setNaturalBuffPlus('pct', 99);
      battler.__notes = [ { note: '<flatBuffPlus:[3]>' } ];

      // Act
      battler.refreshAllParameterBuffs();

      // Assert
      expect(battler.naturalBuffPlus('pct')).toBe(0);
      expect(battler.naturalBuffPlus('flat')).toBe(3);
    });

    it('refreshes the reward bonuses too', () =>
    {
      // Arrange
      battler.refreshRewardBonuses = function()
      {
        this.setExpPlus(11);
      };

      // Act
      battler.refreshAllParameterBuffs();

      // Assert
      expect(battler.expPlus()).toBe(11);
    });
  });

  describe('clearAllParameterBuffs', () =>
  {
    it('empties both buff tables and zeroes the rewards, but leaves growth alone', () =>
    {
      // Arrange
      battler.setNaturalBuffPlus('pct', 5);
      battler.setNaturalBuffRate('pct', 15);
      battler.modNaturalGrowthPlus('pct', 2);
      battler.setExpPlus(1);
      battler.setGoldPlus(2);
      battler.setSdpsPlus(3);

      // Act
      battler.clearAllParameterBuffs();

      // Assert
      expect(battler.naturalBuffPlusTable()).toEqual({});
      expect(battler.naturalBuffRateTable()).toEqual({});
      expect([ battler.expPlus(), battler.goldPlus(), battler.sdpsPlus() ]).toEqual([ 0, 0, 0 ]);
      expect(battler.naturalGrowthPlus('pct')).toBe(2);
    });
  });

  describe('refreshParameterBuffs', () =>
  {
    it('records a flat buff the notes carry', () =>
    {
      // Arrange
      battler.__notes = [ { note: '<pctBuffPlus:[4]>' } ];

      // Act
      battler.refreshParameterBuffs('pct');

      // Assert
      expect(battler.naturalBuffPlusTable()).toEqual({ pct: 4 });
    });

    it('records no flat entry when the notes carry none', () =>
    {
      // Arrange: a rate buff is present, so the refresh ran and chose not to write the flat one.
      battler.__notes = [ { note: '<pctBuffRate:[10]>' } ];

      // Act
      battler.refreshParameterBuffs('pct');

      // Assert
      expect(battler.naturalBuffPlusTable()).toEqual({});
    });

    it('records a percent buff the notes carry', () =>
    {
      // Arrange
      battler.__notes = [ { note: '<pctBuffRate:[10]>' } ];

      // Act
      battler.refreshParameterBuffs('pct');

      // Assert
      expect(battler.naturalBuffRateTable()).toEqual({ pct: 10 });
    });

    it('records no percent entry when the notes carry none', () =>
    {
      // Arrange: a flat buff is present, so the refresh ran and chose not to write the percent one.
      battler.__notes = [ { note: '<pctBuffPlus:[4]>' } ];

      // Act
      battler.refreshParameterBuffs('pct');

      // Assert
      expect(battler.naturalBuffRateTable()).toEqual({});
    });

    it('gives the formulas the parameter\'s base in display numbers as b', () =>
    {
      // Arrange: a base of 0.5 is 50 on the screen, and a tenth of that is 5.
      battler.__pctBase = 0.5;
      battler.__notes = [ { note: '<pctBuffPlus:[b * 0.1]>' } ];

      // Act
      battler.refreshParameterBuffs('pct');

      // Assert
      expect(battler.naturalBuffPlus('pct')).toBeCloseTo(5, 10);
    });
  });

  describe('refreshRewardBonuses', () =>
  {
    it('changes nothing on a battler that is not an enemy', () =>
    {
      // Arrange
      battler.setExpPlus(5);

      // Act
      battler.refreshRewardBonuses();

      // Assert
      expect(battler.expPlus()).toBe(5);
    });
  });

  describe('naturalParamBuff', () =>
  {
    it('sums every matching formula across every note source', () =>
    {
      // Arrange: two sources, plus a sibling parameter's tag that must not be counted.
      battler.__notes = [ { note: '<flatBuffPlus:[3]>' }, { note: '<flatBuffPlus:[1 + 1]>\n<pctBuffPlus:[50]>' } ];
      const { buffPlus } = globalThis.ParameterRegistry.naturalBinding('flat');

      // Act
      const result = battler.naturalParamBuff(buffPlus, 0);

      // Assert: 3 + (1 + 1).
      expect(result).toBe(5);
    });
  });
  //endregion refreshing buffs

  //region max tp
  describe('maxTp', () =>
  {
    it('reports the calculated max tech', () =>
    {
      // Arrange
      battler.actualMaxTp = () => 120;

      // Act & Assert
      expect(battler.maxTp()).toBe(120);
    });

    it('never reports a negative max tech', () =>
    {
      // Arrange
      battler.actualMaxTp = () => -15;

      // Act & Assert
      expect(battler.maxTp()).toBe(0);
    });
  });

  describe('actualMaxTp', () =>
  {
    it('adds the natural bonus bound to max tech onto its base', () =>
    {
      // Arrange: the bonus answers only for mtp.
      battler.maxTpBeforeNatural = () => 100;
      battler.naturalBonus = key => (key === 'mtp' ? 12 : 99);

      // Act & Assert
      expect(battler.actualMaxTp()).toBe(112);
    });
  });

  describe('maxTpBeforeNatural', () =>
  {
    it('combines the configured base with every tag that raises it', () =>
    {
      // Arrange
      battler.getBaseMaxTp = () => 100;
      battler.getBaseMaxTpBonuses = () => 25;

      // Act & Assert
      expect(battler.maxTpBeforeNatural()).toBe(125);
    });
  });
  //endregion max tp
});
//endregion plugins/natural/core/objects/game-battler.test.js
