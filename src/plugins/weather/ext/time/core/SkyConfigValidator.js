//region SkyConfigValidator
import SkyForecast from './SkyForecast.js';
import SkyStates from './SkyStates.js';
import SkyWalk from './SkyWalk.js';

/**
 * Proves the authored sky is one the walk can actually survive.
 *
 * Every fault this looks for is silent at runtime and slow to surface. A transition pointing at a
 * condition the season forbids simply never fires; a face naming a preset that does not exist
 * renders nothing on one particular afternoon of one particular season; a cluster with no route to
 * the settling state leaves a handover day walking in circles. None of them throw, and all of them
 * turn up in month nine of somebody's playthrough rather than at startup.
 *
 * **Findings are returned as well as reported.** Reporting alone would make the only assertable
 * thing a spy on `Diagnostics`, which proves a call happened rather than that the right fault was
 * found; handing the list back lets a test name the fault.
 */
class SkyConfigValidator
{
  /**
   * The most steps a handover may take to reach the settling state.
   *
   * Six, because that is how many phases a day has and a season hands over across exactly one day.
   * A cluster needing seven is a cluster that runs out of day.
   * @type {number}
   */
  static SettlingBudget = 6;

  /**
   * Everything wrong with an authored sky.
   * @param {object} config The parsed contents of `config.weather.json`.
   * @returns {string[]} One message per fault, empty when there are none.
   */
  static findFaults(config)
  {
    const { sky } = config;

    return [
      ...SkyConfigValidator.findRowlessTypes(sky),
      ...SkyConfigValidator.findIllegalTargets(sky),
      ...SkyConfigValidator.findUnsettleableTypes(sky),
      ...SkyConfigValidator.findMissingPresets(config),
      ...SkyConfigValidator.findAmbiguousClimates(config),
      ...SkyConfigValidator.findStrandingMonths(sky),
      ...SkyConfigValidator.findUnseasonalMonths(sky),
    ];
  }

  /**
   * Reports every fault in an authored sky, and says so out loud.
   * @param {object} config The parsed contents of `config.weather.json`.
   * @param {string} pluginName The ship reporting, for the diagnostic prefix.
   * @returns {string[]} The same findings, for anything that wants to act on them.
   */
  static report(config, pluginName)
  {
    const faults = SkyConfigValidator.findFaults(config);

    faults.forEach(fault => Diagnostics.warn(pluginName, fault));

    return faults;
  }

  /**
   * Conditions a season permits but never says how to leave.
   *
   * A condition with no row is a dead end the sky can walk into and never walk out of - it falls
   * back to every legal state, which works but silently discards the whole graph for that node.
   * @param {object} sky The parsed `sky` block.
   * @returns {string[]}
   */
  static findRowlessTypes(sky)
  {
    const faults = [];

    Object.keys(sky.seasons)
      .forEach(seasonName =>
      {
        const season = sky.seasons[seasonName];

        season.allowed.forEach(typeName =>
        {
          if (season.transitions[typeName] !== undefined) return;

          faults.push(`[${seasonName}] permits [${typeName}] but gives it no transitions.`);
        });
      });

    return faults;
  }

  /**
   * Transitions pointing at a condition their own season forbids.
   *
   * Filtered out at runtime rather than obeyed, so the visible symptom is a weight that does
   * nothing - which reads as the graph being badly tuned rather than as a typo.
   * @param {object} sky The parsed `sky` block.
   * @returns {string[]}
   */
  static findIllegalTargets(sky)
  {
    const faults = [];

    Object.keys(sky.seasons)
      .forEach(seasonName =>
      {
        const season = sky.seasons[seasonName];

        Object.keys(season.transitions)
          .forEach(fromType =>
          {
            Object.keys(season.transitions[fromType])
              .forEach(target =>
              {
                if (season.allowed.includes(target) === true) return;

                faults.push(`[${seasonName}] routes [${fromType}] to [${target}], which it forbids.`);
              });
          });
      });

    return faults;
  }

  /**
   * Conditions that cannot reach the settling state inside a handover day.
   * @param {object} sky The parsed `sky` block.
   * @returns {string[]}
   */
  static findUnsettleableTypes(sky)
  {
    const faults = [];

    Object.keys(sky.seasons)
      .forEach(seasonName =>
      {
        sky.seasons[seasonName].allowed.forEach(typeName =>
        {
          const hops = SkyWalk.hopsTo(sky, typeName, sky.settleTo, seasonName);

          if (hops === SkyWalk.Unreachable)
          {
            faults.push(`[${seasonName}] strands [${typeName}]: no route to [${sky.settleTo}].`);

            return;
          }

          if (hops <= SkyConfigValidator.SettlingBudget) return;

          faults.push(`[${seasonName}] needs ${hops} phases to settle [${typeName}]; a day has 6.`);
        });
      });

    return faults;
  }

