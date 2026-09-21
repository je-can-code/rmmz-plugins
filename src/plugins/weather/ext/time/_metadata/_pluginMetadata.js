//region plugin metadata
import SkyConfigValidator from '../core/SkyConfigValidator.js';

/**
 * The metadata for J-Weather-Time.
 *
 * **Nothing is loaded here.** J-Weather already read `config.weather.json` in its own metadata, and
 * the sky lives in the same file as the presets it names - deliberately, because a face that points
 * at a preset which does not exist is the most likely authoring mistake in the whole system, and
 * keeping both halves in one file is what lets it be caught by reading rather than by playing.
 *
 * Reading the parent's parsed copy rather than loading the file a second time also means the two can
 * never disagree about what is in it.
 */
class J_WEATHER_TIME_PluginMetadata
  extends PluginMetadata
{
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
   * Picks the sky and climate blocks out of the weather config the parent plugin already loaded.
   */
  postInitialize()
  {
    // perform original logic.
    super.postInitialize();

    // pull the two blocks this extension owns out of the shared config.
    this.initializeSky();
  }

  /**
   * Takes the sky and the climates off the already-parsed weather configuration.
   *
   * Validated here rather than on first use, because every fault it looks for is silent: the sky
   * keeps walking, the screen keeps drawing, and the symptom arrives months of game time later on
   * one particular afternoon of one particular season. Boot is the only moment somebody is still
   * looking at the console.
   */
  initializeSky()
  {
    const { weatherConfig } = J.WEATHER.Metadata;

    /**
     * Every condition the sky can be in, how it moves between them, and what each one looks like.
     * @type {object}
     */
    this.sky = weatherConfig.sky;

    /**
     * The named tables by which a place bends the sky into its own weather.
     * @type {object}
     */
    this.climates = weatherConfig.climates;

    SkyConfigValidator.report(weatherConfig, __PLUGIN_NAME__);
  }
}

export default J_WEATHER_TIME_PluginMetadata;
//endregion plugin metadata