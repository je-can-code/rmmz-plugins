//region MapWeatherResolver
import WeatherPresets from './WeatherPresets.js';

/**
 * Decides what a given map's weather actually is.
 *
 * Every map answers the same question in one of four ways, and the whole design rests on the fourth
 * one being *automatic* rather than *empty*:
 *
 * | The note says | What happens |
 * |---|---|
 * | `<noWeather>` | nothing, whatever the sky is doing |
 * | `<weather:motes>` | that look |
 * | nothing, and there is no sky | nothing |
 * | nothing, and there is sky | whatever the sky is doing |
 *
 * **Nothing here inherits from anywhere.** A map's weather is a property of that map, resolved fresh
 * on arrival, so it can never depend on the route the player took to get there. That is worth saying
 * out loud because the obvious alternative - letting weather carry across a transfer - reads as
 * simpler and is not: it makes a connecting corridor look different depending on which end you came
 * in from, and it forces every room next to an unusual one to re-assert normality on the way out.
 *
 * Strength is deliberately not a property of a place either. The Deluge Plains are rainy at every
 * hour of every day; only how hard it is coming down moves, and that belongs to the sky.
 */
class MapWeatherResolver
{
  /**
   * The strength an authored look runs at where the sky cannot be seen.
   *
   * A cave's drifting motes have no business getting heavier because it happens to be overcast
   * outside. Somewhere sheltered, an authored look simply sits at its middle rung and stays there.
   * @type {string}
   */
  static ShelteredIntensity = WeatherPresets.Intensities.Moderate;

  /**
   * Resolves the look and strength a map should be drawn with.
   * @param {{suppressed: boolean, preset: ?string, hasSky: boolean}} declaration What the map said.
   * @param {?{preset: string, intensity: string}} sky What the sky is doing, or null when nothing
   * is driving one - which is the ordinary state of this plugin running without its time extension.
   * @returns {?{preset: string, intensity: string}} What to draw, or null to draw nothing.
   */
  static resolve(declaration, sky)
  {
    // an explicit opt-out outranks everything, including a sky with opinions.
    if (declaration.suppressed === true) return null;

    // an authored look applies wherever it was authored - sky or no sky, indoors or out. somebody
    // typed it on purpose and there is no reading of that which means "unless".
    if (declaration.preset !== null)
    {
      return {
        preset: declaration.preset,
        intensity: MapWeatherResolver.intensityFor(declaration, sky),
      };
    }

    // nothing was authored, so the sky is the only thing left that could have an opinion - and a
    // place with a roof over it cannot see one.
    if (declaration.hasSky === false) return null;

    // nor can a game where nothing is driving the sky in the first place.
    if (sky === null) return null;

    return {
      preset: sky.preset,
      intensity: sky.intensity,
    };
  }

  /**
   * How strongly an authored look runs.
   * @param {{suppressed: boolean, preset: ?string, hasSky: boolean}} declaration What the map said.
   * @param {?{preset: string, intensity: string}} sky What the sky is doing, or null.
   * @returns {string} One of {@link WeatherPresets.Intensities}.
   */
  static intensityFor(declaration, sky)
  {
    // under open sky, an authored look rises and falls with the weather over it.
    if (declaration.hasSky === true && sky !== null) return sky.intensity;

    // under a roof there is nothing to read, so it sits where it was authored.
    return MapWeatherResolver.ShelteredIntensity;
  }

  /**
   * Reads what a map's note box has to say about its weather.
   *
   * Sky visibility is read from `noToneChange` rather than from a tag of this plugin's own, because
   * "can you see the sky from here" is one question and two plugins need the answer. Asking it twice
   * guarantees two answers that eventually disagree, and the map that disagrees will be the one
   * nobody looks at for a year.
   * @param {rm.types.Map} dataMap The map being arrived at.
   * @returns {{suppressed: boolean, preset: ?string, hasSky: boolean}}
   */
  static declarationFor(dataMap)
  {
    const suppressed = RPGManager.checkForBooleanFromNoteByRegex(dataMap, J.WEATHER.RegExp.NoWeather);
    const preset = RPGManager.getStringFromNoteByRegex(dataMap, J.WEATHER.RegExp.Weather, true);

    // the tag's mere presence is the opt-out; RMMZ hands back `true` for a bare `<noToneChange>`.
    const hasSky = Boolean(dataMap.meta['noToneChange']) === false;

    return {
      suppressed,
      preset,
      hasSky,
    };
  }
}

export default MapWeatherResolver;
//endregion MapWeatherResolver