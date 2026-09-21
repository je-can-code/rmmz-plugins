//region ClimateCurves
/**
 * How one kind of place answers the sky rather than following it.
 *
 * Most places need nothing here. The Negative Peaks are tagged `<weather:snow>`, so a rainy sky is
 * already snow up there and the map tag has done the whole job. **A climate exists for the one
 * thing a tag cannot say: that somewhere responds to the sky inversely.** The Forest of Dreams is
 * foggiest when the sky is at its *clearest*, and no amount of tuning the sky itself expresses
 * that, because it is a statement about one particular place.
 *
 * That is also why a climate keys on the sky's **type** and not merely its strength. Clearness is a
 * condition, not an amount - and an earlier design that mapped strength alone produced the exact
 * opposite of the intent, turning a blazing cathedral of godrays into the forest's lightest fog.
 *
 * A table declares `byType` **or** `byIntensity`, never both, and falls back to its own `default`.
 * Configuration validation rejects one carrying both, because which the author meant is not
 * recoverable from the file.
 */
class ClimateCurves
{
  /**
   * Bends a sky's strength into what one place makes of it.
   *
   * **Only reached for a map that authored its own look.** `MapWeatherResolver.resolve` consults
   * the strength resolver on that branch alone, so a `<climate:>` tag on an untagged map does
   * nothing at all. That is the intended shape: a place with a climate is a place with a
   * character, and the climate says how the sky argues with it.
   * @param {{suppressed: boolean, preset: ?string, hasSky: boolean, climate: ?string}} declaration
   * What the map said.
   * @param {?{preset: string, intensity: string, type: string}} sky What the sky is doing.
   * @param {string} skyIntensity The strength the core resolver arrived at.
   * @returns {string} One of {@link WeatherPresets.Intensities}.
   */
  static apply(declaration, sky, skyIntensity)
  {
    // under a roof there is no sky to answer, and the sheltered strength stands as authored.
    if (declaration.hasSky === false) return skyIntensity;

    // nothing is driving a sky at all, which is J-Weather running by itself rather than a climate
    // having an opinion.
    if (sky === null) return skyIntensity;

    const climate = ClimateCurves.climateFor(declaration.climate);

    // the ordinary case by a wide margin: a place that simply follows the weather over it.
    if (climate === null) return skyIntensity;

    const byType = ClimateCurves.lookUp(climate.byType, sky.type);

    if (byType !== null) return byType;

    const byIntensity = ClimateCurves.lookUp(climate.byIntensity, skyIntensity);

    if (byIntensity !== null) return byIntensity;

    return ClimateCurves.fallbackOf(climate, skyIntensity);
  }

  /**
   * The table a named climate answers the sky by.
   *
   * An unknown name is a content error rather than a contract violation - an author mistyped a tag
   * the regex was perfectly happy to match - so it is reported and the place simply follows the
   * sky. That is a visible and diagnosable outcome rather than a crash mid-playthrough.
   * @param {?string} climateName The name off the map's note, or null when it named none.
   * @returns {?object} The climate's table, or null when there is none to apply.
   */
  static climateFor(climateName)
  {
    if (climateName === null) return null;

    const { climates } = J.WEATHER.EXT.TIME.Metadata;
    const climate = climates[climateName];

    if (climate === undefined)
    {
      Diagnostics.warn(__PLUGIN_NAME__, `no climate named: [ ${climateName} ]!`, {
        known: Object.keys(climates),
      });

      return null;
    }

    return climate;
  }

  /**
   * Reads one entry out of a climate's table.
   * @param {?object} table The table being consulted, or undefined when the climate declared none.
   * @param {string} key What is being looked up - a sky condition, or a strength.
   * @returns {?string} The strength the table names, or null when it has nothing to say.
   */
  static lookUp(table, key)
  {
    if (table === undefined) return null;

    const found = table[key];

    if (found === undefined) return null;

    return found;
  }

  /**
   * What a climate makes of a sky its table said nothing about.
   *
   * Falls through to the sky's own strength rather than to some neutral rung, because a climate
   * that listed four conditions and omitted a fifth most likely has no opinion about the fifth.
   * @param {object} climate The climate being applied.
   * @param {string} skyIntensity The strength the core resolver arrived at.
   * @returns {string}
   */
  static fallbackOf(climate, skyIntensity)
  {
    if (climate.default === undefined) return skyIntensity;

    return climate.default;
  }
}

export default ClimateCurves;
//endregion ClimateCurves