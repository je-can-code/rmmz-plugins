//region ForecastDirector
import ForecastDigest from './../core/ForecastDigest.js';
import ForecastTable from './../core/ForecastTable.js';
import ForecastVoice from './../core/ForecastVoice.js';
import SkyForecast from './../core/SkyForecast.js';
import SkyStates from './../core/SkyStates.js';

/**
 * Owns the forecast, and decides when the sky reaches the screen.
 *
 * **The work is split in two, and the split is the whole design.** `advance` moves the forecast
 * along and touches nothing but the save slice and the clock handed to it. `push` tells J-Weather
 * what the sky is doing, which reaches map data by way of `WeatherDirector.refresh`.
 *
 * They are separate because the clock announces the time from inside its own constructor, during
 * game-object creation, long before any map exists - so a hook that pushed would crash on every
 * new game. `TimeLightingCoordinator` solves the same problem by keeping map reads out of the
 * announcement entirely; this cannot copy that, because pushing *is* a map read. Splitting is what
 * gets the same guarantee: **push only ever happens from the map scene, by construction, rather
 * than behind a check for whether a map exists.**
 */
class ForecastDirector
{
  /**
   * Whether the sky has moved since the screen was last told about it.
   *
   * A static rather than a saved field, and correct as one: it resets to false on a load, and an
   * arrival pushes unconditionally anyway. What must survive a load is *which phase was applied*,
   * and that lives on `Game_System`.
   * @type {boolean}
   */
  static #pending = false;

  /**
   * The parsed sky configuration.
   * @returns {object}
   */
  static sky()
  {
    return J.WEATHER.EXT.TIME.Metadata.sky;
  }

  /**
   * How many phases ahead of now the forecast is kept.
   * @returns {number}
   */
  static horizon()
  {
    return ForecastDirector.sky().forecastPhases;
  }

  /**
   * A fresh roll for each axis of one phase's walk.
   *
   * Drawn here rather than inside the walk, which is what keeps every calculation in
   * {@link SkyWalk} a pure function of its arguments and assertable to an exact value.
   * @returns {{type: number, intensity: number}}
   */
  static rollFor()
  {
    return {
      type: Math.random(),
      intensity: Math.random(),
    };
  }

  /**
   * Which phase of the calendar a clock is showing.
   * @param {Game_Time} clock The clock being read.
   * @returns {number} The absolute phase, or {@link SkyForecast.OffClock}.
   */
  static phaseOf(clock)
  {
    const phaseOfDay = TimePhases.phaseOfHour(clock.hours());

    return SkyForecast.absolutePhaseOf(clock.years(), clock.months(), clock.days(), phaseOfDay);
  }

  /**
   * Brings the forecast up to the clock, and notes whether that changed anything.
   *
   * **Called on every announcement, and the clock announces every game minute** - roughly every six
   * real seconds - so nearly every call here does nothing at all. Only a genuine phase crossing
   * gets past the dedupe, which at Chef Adventure's tick rate is about once every twenty-four real
   * minutes.
   *
   * Touches the save slice and the clock handed in, and nothing else. See the class summary for why
   * that restriction is load-bearing rather than tidiness.
   * @param {Game_Time} clock The clock announcing the time.
   */
  static advance(clock)
  {
    const phase = ForecastDirector.phaseOf(clock);

    // an hour off the 24-hour face belongs to no phase, and `setTime` can genuinely write one.
    if (phase === SkyForecast.OffClock) return;

    // the announcement everybody else in this minute already made.
    if (phase === $gameSystem.lastAppliedSkyPhase()) return;

    // kept from the start of today rather than from this phase, so the forecast screen can show
    // the hours already gone. Costs at most five extra entries.
    const extended = SkyForecast.ensureCovers(
      ForecastDirector.sky(),
      $gameSystem.skyForecast(),
      SkyForecast.startOfDay(phase),
      phase + ForecastDirector.horizon(),
      ForecastDirector.rollFor);

    $gameSystem.setSkyForecast(extended);
    $gameSystem.setLastAppliedSkyPhase(phase);

    ForecastDirector.flagPending();
  }

  /**
   * What the sky is doing at the clock's current phase.
   *
   * The preset is the **face** rather than the condition, because that is what `setSky` wants and
   * because season and hour are this class's business rather than J-Weather's. The condition rides
   * along beside it so a climate can key on how clear the sky is, which is a thing no face can say.
   * @param {Game_Time} clock The clock being read.
   * @returns {?{preset: string, intensity: string, type: string}} The sky, or null when the clock
   * is showing an hour that belongs to no phase.
   */
  static skyFor(clock)
  {
    const phase = ForecastDirector.phaseOf(clock);

    if (phase === SkyForecast.OffClock) return null;

    const state = SkyForecast.stateAt($gameSystem.skyForecast(), phase);
    const sky = ForecastDirector.sky();
    const seasonName = SkyForecast.seasonNameOf(phase);
    const preset = SkyStates.faceFor(sky, state.type, seasonName, SkyForecast.phaseOfDay(phase));

    return {
      preset,
      intensity: state.intensity,
      type: state.type,
    };
  }

