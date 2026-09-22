//region plugins/weather/ext/time/core/sky-config-validator.test.js
import { describe, expect, it, vi } from 'vitest';
import SkyConfigValidator from '../../../../../../src/plugins/weather/ext/time/core/SkyConfigValidator.js';

// RMMZ's core installs this and the source uses it as its empty-string sentinel.
String.empty = '';

/**
 * Proving an authored sky is one the walk can survive.
 *
 * **Every case starts from a config that is already valid and breaks exactly one thing.** A
 * fixture that was broken from the outset could not tell "found the fault" from "reports a fault
 * about everything", and the clean baseline below is asserted first for precisely that reason.
 */
describe('SkyConfigValidator', () =>
{
  /**
   * A whole weather configuration that passes every check.
   * @returns {object}
   */
  const buildConfig = () => ({
    presets: {
      'calm-preset': {},
      'calm-night': {},
      'drizzle-preset': {},
    },
    presetIds: {
      'calm-preset': 1,
      'calm-night': 2,
      'drizzle-preset': 3,
    },
    climates: {
      inverted: { byIntensity: { light: 'heavy', moderate: 'moderate', heavy: 'light' } },
      muted: { byType: { calm: 'light', drizzle: 'light' }, default: 'light' },
    },
    sky: {
      types: {
        calm: {
          preset: 'calm-preset',
          faces: [ { phases: [ 0, 5 ], preset: 'calm-night' } ],
        },
        drizzle: { preset: 'drizzle-preset' },
      },
      seasons: {
        wet: {
          allowed: [ 'calm', 'drizzle' ],
          transitions: {
            calm: { calm: 60, drizzle: 40 },
            drizzle: { drizzle: 50, calm: 50 },
          },
        },
      },
      settleTo: 'calm',
    },
  });

  /**
   * The same sky with its season renamed to a real one, so a month resolves into it.
   *
   * The month checks look a month up to the season that owns it, and month 4 belongs to spring -
   * so a fixture season called `wet` would make every one of them return early and pass for the
   * wrong reason.
   * @param {object} months The calendar leans this case is testing.
   * @returns {object}
   */
  const buildMonthConfig = months =>
  {
    const config = buildConfig();
    config.sky.seasons = { spring: config.sky.seasons.wet };
    config.sky.months = months;

    // a third condition, so a case can strand exactly one of them. With only two - each of whose
    // rows names both - any zero either strands everything or nothing, and "found the stranded
    // one" and "reported all of them" would be the same program.
    config.sky.types.gale = { preset: 'drizzle-preset' };
    config.sky.seasons.spring.allowed.push('gale');
    config.sky.seasons.spring.transitions.gale = { gale: 70, calm: 30 };

    return config;
  };

  describe('findFaults', () =>
  {
    it('finds nothing wrong with a sky that is correct', () =>
    {
      // Arrange - the baseline every other case in this file is a single edit away from.
      const config = buildConfig();

      // Act.
      const result = SkyConfigValidator.findFaults(config);

      // Assert.
      expect(result)
        .toEqual([]);
    });

    it('gathers faults from every check rather than stopping at the first', () =>
    {
      // Arrange - two unrelated faults, so a validator that returned early would report one.
      const config = buildConfig();
      config.sky.types.drizzle.preset = 'ghost-preset';
      config.climates.muted.byIntensity = { light: 'light' };

      // Act.
      const result = SkyConfigValidator.findFaults(config);

      // Assert.
      expect(result)
        .toHaveLength(2);
    });
  });

  describe('findRowlessTypes', () =>
  {
    it('catches a condition the season permits but never leaves', () =>
    {
      // Arrange - `calm` keeps its row, so this cannot pass by reporting everything.
      const config = buildConfig();
      delete config.sky.seasons.wet.transitions.drizzle;

      // Act.
      const result = SkyConfigValidator.findRowlessTypes(config.sky);

      // Assert.
      expect(result)
        .toEqual([ '[wet] permits [drizzle] but gives it no transitions.' ]);
    });

    it('passes a season where every permitted condition has a row', () =>
    {
      // Arrange.
      const config = buildConfig();

      // Act.
      const result = SkyConfigValidator.findRowlessTypes(config.sky);

      // Assert.
      expect(result)
        .toEqual([]);
    });
  });

  describe('findIllegalTargets', () =>
  {
    it('catches a transition routed somewhere the season forbids', () =>
    {
      // Arrange - `gale` is not permitted in `wet`, and the legal targets beside it must survive.
      const config = buildConfig();
      config.sky.seasons.wet.transitions.calm.gale = 25;

      // Act.
      const result = SkyConfigValidator.findIllegalTargets(config.sky);

      // Assert.
      expect(result)
        .toEqual([ '[wet] routes [calm] to [gale], which it forbids.' ]);
    });

    it('passes a season whose every target it permits', () =>
    {
      // Arrange.
      const config = buildConfig();

      // Act.
      const result = SkyConfigValidator.findIllegalTargets(config.sky);

      // Assert.
      expect(result)
        .toEqual([]);
    });
  });

  describe('findUnsettleableTypes', () =>
  {
    it('catches a condition with no route to the settling state at all', () =>
    {
      // Arrange - drizzle loops to itself and nowhere else, so a handover day can never leave it.
      const config = buildConfig();
      config.sky.seasons.wet.transitions.drizzle = { drizzle: 100 };

      // Act.
      const result = SkyConfigValidator.findUnsettleableTypes(config.sky);

      // Assert.
      expect(result)
        .toEqual([ '[wet] strands [drizzle]: no route to [calm].' ]);
    });

    it('catches a condition whose route is longer than a handover day', () =>
    {
      // Arrange - a chain of seven, which is one more than the six phases a day has. The chain is
      // otherwise entirely legal, which is what makes this a budget check rather than a graph one.
      const config = buildConfig();
      const chain = [ 'a', 'b', 'c', 'd', 'e', 'f', 'g' ];
      config.sky.seasons.wet.allowed = [ 'calm', ...chain ];
      config.sky.seasons.wet.transitions = { calm: { calm: 100 } };
      chain.forEach((link, index) =>
      {
        const target = index === 0
          ? 'calm'
          : chain[index - 1];
        config.sky.seasons.wet.transitions[link] = { [target]: 100 };
      });

      // Act.
      const result = SkyConfigValidator.findUnsettleableTypes(config.sky);

      // Assert - only the far end of the chain overruns; the six nearer links all fit.
      expect(result)
        .toEqual([ '[wet] needs 7 phases to settle [g]; a day has 6.' ]);
    });

    it('passes a season where everything settles in time', () =>
    {
      // Arrange.
      const config = buildConfig();

      // Act.
      const result = SkyConfigValidator.findUnsettleableTypes(config.sky);

      // Assert.
      expect(result)
        .toEqual([]);
    });
  });

  describe('findMissingPresets', () =>
  {
    it('catches a face naming a preset that does not exist', () =>
    {
      // Arrange - the type's own preset stays valid, so only the face can be the finding.
      const config = buildConfig();
      config.sky.types.calm.faces[0].preset = 'ghost-preset';

      // Act.
      const result = SkyConfigValidator.findMissingPresets(config);

      // Assert.
      expect(result)
        .toEqual([ 'the sky names preset [ghost-preset], which does not exist.' ]);
    });

    it('catches a preset that exists but was never numbered', () =>
    {
      // Arrange - this one draws perfectly well and reports itself to events as no weather at all,
      // which is the quieter and worse of the two failures.
      const config = buildConfig();
      delete config.presetIds['drizzle-preset'];

      // Act.
      const result = SkyConfigValidator.findMissingPresets(config);

      // Assert.
      expect(result)
        .toEqual([ 'the sky names preset [drizzle-preset], which has no declared id.' ]);
    });

    it('passes a sky whose every preset exists and is numbered', () =>
    {
      // Arrange.
      const config = buildConfig();

      // Act.
      const result = SkyConfigValidator.findMissingPresets(config);

      // Assert.
      expect(result)
        .toEqual([]);
    });
  });

  describe('findAmbiguousClimates', () =>
  {
    it('catches a climate declaring both ways of answering the sky', () =>
    {
      // Arrange - the two single-table climates beside it must survive, or this would pass for a
      // check that simply reported every climate.
      const config = buildConfig();
      config.climates.muted.byIntensity = { light: 'heavy' };

      // Act.
      const result = SkyConfigValidator.findAmbiguousClimates(config);

      // Assert.
      expect(result)
        .toEqual([ 'climate [muted] declares both byType and byIntensity; declare one.' ]);
    });

    it('passes a climate that declares only a type table', () =>
    {
      // Arrange.
      const config = buildConfig();

      // Act.
      const result = SkyConfigValidator.findAmbiguousClimates(config);

      // Assert.
      expect(result)
        .toEqual([]);
    });

    it('passes a climate that declares neither table', () =>
    {
      // Arrange - an identity climate, which is odd to author but harmless.
      const config = buildConfig();
      config.climates.plain = { default: 'moderate' };

      // Act.
      const result = SkyConfigValidator.findAmbiguousClimates(config);

      // Assert.
      expect(result)
        .toEqual([]);
    });
  });

  describe('seasonOfMonth', () =>
  {
    it('puts a month in the season that owns it', () =>
    {
      // Act.
      const result = SkyConfigValidator.seasonOfMonth(10);

      // Assert.
      expect(result)
        .toBe('autumn');
    });

    it('puts month one in winter, which wraps the year', () =>
    {
      // Arrange - the month a calendar-quarter reading gets wrong, and the month the shipped
      // config leans hardest on for snow.
      const result = SkyConfigValidator.seasonOfMonth(1);

      // Assert.
      expect(result)
        .toBe('winter');
    });

    it('refuses to place a month off the calendar', () =>
    {
      // Act.
      const result = SkyConfigValidator.seasonOfMonth(13);

      // Assert.
      expect(result)
        .toBe('');
    });
  });

  describe('findStrandingMonths', () =>
  {
    it('catches a month that zeroes every way out of a condition', () =>
    {
      // Arrange - `gale` leaves only to itself or to calm, and this month zeroes both of those.
      // The walk would fall back to the first candidate and quietly ignore the config all month.
      const config = buildMonthConfig({ 4: { gale: 0, calm: 0 } });

      // Act.
      const result = SkyConfigValidator.findStrandingMonths(config.sky);

      // Assert - exactly one. `calm` and `drizzle` each still reach drizzle, so a check that
      // reported every condition touched by a zero would name all three.
      expect(result)
        .toEqual([ 'month 4 leaves [gale] with no way out in spring.' ]);
    });

    it('passes a month that zeroes one condition among several', () =>
    {
      // Arrange - exactly how sakura ends in the shipped config, and it must stay legal.
      const config = buildMonthConfig({ 4: { drizzle: 0 } });

      // Act.
      const result = SkyConfigValidator.findStrandingMonths(config.sky);

      // Assert.
      expect(result)
        .toEqual([]);
    });

    it('passes a sky that declares no calendar leans at all', () =>
    {
      // Arrange - the `months` block is optional.
      const config = buildConfig();

      // Act.
      const result = SkyConfigValidator.findStrandingMonths(config.sky);

      // Assert.
      expect(result)
        .toEqual([]);
    });

    it('ignores a month whose season is not configured', () =>
    {
      // Arrange - month 7 is summer, and this fixture only has a spring. Nothing to check rather
      // than something to complain about; the season checks own that gap.
      const config = buildMonthConfig({ 7: { drizzle: 0, calm: 0 } });

      // Act.
      const result = SkyConfigValidator.findStrandingMonths(config.sky);

      // Assert.
      expect(result)
        .toEqual([]);
    });
  });

  describe('findUnseasonalMonths', () =>
  {
    it('catches a month leaning on a condition its season forbids', () =>
    {
      // Arrange - a typo, or a month number off by one. Harmless at runtime and invisible, which
      // is how somebody spends an evening wondering where their monsoons went.
      const config = buildMonthConfig({ 4: { hurricane: 3, calm: 2 } });

      // Act.
      const result = SkyConfigValidator.findUnseasonalMonths(config.sky);

      // Assert - only the one that does not exist; `calm` beside it must survive, or this would
      // pass for a check that simply reported every lean it found.
      expect(result)
        .toEqual([ 'month 4 leans on [hurricane], which spring does not permit.' ]);
    });

    it('passes a month leaning only on conditions its season permits', () =>
    {
      // Arrange - two real conditions, so this cannot pass by reporting nothing ever.
      const config = buildMonthConfig({ 4: { drizzle: 2, calm: 0.5 } });

      // Act.
      const result = SkyConfigValidator.findUnseasonalMonths(config.sky);

      // Assert.
      expect(result)
        .toEqual([]);
    });

    it('passes a sky that declares no calendar leans at all', () =>
    {
      // Arrange.
      const config = buildConfig();

      // Act.
      const result = SkyConfigValidator.findUnseasonalMonths(config.sky);

      // Assert.
      expect(result)
        .toEqual([]);
    });

    it('ignores a month whose season is not configured', () =>
    {
      // Arrange.
      const config = buildMonthConfig({ 7: { hurricane: 3 } });

      // Act.
      const result = SkyConfigValidator.findUnseasonalMonths(config.sky);

      // Assert.
      expect(result)
        .toEqual([]);
    });
  });

  describe('report', () =>
  {
    it('says every fault out loud and hands them back', () =>
    {
      // Arrange.
      const config = buildConfig();
      config.sky.types.drizzle.preset = 'ghost-preset';
      const warn = vi.spyOn(Diagnostics, 'warn')
        .mockImplementation(() =>
        {});

      // Act.
      const result = SkyConfigValidator.report(config, 'J-Weather-Time');

      // Assert - the message reaching the console is the one describing the actual fault, rather
      // than merely some call having happened.
      expect(warn)
        .toHaveBeenCalledWith('J-Weather-Time', 'the sky names preset [ghost-preset], which does not exist.');
      expect(result)
        .toHaveLength(1);

      warn.mockRestore();
    });

    it('says nothing at all about a sky that is correct', () =>
    {
      // Arrange.
      const config = buildConfig();
      const warn = vi.spyOn(Diagnostics, 'warn')
        .mockImplementation(() =>
        {});

      // Act.
      const result = SkyConfigValidator.report(config, 'J-Weather-Time');

      // Assert - a validator that narrated its own success would bury the one line that matters.
      expect(warn)
        .not
        .toHaveBeenCalled();
      expect(result)
        .toEqual([]);

      warn.mockRestore();
    });
  });
});
//endregion plugins/weather/ext/time/core/sky-config-validator.test.js