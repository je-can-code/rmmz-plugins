//region WeatherLabel
import WeatherIcons from './WeatherIcons.js';
import WeatherVariables from './WeatherVariables.js';

/**
 * The one way weather is written down, wherever it is written down.
 *
 * **`<icon> type (intensity)`, and nowhere gets to disagree.** A forecast row, a text code in a
 * line of dialogue and anything added later all come through here, so the format is enforced
 * rather than remembered - the failure this avoids is the ordinary one where four screens drift
 * into four spellings of the same fact over a year of small edits.
 *
 * The output is ordinary RMMZ text codes rather than drawing instructions, which is what lets one
 * implementation serve both a window drawing a row and a message box rendering a sentence. Every
 * window in the engine already knows how to read `\I[]`.
 */
class WeatherLabel
{
  /**
   * The word used for no weather when the configuration names none of its own.
   * @type {string}
   */
  static DefaultNothing = 'clear';

  /**
   * The word standing in for weather when there is none.
   *
   * Authored rather than fixed, because "nothing is falling on you" is a different sentence in
   * different games and this one has to read naturally in the middle of somebody's dialogue.
   * @param {object} config The parsed contents of `config.weather.json`.
   * @returns {string}
   */
  static nothingFalling(config)
  {
    if (config.labels === undefined) return WeatherLabel.DefaultNothing;

    if (config.labels.nothing === undefined) return WeatherLabel.DefaultNothing;

    return config.labels.nothing;
  }

  /**
   * One weather in words, without its picture.
   *
   * **This is where the format actually lives.** A window that wants to colour the words itself
   * cannot go through {@link WeatherLabel.for}, because `drawTextEx` resets font settings before
   * it draws - so it draws the icon itself and asks for this. Both paths therefore agree on the
   * wording by construction rather than by two authors remembering the same thing.
   * @param {object} config The parsed contents of `config.weather.json`.
   * @param {string} presetName The look being written.
   * @param {string} intensityName The strength, or {@link String.empty} to omit it.
   * @returns {string} The words alone.
   */
  static words(config, presetName, intensityName)
  {
    if (presetName === String.empty) return String.empty;

    if (intensityName === String.empty) return presetName;

    return `${presetName} (${intensityName})`;
  }

  /**
   * One weather, spelled the standard way, picture and all.
   * @param {object} config The parsed contents of `config.weather.json`.
   * @param {string} presetName The look being written.
   * @param {string} intensityName The strength, or {@link String.empty} to omit it.
   * @returns {string} Text codes ready for any window to render.
   */
  static for(config, presetName, intensityName)
  {
    const words = WeatherLabel.words(config, presetName, intensityName);

    if (words === String.empty) return String.empty;

    const iconIndex = WeatherIcons.indexFor(config, presetName);

    // a look still waiting on artwork reads as its name alone rather than as a gap where an icon
    // should be, which is what keeps every screen usable before the icons are drawn.
    if (iconIndex === WeatherIcons.None) return words;

    return `\\I[${iconIndex}]${words}`;
  }

  /**
   * One weather named however the author found convenient.
   *
   * Names and numbers are both accepted because both are already in circulation: a map notetag
   * takes either, so a text code that took only one of them would be the odd one out. Hand-written
   * dialogue wants `rain`; an event that computed the id into a variable has a number.
   * @param {object} config The parsed contents of `config.weather.json`.
   * @param {string} token What the author wrote for the look.
   * @returns {string} The preset's name, or {@link String.empty} when nothing claims that token.
   */
  static presetFrom(config, token)
  {
    if (config.presetIds[token] !== undefined) return token;

    const asNumber = Number(token);

    if (Number.isFinite(asNumber) === false) return String.empty;

    return WeatherVariables.typeNameFor(config, asNumber);
  }

  /**
   * One strength named however the author found convenient.
   * @param {object} config The parsed contents of `config.weather.json`.
   * @param {string} token What the author wrote for the strength.
   * @returns {string} The rung's name, or {@link String.empty} when nothing claims that token.
   */
  static intensityFrom(config, token)
  {
    if (config.intensityIds[token] !== undefined) return token;

    const asNumber = Number(token);

    if (Number.isFinite(asNumber) === false) return String.empty;

    return WeatherVariables.intensityNameFor(config, asNumber);
  }

  /**
   * What a text code's arguments amount to.
   *
   * Three shapes, and the empty one is the useful one: `\weather[]` means whatever is falling on
   * the player as the line is drawn, so a line written once stays true for the life of the game
   * rather than being a guess about what the sky is doing when the player finally gets there.
   * @param {object} config The parsed contents of `config.weather.json`.
   * @param {string} rawArguments Whatever sat between the brackets.
   * @param {?{preset: string, intensity: string}} here What is falling on the player, or null.
   * @returns {string} Text codes ready for any window to render.
   */
  static fromArguments(config, rawArguments, here)
  {
    const tokens = rawArguments.split(',')
      .map(token => token.trim())
      .filter(token => token !== String.empty);

    if (tokens.length === 0) return WeatherLabel.here(config, here);

    const [ presetToken, intensityToken ] = tokens;
    const presetName = WeatherLabel.presetFrom(config, presetToken);

    if (presetName === String.empty)
    {
      Diagnostics.warn(__PLUGIN_NAME__, `no weather is named by: [ ${presetToken} ]!`, {
        declared: Object.keys(config.presetIds),
      });

      return String.empty;
    }

    // the strength is optional, and an author who left it out wants the look named on its own.
    if (intensityToken === undefined) return WeatherLabel.for(config, presetName, String.empty);

    const intensityName = WeatherLabel.intensityFrom(config, intensityToken);

    if (intensityName === String.empty)
    {
      Diagnostics.warn(__PLUGIN_NAME__, `no weather strength is named by: [ ${intensityToken} ]!`, {
        declared: Object.keys(config.intensityIds),
      });
    }

    return WeatherLabel.for(config, presetName, intensityName);
  }

  /**
   * What is falling on the player, spelled the standard way.
   * @param {object} config The parsed contents of `config.weather.json`.
   * @param {?{preset: string, intensity: string}} here What is falling on the player, or null.
   * @returns {string} Text codes ready for any window to render.
   */
  static here(config, here)
  {
    // somewhere with nothing falling still has to finish the sentence it was dropped into.
    if (here === null) return WeatherLabel.nothingFalling(config);

    return WeatherLabel.for(config, here.preset, here.intensity);
  }
}

export default WeatherLabel;
//endregion WeatherLabel