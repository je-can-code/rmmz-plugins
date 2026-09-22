//region SkyStates
/**
 * What conditions the sky can be in, and what each of them looks like right now.
 *
 * A **type** is a state the sky walks between - `rain`, `overcast`, `snow`. A **face** is the preset
 * that type is drawn with at a particular season and hour. The two are separate because a clear
 * summer afternoon and a clear winter afternoon are the same *state* and completely different
 * *pictures*: one is a heat shimmer and the other is ice hanging in the air, and nothing about the
 * way the sky moves from condition to condition should have to know which.
 *
 * Folding faces into the graph instead would mean `clear-summer-day` and `clear-winter-day` as
 * separate nodes, and every edge into or out of `clear` authored twice. Eight types with faces is
 * the same expressiveness at half the edges.
 *
 * **Everything here is a pure lookup over the parsed `sky` block.** No engine globals, no clock, no
 * randomness - which is what lets the whole design be tested before a single hook exists.
 */
class SkyStates
{
  /**
   * The season names, indexed by the season id J-TIME publishes.
   *
   * Held here rather than taken from `Time_Snapshot.SeasonsName` because that method answers a
   * different question: it returns display-cased names for a window to draw, reports an unknown id
   * through `Diagnostics`, and hands back null. This needs the lowercase keys the config is authored
   * with, and needs them without reaching for anything.
   * @type {string[]}
   */
  static Seasons = [ 'spring', 'summer', 'autumn', 'winter' ];

  /**
   * The strengths the sky can be at, weakest first.
   *
   * The *order* is the point, and it is the one thing `WeatherPresets.Intensities` cannot express -
   * that is three named keys, and this is a ladder. Clamping a drift into a type's allowed range
   * means knowing which rung is nearest, which means knowing which way is up.
   * @type {string[]}
   */
  static Ladder = [ 'light', 'moderate', 'heavy' ];

  /**
   * The name of a season, from the id J-TIME reports.
   * @param {number} seasonId The season id, 0 through 3.
   * @returns {string} The lowercase season name, or an empty string for an id off the calendar.
   */
  static seasonNameOf(seasonId)
  {
    const name = SkyStates.Seasons[seasonId];

    // an id outside the four seasons is not a season, and saying so is better than saying "spring".
    if (name === undefined) return String.empty;

    return name;
  }

  /**
   * The configuration for one sky type.
   * @param {object} sky The parsed `sky` block of `config.weather.json`.
   * @param {string} typeName The type being asked about, ex: `rain`.
   * @returns {?object} That type's block, or null when the sky has never heard of it.
   */
  static typeOf(sky, typeName)
  {
    const type = sky.types[typeName];

    // a name that is not a type is an authoring error; the caller reports it with its own context.
    if (type === undefined) return null;

    return type;
  }

  /**
   * The types the sky is allowed to be in during a given season.
   *
   * Seasons hard-gate types rather than merely making them unlikely, because "it never snows in
   * summer" is a fact about the world and a weight of zero is a fact about dice. One of those
   * survives somebody retuning the table.
   * @param {object} sky The parsed `sky` block of `config.weather.json`.
   * @param {string} seasonName The season, lowercase.
   * @returns {string[]} The permitted type names, or an empty list for an unknown season.
   */
  static allowedIn(sky, seasonName)
  {
    const season = sky.seasons[seasonName];

    if (season === undefined) return [];

    return season.allowed;
  }

  /**
   * Whether a type is one the sky may hold during a given season.
   * @param {object} sky The parsed `sky` block of `config.weather.json`.
   * @param {string} typeName The type being tested.
   * @param {string} seasonName The season, lowercase.
   * @returns {boolean}
   */
  static isAllowedIn(sky, typeName, seasonName)
  {
    return SkyStates.allowedIn(sky, seasonName)
      .includes(typeName);
  }

  /**
   * The strengths a type is willing to be drawn at.
   *
   * A type declaring a narrower range than the full ladder is how a condition keeps its identity
   * through the drift: `monsoon` is heavy or it is not a monsoon, and `mist` stops at moderate
   * because a heavy mist is just fog - and fog is a place rather than a sky.
   * @param {object} sky The parsed `sky` block of `config.weather.json`.
   * @param {string} typeName The type being asked about.
   * @returns {string[]} The rungs it permits, or the whole ladder when it named none.
   */
  static intensitiesOf(sky, typeName)
  {
    const type = SkyStates.typeOf(sky, typeName);

    if (type === null) return SkyStates.Ladder;

    if (type.intensities === undefined) return SkyStates.Ladder;

    return type.intensities;
  }

