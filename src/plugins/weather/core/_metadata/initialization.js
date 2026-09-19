//region initialization
import J_WEATHER_PluginMetadata from './_pluginMetadata.js';

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
})();
//endregion version checks

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.WEATHER = {};

/**
 * The plugin umbrella that governs all extensions related to the parent.
 */
J.WEATHER.EXT ||= {};

/**
 * The metadata associated with this plugin.
 */
J.WEATHER.Metadata = new J_WEATHER_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.WEATHER.Aliased = {};
J.WEATHER.Aliased.Game_Map = new Map();
J.WEATHER.Aliased.Scene_Map = new Map();
J.WEATHER.Aliased.Spriteset_Map = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.WEATHER.RegExp = {};

/**
 * The look a map has, named rather than described.
 *
 * <pre>
 * Structure:
 *  <weather:PRESET>
 *
 * Example:
 *  <weather:rain>
 *
 * Translation:
 *  This place is rainy, at whatever strength the sky is currently at.
 * </pre>
 *
 * The tag names a preset out of `config.weather.json` and says nothing about how hard it is coming
 * down, because that is not a property of the place - it is what the sky is doing today. The Deluge
 * Plains are rainy at midnight and rainy at noon; only the amount moves.
 *
 * A map's note is the right home for this because a map has no pages, so there is no page comment
 * for it to live in instead.
 * @type {RegExp}
 */
J.WEATHER.RegExp.Weather = /<weather:[ ]?([a-zA-Z][a-zA-Z0-9_-]*)>/i;

/**
 * Opts a map out of weather entirely.
 *
 * <pre>
 * Structure:
 *  <noWeather>
 *
 * Example:
 *  <noWeather>
 *
 * Translation:
 *  Nothing falls here, whatever the sky is doing.
 * </pre>
 *
 * **Rarely needed, and that is by design.** A map that says nothing at all already gets nothing when
 * it has no sky, so an ordinary interior does not reach for this. It exists for the narrower case of
 * somewhere that *does* have sky overhead and still should not be rained on - a covered market, a
 * colonnade, a courtyard with a canopy.
 * @type {RegExp}
 */
J.WEATHER.RegExp.NoWeather = /<noWeather>/i;
//endregion initialization