  /**
   * Presets the sky asks for that either do not exist or were never numbered.
   *
   * Both halves matter and they fail differently. A preset that does not exist draws nothing; one
   * that exists without an id draws fine and reports itself to events as *no weather at all*,
   * which quietly breaks every conditional branch written against it.
   * @param {object} config The parsed contents of `config.weather.json`.
   * @returns {string[]}
   */
  static findMissingPresets(config)
  {
    const faults = [];

    SkyStates.presetsNamedBy(config.sky)
      .forEach(preset =>
      {
        if (config.presets[preset] === undefined)
        {
          faults.push(`the sky names preset [${preset}], which does not exist.`);

          return;
        }

        if (config.presetIds[preset] !== undefined) return;

        faults.push(`the sky names preset [${preset}], which has no declared id.`);
      });

    return faults;
  }

  /**
   * Months whose lean leaves some condition with nowhere at all to go.
   *
   * **The one way a month can genuinely break the sky.** A multiplier of zero is a legitimate and
   * useful thing to write - it is how sakura ends rather than fades - but zeroing every exit from
   * a condition leaves the walk with no positive weight to pick from, and it falls back to the
   * first candidate regardless of what the author meant. That is a sky quietly ignoring its own
   * configuration for a whole month, which is exactly the kind of thing nobody notices until the
   * screenshots look wrong.
   * @param {object} sky The parsed `sky` block.
   * @returns {string[]}
   */
  static findStrandingMonths(sky)
  {
    const faults = [];

    if (sky.months === undefined) return faults;

    Object.keys(sky.months)
      .forEach(month =>
      {
        const seasonName = SkyConfigValidator.seasonOfMonth(Number(month));
        const season = sky.seasons[seasonName];

        if (season === undefined) return;

        const lean = sky.months[month];

        season.allowed.forEach(from =>
        {
          const candidates = SkyWalk.candidatesFor(sky, from, seasonName);
          const leaned = SkyWalk.leanToward(candidates, lean);
          const total = leaned.reduce((sum, candidate) => sum + candidate.weight, 0);

          if (total > 0) return;

          faults.push(`month ${month} leaves [${from}] with no way out in ${seasonName}.`);
        });
      });

    return faults;
  }

  /**
   * Months leaning on a condition their own season does not permit.
   *
   * Harmless at runtime - the condition is never a candidate, so the multiplier never applies -
   * and almost always a typo or a month number off by one. Silence here is how an author spends
   * an evening wondering why their monsoons never arrived.
   * @param {object} sky The parsed `sky` block.
   * @returns {string[]}
   */
  static findUnseasonalMonths(sky)
  {
    const faults = [];

    if (sky.months === undefined) return faults;

    Object.keys(sky.months)
      .forEach(month =>
      {
        const seasonName = SkyConfigValidator.seasonOfMonth(Number(month));
        const season = sky.seasons[seasonName];

        if (season === undefined) return;

        Object.keys(sky.months[month])
          .forEach(type =>
          {
            if (season.allowed.includes(type) === true) return;

            faults.push(`month ${month} leans on [${type}], which ${seasonName} does not permit.`);
          });
      });

    return faults;
  }

  /**
   * Which season a month belongs to.
   * @param {number} month The month, 1 through 12.
   * @returns {string} The lowercase season name, or an empty string for a month off the calendar.
   */
  static seasonOfMonth(month)
  {
    const seasonId = SkyForecast.SeasonMonths.findIndex(months => months.includes(month));

    return SkyStates.seasonNameOf(seasonId);
  }

  /**
   * Climates that declare two ways of answering the sky.
   *
   * `byType` is consulted before `byIntensity`, so a climate carrying both silently never uses the
   * second - and which one an author meant is not recoverable from the file.
   * @param {object} config The parsed contents of `config.weather.json`.
   * @returns {string[]}
   */
  static findAmbiguousClimates(config)
  {
    const faults = [];

    Object.keys(config.climates)
      .forEach(climateName =>
      {
        const climate = config.climates[climateName];

        if (climate.byType === undefined) return;

        if (climate.byIntensity === undefined) return;

        faults.push(`climate [${climateName}] declares both byType and byIntensity; declare one.`);
      });

    return faults;
  }
}

export default SkyConfigValidator;
//endregion SkyConfigValidator