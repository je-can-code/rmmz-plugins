//region plugins/weather/ext/time/managers/forecast-director.test.js
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clockOf, installWeatherTimeGlobals } from '../fixtures/install-weather-time-globals.js';

/**
 * Owning the forecast, and deciding when the sky reaches the screen.
 *
 * The forecast, the walk and the state table all go in unmocked, because holding those three
 * together against the clock is the entire job - a suite that stubbed them would be asserting that
 * a function calls the functions it calls. Only `WeatherDirector` is stood in for, and only because
 * it is the seam this plugin exists to reach through.
 *
 * **The dedupe is the load-bearing behaviour here.** The clock announces every game minute and a
 * phase lasts about two hundred and forty of them, so anything that acted on every announcement
 * would step the sky two hundred and forty times a phase. Several cases below fire the announcement
 * repeatedly for exactly that reason.
 */
describe('ForecastDirector', () =>
{
  let ForecastDirector;
  let setSky;

  /**
   * A sky whose walk is entirely determined by the rolls, with two conditions so that a forecast
   * which alternates proves each phase was walked rather than copied.
   * @returns {object}
   */
  const buildSky = () =>
  {
    const graph = {
      allowed: [ 'alpha', 'beta' ],
      transitions: {
        alpha: { alpha: 50, beta: 50 },
        beta: { beta: 50, alpha: 50 },
      },
    };

    return {
      types: {
        alpha: {
          preset: 'alpha-preset',
          intensities: [ 'light', 'moderate', 'heavy' ],
          faces: [ { phases: [ 0, 5 ], preset: 'alpha-night' } ],
        },
        beta: { preset: 'beta-preset', intensities: [ 'light', 'moderate', 'heavy' ] },
      },
      seasons: {
        spring: graph,
        summer: graph,
        autumn: graph,
        winter: graph,
      },
      intensityDrift: { hold: 100, up: 0, down: 0 },
      settleTo: 'alpha',
      forecastPhases: 12,
      visibleDays: 3,
      places: [],
    };
  };

  beforeEach(async () =>
  {
    vi.resetModules();

    ({ setSky } = installWeatherTimeGlobals(buildSky()));

    // the save slice augments the engine class, so it has to land before an instance is built.
    await import('../../../../../../src/plugins/weather/ext/time/objects/Game_System.js');
    globalThis.$gameSystem = new globalThis.Game_System();

    ({ default: ForecastDirector } =
      await import('../../../../../../src/plugins/weather/ext/time/managers/ForecastDirector.js'));

    // every phase takes the second candidate, so the condition alternates and each step is visible.
    vi.spyOn(Math, 'random')
      .mockReturnValue(0.9);
  });

  describe('phaseOf', () =>
  {
    it('reads a date and an hour off the clock as one phase number', () =>
    {
      // Arrange - 09:00 on day 29 of month 5, year 2021, which is phase 2 of that day.
      const clock = clockOf(2021, 5, 29, 9);

      // Act.
      const result = ForecastDirector.phaseOf(clock);

      // Assert.
      expect(result)
        .toBe(4366250);
    });

    it('reports no phase at all for an hour off the clock face', () =>
    {
      // Arrange - `setTime` writes the hour straight through without constraining it, so a clock
      // genuinely can hold this.
      const clock = clockOf(2021, 5, 29, 47);

      // Act.
      const result = ForecastDirector.phaseOf(clock);

      // Assert.
      expect(result)
        .toBe(-1);
    });
  });

  describe('advance', () =>
  {
    it('rolls the forecast out to the horizon on the first announcement', () =>
    {
      // Arrange - a fresh slice holds an empty forecast starting at phase zero.
      const clock = clockOf(0, 1, 1, 0);

      // Act.
      ForecastDirector.advance(clock);

      // Assert - thirteen phases: the one the clock is on, plus the twelve of horizon ahead of it.
      const forecast = $gameSystem.skyForecast();
      expect(forecast.startPhase)
        .toBe(0);
      expect(forecast.types)
        .toHaveLength(13);
    });

    it('marks the sky as having something to say', () =>
    {
      // Arrange.
      const clock = clockOf(0, 1, 1, 0);

      // Act.
      ForecastDirector.advance(clock);

      // Assert.
      expect(ForecastDirector.isPending())
        .toBe(true);
    });

    it('records the phase it acted on', () =>
    {
      // Arrange - phase 3 of day 1, which is the afternoon.
      const clock = clockOf(0, 1, 1, 13);

      // Act.
      ForecastDirector.advance(clock);

      // Assert.
      expect($gameSystem.lastAppliedSkyPhase())
        .toBe(3);
    });

    it('does nothing at all on a second announcement inside the same phase', () =>
    {
      // Arrange - two different hours of one four-hour phase, which is what the clock produces
      // two hundred and forty times over.
      ForecastDirector.advance(clockOf(0, 1, 1, 12));
      const afterFirst = $gameSystem.skyForecast().types.length;
      ForecastDirector.clearPending();

      // Act.
      ForecastDirector.advance(clockOf(0, 1, 1, 15));

      // Assert - the forecast did not grow and nothing was flagged, so the walk did not step.
      expect($gameSystem.skyForecast().types)
        .toHaveLength(afterFirst);
      expect(ForecastDirector.isPending())
        .toBe(false);
    });

    it('survives two hundred and forty announcements across one phase', () =>
    {
      // Arrange - the real shape of the problem: a phase is four hours and the clock announces
      // every minute, so this is roughly what one phase actually delivers.
      const clock = clockOf(0, 1, 1, 12);

      // Act.
      for (let announcement = 0; announcement < 240; announcement++)
      {
        ForecastDirector.advance(clock);
      }

      // Assert - one phase's worth of walking, not two hundred and forty. Sixteen entries is the
      // single build: phase 3 plus a twelve-phase horizon, kept from the start of the day. A walk
      // that stepped per announcement would hold hundreds.
      expect($gameSystem.skyForecast().types)
        .toHaveLength(16);
    });

    it('keeps the hours already gone, so today can still be shown whole', () =>
    {
      // Arrange - the clock is in the fourth phase of the day.
      const clock = clockOf(0, 1, 1, 13);

      // Act.
      ForecastDirector.advance(clock);

      // Assert - the window begins at the start of the day rather than at the current phase.
      // Trimming to the phase would leave a forecast screen rendering this morning as blanks.
      expect($gameSystem.skyForecast().startPhase)
        .toBe(0);
    });

    it('grows within a day and trims on the day boundary', () =>
    {
      // Arrange - hour 12 is phase 3 and hour 16 is phase 4, both of day one.
      ForecastDirector.advance(clockOf(0, 1, 1, 12));
      const withinDay = $gameSystem.skyForecast().types.length;

      // Act - a crossing inside the day, then the first phase of the next. The values are read
      // out rather than the object held onto: the slice is trimmed and extended in place, so a
      // reference captured here would show whatever the *last* call left behind.
      ForecastDirector.advance(clockOf(0, 1, 1, 16));
      const startWithinDay = $gameSystem.skyForecast().startPhase;
      const lengthWithinDay = $gameSystem.skyForecast().types.length;

      ForecastDirector.advance(clockOf(0, 1, 2, 0));
      const startAfterMidnight = $gameSystem.skyForecast().startPhase;

      // Assert - inside the day the window only extends; crossing midnight moves its start.
      expect(startWithinDay)
        .toBe(0);
      expect(lengthWithinDay)
        .toBe(withinDay + 1);
      expect(startAfterMidnight)
        .toBe(6);
    });

    it('does nothing for an hour that belongs to no phase', () =>
    {
      // Arrange - a real phase applied first, which is what makes this case bite. From a fresh
      // slice the last-applied phase is already -1, so the dedupe would swallow an off-clock hour
      // by coincidence and this guard could be deleted untouched. With a real phase recorded, an
      // unguarded off-clock hour instead regenerates the entire forecast starting at phase -1.
      ForecastDirector.advance(clockOf(0, 1, 1, 12));
      const before = $gameSystem.skyForecast();

      // Act.
      ForecastDirector.advance(clockOf(0, 1, 1, 99));

      // Assert - the window is exactly where it was, and the phase it belongs to is still the real
      // one rather than a nonsense one the next crossing would be measured against.
      expect($gameSystem.skyForecast().startPhase)
        .toBe(before.startPhase);
      expect($gameSystem.lastAppliedSkyPhase())
        .toBe(3);
    });
  });

  describe('skyFor', () =>
  {
    it('reports the face rather than the condition', () =>
    {
      // Arrange - a roll that holds, so the condition is pinned to `alpha` and the only thing that
      // can vary is which face of it the hour selects. Hour 0 is a dark phase.
      Math.random.mockReturnValue(0);
      const clock = clockOf(0, 1, 1, 0);
      ForecastDirector.advance(clock);

      // Act.
      const result = ForecastDirector.skyFor(clock);

      // Assert - the preset is what the hour makes of the condition; `alpha-preset` would mean the
      // face table was never consulted.
      expect(result.preset)
        .toBe('alpha-night');
    });

    it('reports the plain preset for the same condition at a lit hour', () =>
    {
      // Arrange - the same pinned condition, four hours later into a phase the face rule misses.
      // Without this sibling, "consulted the face table" and "always returns the night face" are
      // the same program.
      Math.random.mockReturnValue(0);
      const clock = clockOf(0, 1, 1, 13);
      ForecastDirector.advance(clock);

      // Act.
      const result = ForecastDirector.skyFor(clock);

      // Assert.
      expect(result.preset)
        .toBe('alpha-preset');
    });

    it('carries the condition alongside the face, for a climate to read', () =>
    {
      // Arrange - the roll alternates away from the seed, so the first phase holds `beta`.
      const clock = clockOf(0, 1, 1, 0);
      ForecastDirector.advance(clock);

      // Act.
      const result = ForecastDirector.skyFor(clock);

      // Assert - a climate keys on how clear the sky is, which is a thing no face can say.
      expect(result)
        .toEqual({ preset: 'beta-preset', intensity: 'moderate', type: 'beta' });
    });

    it('reports nothing for an hour that belongs to no phase', () =>
    {
      // Arrange.
      const clock = clockOf(0, 1, 1, 99);

      // Act.
      const result = ForecastDirector.skyFor(clock);

      // Assert.
      expect(result)
        .toBeNull();
    });
  });

  describe('push', () =>
  {
    it('hands the sky to the parent plugin', () =>
    {
      // Arrange - a roll that holds, so the whole object is predictable to the value.
      Math.random.mockReturnValue(0);
      const clock = clockOf(0, 1, 1, 0);

      // Act.
      ForecastDirector.push(clock);

      // Assert - the exact object, because the preset being the face and the type riding along are
      // both contracts the parent and the climate depend on.
      expect(setSky)
        .toHaveBeenCalledWith({ preset: 'alpha-night', intensity: 'moderate', type: 'alpha' });
    });

    it('winds a forecast that reaches nowhere forward before reading it', () =>
    {
      // Arrange - a save written before this plugin existed restores a slice that was seeded
      // rather than saved, so it holds an empty forecast covering nothing at all. Every existing
      // player takes this path exactly once.
      const clock = clockOf(2021, 5, 29, 9);

      // Act.
      ForecastDirector.push(clock);

      // Assert - a sky was produced rather than nothing, which means the empty window was wound
      // forward some four million phases rather than read as a miss.
      expect(setSky)
        .toHaveBeenCalledTimes(1);
      expect($gameSystem.skyForecast().startPhase)
        .toBe(4366248);
    });

    it('says nothing when the clock is off its own face', () =>
    {
      // Arrange.
      const clock = clockOf(0, 1, 1, 99);

      // Act.
      ForecastDirector.push(clock);

      // Assert - whatever sky the player already had stands, rather than being withdrawn because
      // a debug command wrote a nonsense hour.
      expect(setSky)
        .not
        .toHaveBeenCalled();
    });

    it('clears the note it was acting on', () =>
    {
      // Arrange.
      const clock = clockOf(0, 1, 1, 0);
      ForecastDirector.advance(clock);

      // Act.
      ForecastDirector.push(clock);

      // Assert.
      expect(ForecastDirector.isPending())
        .toBe(false);
    });
  });

  describe('clampDayOffset', () =>
  {
    it('allows a day inside the readable range', () =>
    {
      // Arrange - three visible days means offsets 0, 1 and 2.
      const result = ForecastDirector.clampDayOffset(1);

      // Assert.
      expect(result)
        .toBe(1);
    });

    it('allows the last readable day rather than stopping short of it', () =>
    {
      // Arrange - the off-by-one that would make the third day unreachable.
      const result = ForecastDirector.clampDayOffset(2);

      // Assert.
      expect(result)
        .toBe(2);
    });

    it('stops at the last readable day rather than wrapping', () =>
    {
      // Arrange - holding the key at the end. Wrapping back to today reads as a glitch.
      const result = ForecastDirector.clampDayOffset(9);

      // Assert.
      expect(result)
        .toBe(2);
    });

    it('stops at today rather than paging into the past', () =>
    {
      // Arrange - the forecast window is trimmed behind the clock, so yesterday genuinely is not
      // there to show.
      const result = ForecastDirector.clampDayOffset(-4);

      // Assert.
      expect(result)
        .toBe(0);
    });
  });

  describe('tableFor', () =>
  {
    it('builds today from the phase the clock is actually on', () =>
    {
      // Arrange - hour 13 is phase 3 of day 1 of month 1, which is absolute phase 3.
      const clock = clockOf(0, 1, 1, 13);
      ForecastDirector.advance(clock);

      // Act.
      const result = ForecastDirector.tableFor(clock, 0);

      // Assert - the grid opens at the start of the day, and marks where the clock is within it.
      expect(result.startPhase)
        .toBe(0);
      expect(result.nowColumn)
        .toBe(3);
    });

    it('builds a later day a whole day further on', () =>
    {
      // Arrange.
      const clock = clockOf(0, 1, 1, 13);
      ForecastDirector.advance(clock);

      // Act.
      const result = ForecastDirector.tableFor(clock, 1);

      // Assert - six phases on, and nothing highlighted because it is not today.
      expect(result.startPhase)
        .toBe(6);
      expect(result.nowColumn)
        .toBe(-1);
    });
  });

  describe('the player-facing views', () =>
  {
    it('builds today from the phase the clock is on', () =>
    {
      // Arrange.
      const clock = clockOf(0, 1, 1, 13);
      ForecastDirector.advance(clock);

      // Act.
      const result = ForecastDirector.todayFor(clock);

      // Assert - all six phases of the day the clock is in, with the current one marked.
      expect(result.startPhase)
        .toBe(0);
      expect(result.entries)
        .toHaveLength(6);
      expect(result.nowColumn)
        .toBe(3);
    });

    it('builds the week from the same phase', () =>
    {
      // Arrange - the horizon in this fixture is only twelve phases, so the far end of the week
      // is genuinely unknown and has to come back empty rather than invented.
      const clock = clockOf(0, 1, 1, 13);
      ForecastDirector.advance(clock);

      // Act.
      const result = ForecastDirector.weekFor(clock);

      // Assert.
      expect(result.days)
        .toHaveLength(7);
      expect(result.days[0].cells[0])
        .not
        .toBeNull();
      expect(result.days[6].cells[0])
        .toBeNull();
    });

    it('reads the weather where the player stands, not the sky over the town', () =>
    {
      // Arrange - the two forward-looking views describe Raevula; this one describes here. A cave
      // reports a cave, which is what makes it worth having as a separate view at all.
      globalThis.WeatherDirector.current = () => ({ preset: 'motes', intensity: 'light' });

      // Act.
      const result = ForecastDirector.readingHere();

      // Assert.
      expect(result.weather)
        .toEqual({ preset: 'motes', intensity: 'light' });
    });

    it('reads nothing where nothing is falling', () =>
    {
      // Arrange - indoors, which is where most of the game happens.
      globalThis.WeatherDirector.current = () => null;

      // Act.
      const result = ForecastDirector.readingHere();

      // Assert.
      expect(result.weather)
        .toBeNull();
    });

    it('carries no remark until somebody has written lines', () =>
    {
      // Arrange - the window draws the plain reading when there is nothing to say, rather than a
      // blank space where a voice should be.
      globalThis.WeatherDirector.current = () => ({ preset: 'rain', intensity: 'heavy' });

      // Act.
      const result = ForecastDirector.readingHere();

      // Assert.
      expect(result.remark)
        .toBeNull();
    });

    it('carries a remark from somebody in the party once lines exist', () =>
    {
      // Arrange - Rupert is actor 2 and the fixture party holds him.
      J.WEATHER.EXT.TIME.Metadata.sky.voices = {
        rain: { any: [ { who: 2, says: 'i hate this' } ] },
      };
      globalThis.WeatherDirector.current = () => ({ preset: 'rain', intensity: 'heavy' });

      // Act.
      const result = ForecastDirector.readingHere();

      // Assert.
      expect(result.remark)
        .toEqual({ who: 2, says: 'i hate this' });
    });

    it('carries no remark from somebody who has not joined yet', () =>
    {
      // Arrange - the same weather, the same written line, attributed to an actor the fixture
      // party does not hold. A remark from them would be a spoiler with a face attached.
      J.WEATHER.EXT.TIME.Metadata.sky.voices = {
        rain: { any: [ { who: 9, says: 'a stranger speaks' } ] },
      };
      globalThis.WeatherDirector.current = () => ({ preset: 'rain', intensity: 'heavy' });

      // Act.
      const result = ForecastDirector.readingHere();

      // Assert.
      expect(result.remark)
        .toBeNull();
    });
  });

  describe('pushIfPending', () =>
  {
    it('says nothing while the sky has not moved', () =>
    {
      // Arrange - the ordinary state of every frame of gameplay.
      const clock = clockOf(0, 1, 1, 0);
      ForecastDirector.advance(clock);
      ForecastDirector.push(clock);
      setSky.mockClear();

      // Act.
      ForecastDirector.pushIfPending(clock);

      // Assert - sixty of these a second, and none of them should reach the parent.
      expect(setSky)
        .not
        .toHaveBeenCalled();
    });

    it('says what the sky is doing once it has moved', () =>
    {
      // Arrange - a phase crossing announced from somewhere a map read is not safe.
      const clock = clockOf(0, 1, 1, 0);
      ForecastDirector.advance(clock);

      // Act.
      ForecastDirector.pushIfPending(clock);

      // Assert.
      expect(setSky)
        .toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/weather/ext/time/managers/forecast-director.test.js