  /**
   * Tells J-Weather what the sky is doing.
   *
   * **Only ever called from the map scene**, which is what makes `$dataMap` being the arriving map
   * a property of where this runs rather than something to check for.
   *
   * Advances first, so a forecast that does not yet reach this phase is wound forward before it is
   * read. That matters on exactly one path and it is a path every existing player will take: a save
   * written before this plugin shipped restores a `Game_System` whose slice was seeded rather than
   * saved, holding an empty forecast that covers nothing.
   * @param {Game_Time} clock The clock being read.
   */
  static push(clock)
  {
    ForecastDirector.advance(clock);
    ForecastDirector.clearPending();

    const sky = ForecastDirector.skyFor(clock);

    // the clock is off its own face; whatever sky it last had is better than none.
    if (sky === null) return;

    WeatherDirector.setSky(sky);
  }

  /**
   * Tells J-Weather what the sky is doing, if it has moved since last time.
   *
   * The fork lives here rather than in the scene that calls it, because `scenes/**` is excluded
   * from coverage and a branch written up there is a branch nothing measures.
   * @param {Game_Time} clock The clock being read.
   */
  static pushIfPending(clock)
  {
    if (ForecastDirector.isPending() === false) return;

    ForecastDirector.push(clock);
  }

  /**
   * How many days ahead the forecast is willing to be read.
   *
   * Short on purpose. The window holds a year, but a forecast a player can read a year of is a
   * forecast that has stopped being weather and started being a timetable - the interesting
   * question is what tomorrow looks like, not what the ninth of next autumn does.
   * @returns {number}
   */
  static visibleDays()
  {
    return ForecastDirector.sky().visibleDays;
  }

  /**
   * Pulls a requested day into the range the forecast will show.
   *
   * Clamped rather than wrapped, so holding the key at either end simply stops - wrapping from
   * the last day back to today reads as the page having glitched.
   *
   * Lives here rather than in the scene because `scenes/**` is excluded from coverage, and an
   * off-by-one at either end of a page control is exactly the sort of thing a test should be
   * holding rather than a playthrough.
   * @param {number} dayOffset How many days ahead was asked for.
   * @returns {number} A day offset the forecast will actually show.
   */
  static clampDayOffset(dayOffset)
  {
    if (dayOffset < 0) return 0;

    const last = ForecastDirector.visibleDays() - 1;

    if (dayOffset > last) return last;

    return dayOffset;
  }

  /**
   * One day of the forecast, ready to draw.
   * @param {Game_Time} clock The clock being read.
   * @param {number} dayOffset How many days ahead of today; zero is today.
   * @returns {object} The day, as {@link ForecastTable} builds it.
   */
  static tableFor(clock, dayOffset)
  {
    return ForecastTable.build(
      ForecastDirector.sky(),
      $gameSystem.skyForecast(),
      ForecastDirector.phaseOf(clock),
      dayOffset);
  }

  /**
   * The rest of today over Raevula, ready to draw.
   * @param {Game_Time} clock The clock being read.
   * @returns {object} The day, as {@link ForecastDigest} builds it.
   */
  static todayFor(clock)
  {
    return ForecastDigest.today(
      ForecastDirector.sky(),
      $gameSystem.skyForecast(),
      ForecastDirector.phaseOf(clock));
  }

  /**
   * The week ahead over Raevula, ready to draw.
   * @param {Game_Time} clock The clock being read.
   * @returns {object} The week, as {@link ForecastDigest} builds it.
   */
  static weekFor(clock)
  {
    return ForecastDigest.week(
      ForecastDirector.sky(),
      $gameSystem.skyForecast(),
      ForecastDirector.phaseOf(clock));
  }

  /**
   * What the weather is doing where the player is standing, and whatever somebody said about it.
   *
   * **The only part of the forecast that is not about Raevula.** The two forward-looking views
   * describe the sky over the town, which is the only forecast anybody on Erocia could have; this
   * describes the here and now, so a cave reports a cave.
   *
   * The remark is null until somebody has written lines for this weather, and the window draws
   * the plain reading in that case rather than an empty space.
   * @returns {{weather: ?{preset: string, intensity: string}, remark: ?object}}
   */
  static readingHere()
  {
    const weather = WeatherDirector.current();

    return {
      weather,
      remark: ForecastVoice.remarkFor(
        ForecastDirector.voices(),
        weather,
        ForecastDirector.partyActorIds(),
        Math.random()),
    };
  }

  /**
   * Every line anybody has written about the weather.
   * @returns {object} The `voices` block, or nothing written at all.
   */
  static voices()
  {
    const { voices } = ForecastDirector.sky();

    // a config that has written none is a perfectly good config; the forecast simply reports.
    if (voices === undefined) return {};

    return voices;
  }

  /**
   * Who is currently travelling with the player.
   *
   * Only these people get to remark on anything - somebody who has not joined yet has no
   * business having an opinion, and a line from them would be a spoiler with a face attached.
   * @returns {number[]}
   */
  static partyActorIds()
  {
    return $gameParty.members()
      .map(member => member.actorId());
  }

  /**
   * Whether the sky has moved since the screen was last told about it.
   * @returns {boolean}
   */
  static isPending()
  {
    // hand back whether there is anything to say.
    return ForecastDirector.#pending;
  }

  /**
   * Notes that the sky has moved.
   */
  static flagPending()
  {
    ForecastDirector.#pending = true;
  }

  /**
   * Notes that the screen has been told.
   */
  static clearPending()
  {
    ForecastDirector.#pending = false;
  }
}

export default ForecastDirector;
//endregion ForecastDirector