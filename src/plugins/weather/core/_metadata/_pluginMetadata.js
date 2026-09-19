//region plugin metadata
/**
 * The metadata for J-Weather.
 *
 * Every look this plugin can draw lives in an external config rather than in plugin parameters,
 * because retuning what rain looks like is a data edit that should not require opening the plugin
 * manager or rebuilding anything. It is also the kind of thing that gets tuned in dozens of small
 * passes, and a plugin parameter is a miserable place to do that from.
 */
class J_WEATHER_PluginMetadata
  extends PluginMetadata
{
  /**
   * The path where the config for weather presets is located.
   * @type {string}
   */
  static CONFIG_PATH = 'data/config.weather.json';

  /**
   * Constructor.
   * @param {string} name The name of this plugin.
   * @param {string} version The version of this plugin.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  /**
   * Extends {@link #postInitialize}.<br>
   * Loads the weather presets from external configuration.
   */
  postInitialize()
  {
    // perform original logic.
    super.postInitialize();

    // initialize the weather presets from configuration.
    this.initializeWeatherPresets();
  }

  /**
   * Reads every motion and every preset out of the external config.
   *
   * The whole file is kept rather than picked apart, because a preset is resolved against the
   * motions in the same breath it is looked up - handing the two around separately would mean every
   * caller carrying both and eventually one of them carrying a mismatched pair.
   */
  initializeWeatherPresets()
  {
    const options = ExternalJsonConfigLoaderOptions.Builder()
      .pluginName(__PLUGIN_NAME__)
      .configName('weather configuration')
      .build();

    const parsedConfiguration = ExternalJsonConfigLoader.load(J_WEATHER_PluginMetadata.CONFIG_PATH, options);

    /**
     * Every look this game knows how to draw, and the motions they are built from.
     * @type {{motions: Object, presets: Object, variables: Object}}
     */
    this.weatherConfig = parsedConfiguration;
  }
}

export default J_WEATHER_PluginMetadata;
//endregion plugin metadata