  /**
   * Pulls a strength into the range a type is willing to be drawn at.
   *
   * Nearest rung rather than a reset to the middle, so a sky arriving at `monsoon` from heavy rain
   * is already where it needs to be and one arriving from light rain climbs rather than jumping.
   * @param {object} sky The parsed `sky` block of `config.weather.json`.
   * @param {string} typeName The type being entered.
   * @param {string} intensity The strength the drift produced.
   * @returns {string} A strength that type permits.
   */
  static clampIntensity(sky, typeName, intensity)
  {
    const permitted = SkyStates.intensitiesOf(sky, typeName);
    const wanted = SkyStates.Ladder.indexOf(intensity);

    // a strength that is not on the ladder at all cannot be measured against one, so the type's own
    // first choice is the only meaningful answer.
    if (wanted === -1) return permitted[0];

    // a strength the type already permits is zero rungs from itself and wins on its own merits, so
    // there is no early return for it - one path rather than a fast path and a slow path that have
    // to be kept agreeing.
    return SkyStates.nearestRung(permitted, wanted);
  }

  /**
   * Which of a set of permitted rungs sits closest to a given position on the ladder.
   * @param {string[]} permitted The rungs a type allows.
   * @param {number} wanted The ladder position being reached for.
   * @returns {string}
   */
  static nearestRung(permitted, wanted)
  {
    let [ closest ] = permitted;
    let shortest = Number.MAX_SAFE_INTEGER;

    permitted.forEach(rung =>
    {
      const distance = Math.abs(SkyStates.Ladder.indexOf(rung) - wanted);

      // strictly closer, so a tie keeps the earlier - and the ladder runs weakest first, which makes
      // a tie resolve downward. a sky caught between two strengths should understate rather than
      // overstate; the alternative is weather that rounds itself up every time it is unsure.
      if (distance < shortest)
      {
        shortest = distance;
        closest = rung;
      }
    });

    return closest;
  }

  /**
   * The preset a type is drawn with at a given season and hour of the day.
   *
   * Rules are tested in the order they were authored and the first match wins, so a rule naming both
   * a season and a phase must sit above one naming only a phase. A rule that omits either key
   * matches every value of it, which is what keeps the common case - "autumn wind is maple wind" -
   * to a single line.
   * @param {object} sky The parsed `sky` block of `config.weather.json`.
   * @param {string} typeName The condition the sky is in.
   * @param {string} seasonName The season, lowercase.
   * @param {number} phaseId The phase of the day, 0 through 5.
   * @returns {string} The preset name, or an empty string when the type is unknown.
   */
  static faceFor(sky, typeName, seasonName, phaseId)
  {
    const type = SkyStates.typeOf(sky, typeName);

    if (type === null) return String.empty;

    // most types wear one face all year; only `clear` and `breezy` currently have anything to say.
    if (type.faces === undefined) return type.preset;

    const match = type.faces.find(face => SkyStates.faceMatches(face, seasonName, phaseId));

    if (match === undefined) return type.preset;

    return match.preset;
  }

  /**
   * Whether one face rule applies at a given season and hour.
   * @param {object} face One authored face rule.
   * @param {string} seasonName The season, lowercase.
   * @param {number} phaseId The phase of the day, 0 through 5.
   * @returns {boolean}
   */
  static faceMatches(face, seasonName, phaseId)
  {
    // an omitted key is a wildcard rather than a mismatch, which is what lets a rule say "in autumn,
    // whatever the hour" without listing all six phases.
    if (face.seasons !== undefined && face.seasons.includes(seasonName) === false) return false;

    if (face.phases !== undefined && face.phases.includes(phaseId) === false) return false;

    return true;
  }

  /**
   * Every preset name the sky can possibly ask for.
   *
   * Used by configuration validation rather than at runtime. A face pointing at a preset that does
   * not exist is the single most likely authoring mistake here, and it would otherwise surface as an
   * empty sky on one particular afternoon of one particular season.
   * @param {object} sky The parsed `sky` block of `config.weather.json`.
   * @returns {string[]} Every named preset, deduplicated.
   */
  static presetsNamedBy(sky)
  {
    const named = [];

    Object.values(sky.types)
      .forEach(type =>
      {
        named.push(type.preset);

        if (type.faces === undefined) return;

        type.faces.forEach(face => named.push(face.preset));
      });

    return [ ...new Set(named) ];
  }
}

export default SkyStates;
//endregion SkyStates