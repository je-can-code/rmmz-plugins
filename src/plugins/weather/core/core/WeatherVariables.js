//region WeatherVariables
/**
 * Mirrors the current weather into game variables, so an event can ask about it.
 *
 * Two numbers: what the weather is, and how hard it is going. Both are zero when there is no weather
 * at all, which makes `variable > 0` the honest way to ask "is anything happening" without an event
 * author needing to know what any particular number means.
 *
 * **The mirror is one-way and the variables are never read back as truth.** They exist so a
 * conditional branch can fire - kappas in the rain, a merchant who packs up in a storm - and nothing
 * in this plugin consults them. An author who edits one by hand changes what their own events see and
 * changes nothing about the sky, which is the only relationship between the two that stays honest
 * when somebody inevitably does exactly that.
 *
 * **Ids are declared in configuration rather than derived from position.** A positional scheme would
 * renumber every preset after any insertion, and every conditional branch already written against the
 * old numbers would quietly start meaning something else - the worst kind of breakage, because
 * nothing errors and the game just behaves wrong somewhere nobody is looking.
 */
class WeatherVariables
{
  /**
   * The value written when nothing is happening.
   *
   * Zero rather than an absent write, because a variable that merely stops being updated keeps
   * whatever it last held - so walking out of the rain into a cave would leave every "is it raining"
   * branch in the game still answering yes.
   * @type {number}
   */
  static None = 0;

  /**
   * The pair of numbers describing a resolved weather.
   * @param {object} config The parsed contents of `config.weather.json`.
   * @param {?{preset: string, intensity: string}} resolution What the map resolved to, or null.
   * @returns {{weatherType: number, weatherIntensity: number}}
   */
  static idsFor(config, resolution)
  {
    // nothing is happening, and both numbers say so rather than one of them staying stale.
    if (resolution === null)
    {
      return {
        weatherType: WeatherVariables.None,
        weatherIntensity: WeatherVariables.None,
      };
    }

    return {
      weatherType: WeatherVariables.typeIdFor(config, resolution.preset),
      weatherIntensity: WeatherVariables.intensityIdFor(config, resolution.intensity),
    };
  }

  /**
   * The declared id of a named look.
   * @param {object} config The parsed contents of `config.weather.json`.
   * @param {string} presetName The look being numbered.
   * @returns {number} Its declared id, or zero when it was never given one.
   */
  static typeIdFor(config, presetName)
  {
    const declared = config.presetIds[presetName];

    // a preset that draws perfectly well but was never given a number is a real authoring gap: every
    // event branching on the weather would silently treat this place as having none.
    if (declared === undefined)
    {
      Diagnostics.warn(__PLUGIN_NAME__, `weather preset has no declared id: [ ${presetName} ]!`, {
        declared: Object.keys(config.presetIds),
      });

      return WeatherVariables.None;
    }

    return declared;
  }

  /**
   * The declared id of a strength.
   * @param {object} config The parsed contents of `config.weather.json`.
   * @param {string} intensity The rung being numbered.
   * @returns {number} Its declared id, or zero when it was never given one.
   */
  static intensityIdFor(config, intensity)
  {
    const declared = config.intensityIds[intensity];

    if (declared === undefined)
    {
      Diagnostics.warn(__PLUGIN_NAME__, `weather intensity has no declared id: [ ${intensity} ]!`, {
        declared: Object.keys(config.intensityIds),
      });

      return WeatherVariables.None;
    }

    return declared;
  }

  /**
   * Writes the current weather into the variables events read.
   *
   * Silent when the mirror is switched off, which is how a game that does not branch on weather
   * avoids having two of its variables quietly commandeered.
   * @param {object} config The parsed contents of `config.weather.json`.
   * @param {?{preset: string, intensity: string}} resolution What the map resolved to, or null.
   */
  static sync(config, resolution)
  {
    const { variables } = config;

    if (variables.enabled === false) return;

    const ids = WeatherVariables.idsFor(config, resolution);

    $gameVariables.setValue(variables.weatherType, ids.weatherType);
    $gameVariables.setValue(variables.weatherIntensity, ids.weatherIntensity);
  }
}

export default WeatherVariables;
//endregion WeatherVariables