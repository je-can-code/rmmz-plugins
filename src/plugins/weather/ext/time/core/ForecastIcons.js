//region ForecastIcons
/**
 * The picture a forecast draws for each look, when there is one.
 *
 * **Absence is the normal case and must stay legible.** Fifteen presets need artwork and the game
 * has a handful, so a screen that broke, blanked, or drew a placeholder box for the rest would be
 * unusable for as long as it takes to draw the others - which is exactly the period this has to
 * work through. A preset without an icon falls back to its own name, so the forecast is complete
 * from the first day and gets prettier rather than gaining features.
 */
class ForecastIcons
{
  /**
   * The icon index meaning "nothing drawn".
   *
   * Zero rather than a negative, because zero is what an unset numeric field reads as in the
   * editor and in hand-written config alike.
   * @type {number}
   */
  static None = 0;

  /**
   * The icon a given look is drawn with.
   * @param {object} config The parsed contents of `config.weather.json`.
   * @param {string} presetName The look being drawn.
   * @returns {number} The icon index, or {@link ForecastIcons.None} when it has no artwork yet.
   */
  static indexFor(config, presetName)
  {
    const preset = config.presets[presetName];

    // a look the config has never heard of has no icon by definition; whoever asked will draw its
    // name, which is the most useful thing that can be said about it.
    if (preset === undefined) return ForecastIcons.None;

    if (preset.iconIndex === undefined) return ForecastIcons.None;

    return preset.iconIndex;
  }

  /**
   * Whether a given look has artwork yet.
   * @param {object} config The parsed contents of `config.weather.json`.
   * @param {string} presetName The look being drawn.
   * @returns {boolean}
   */
  static hasIcon(config, presetName)
  {
    return ForecastIcons.indexFor(config, presetName) !== ForecastIcons.None;
  }

  /**
   * Every look still waiting on artwork.
   *
   * Reported at boot rather than discovered by opening the forecast and squinting at which cells
   * are words. Not a fault - a game that never draws one is perfectly playable - so this is
   * informational and says so.
   * @param {object} config The parsed contents of `config.weather.json`.
   * @returns {string[]}
   */
  static missing(config)
  {
    return Object.keys(config.presets)
      .filter(name => name.startsWith('_') === false)
      .filter(name => ForecastIcons.hasIcon(config, name) === false);
  }
}

export default ForecastIcons;
//endregion ForecastIcons