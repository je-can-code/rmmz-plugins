//region initialization
import J_WEATHER_TIME_PluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

//region version checks
(() =>
{
  // check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '3.18.0';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (hasBaseRequirement === false)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }

  // check to ensure we have the minimum required version of the J-Weather plugin.
  const requiredWeatherVersion = '1.0.0';
  const weatherVersion = J.WEATHER.Metadata.version.version();
  const hasWeatherRequirement = J.BASE.Helpers.satisfies(weatherVersion, requiredWeatherVersion);
  if (hasWeatherRequirement === false)
  {
    throw new Error(`Either missing J-Weather or has a lower version than the required: ${requiredWeatherVersion}`);
  }

  // check to ensure we have the minimum required version of the J-TIME plugin.
  const requiredTimeVersion = '1.0.0';
  const timeVersion = J.TIME.Metadata.version.version();
  const hasTimeRequirement = J.BASE.Helpers.satisfies(timeVersion, requiredTimeVersion);
  if (hasTimeRequirement === false)
  {
    throw new Error(`Either missing J-TIME or has a lower version than the required: ${requiredTimeVersion}`);
  }
})();
//endregion version checks

/**
 * The plugin umbrella that governs all things related to this extension.
 */
J.WEATHER.EXT.TIME = {};

/**
 * The metadata associated with this plugin.
 */
J.WEATHER.EXT.TIME.Metadata = new J_WEATHER_TIME_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.WEATHER.EXT.TIME.Aliased = {};
J.WEATHER.EXT.TIME.Aliased.Game_Event = new Map();
J.WEATHER.EXT.TIME.Aliased.Game_System = new Map();
J.WEATHER.EXT.TIME.Aliased.Game_Time = new Map();
J.WEATHER.EXT.TIME.Aliased.MapWeatherResolver = new Map();
J.WEATHER.EXT.TIME.Aliased.Scene_Map = new Map();
J.WEATHER.EXT.TIME.Aliased.Window_Time = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.WEATHER.EXT.TIME.RegExp = {};

/**
 * How the sky over a place is bent into local weather.
 *
 * <pre>
 * Structure:
 *  <climate:NAME>
 *
 * Example:
 *  <climate:dreaming>
 *
 * Translation:
 *  This place answers the sky through the `dreaming` table rather than following it directly.
 * </pre>
 *
 * Named rather than described, for the same reason `<weather:>` is: the table lives in
 * `config.weather.json` where retuning it is a data edit. A climate only bends a look the map
 * already authored with `<weather:>` - see `MapWeatherResolver.resolve`, which consults the
 * intensity resolver on that branch alone.
 * @type {RegExp}
 */
J.WEATHER.EXT.TIME.RegExp.Climate = /<climate:[ ]?([a-zA-Z][a-zA-Z0-9_-]*)>/i;

/**
 * Requires a page's weather to be a particular look.
 *
 * <pre>
 * Structure:
 *  <weatherTypePage:LOOK>
 *
 * Example:
 *  <weatherTypePage:rain>
 *
 * Translation:
 *  This page is only active while it is raining where the player is standing.
 * </pre>
 *
 * **The look, not the sky's condition.** A creature that comes out on clear summer nights is
 * `fireflies` rather than `clear`, because fireflies are what a clear summer night looks like -
 * which is also what `presetIds` enumerates and what the weather variable reports. Both a name
 * and a number are accepted.
 * @type {RegExp}
 */
J.WEATHER.EXT.TIME.RegExp.WeatherTypePage = /<weatherTypePage:[ ]?([a-zA-Z0-9_-]+)>/i;

/**
 * Requires a page's weather to be at a particular strength.
 *
 * <pre>
 * Structure:
 *  <weatherIntensityPage:STRENGTH>
 *
 * Example:
 *  <weatherIntensityPage:heavy>
 *
 * Translation:
 *  This page is only active while the weather is at its heaviest.
 * </pre>
 * @type {RegExp}
 */
J.WEATHER.EXT.TIME.RegExp.WeatherIntensityPage = /<weatherIntensityPage:[ ]?([a-zA-Z0-9_-]+)>/i;

/**
 * Requires a page's weather to fall within a span of strengths.
 *
 * <pre>
 * Structure:
 *  <weatherIntensityRangePage:WEAKEST-STRONGEST>
 *
 * Example:
 *  <weatherIntensityRangePage:moderate-heavy>
 *
 * Translation:
 *  This page is active from moderate weather upward, but not in a light drizzle.
 * </pre>
 *
 * Inclusive at both ends. Distinct from the single-strength tag by name rather than by shape, so
 * neither pattern can shadow the other however the table is ordered.
 * @type {RegExp}
 */
J.WEATHER.EXT.TIME.RegExp.WeatherIntensityRangePage = /<weatherIntensityRangePage:[ ]?([a-zA-Z0-9]+)-([a-zA-Z0-9]+)>/i;
//endregion initialization