//region plugin metadata
/**
 * The metadata for J-Motion-ABS.
 *
 * Death pacing is read from the same external config J-Motion core uses, under its own `death`
 * section. Keeping it there rather than in plugin parameters means the speed at which everything in
 * the game dies is one file a designer can open, which is the sort of thing that gets retuned by
 * feel rather than by reasoning.
 */
class J_MOTION_ABS_PluginMetadata
  extends PluginMetadata
{
  /**
   * The path where the motion configuration lives.
   * @type {string}
   */
  static CONFIG_PATH = 'data/config.motion.json';

  /**
   * The death pacing used when the config says nothing at all.
   *
   * A plugin that cannot find its config should still bury the dead. These are frames, and they are
   * the same numbers the shipped config carries.
   * @type {Object<string, number>}
   */
  static FALLBACK_DURATIONS = {
    swift: 30,
    moderate: 60,
    slow: 120,
  };

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
   * Reads the death pacing out of the shared motion configuration.
   */
  postInitialize()
  {
    // perform original logic.
    super.postInitialize();

    // initialize the death pacing from configuration.
    this.initializeDeathMetadata();
  }

  /**
   * Reads how long each death style lasts, and which one everything gets by default.
   */
  initializeDeathMetadata()
  {
    const options = ExternalJsonConfigLoaderOptions.Builder()
      .pluginName(__PLUGIN_NAME__)
      .configName('motion configuration')
      .build();

    const parsedConfiguration = ExternalJsonConfigLoader.load(J_MOTION_ABS_PluginMetadata.CONFIG_PATH, options);
    const deathConfiguration = parsedConfiguration.death ?? {};

    /**
     * How many frames each death style holds the corpse open for.
     * @type {Object<string, number>}
     */
    this.deathDurations = { ...J_MOTION_ABS_PluginMetadata.FALLBACK_DURATIONS, ...deathConfiguration.durations };

    /**
     * The style anything dies with when nothing has said otherwise.
     * @type {string}
     */
    this.defaultDeathStyle = deathConfiguration.defaultStyle ?? 'swift';
  }

  /**
   * How long a death style runs for, in frames.
   *
   * An unrecognised style is a typo in somebody's notetag rather than a reason to stop the game, so
   * it falls back to the default pacing and the resolver reports the bad name separately.
   * @param {string} style The death style being asked about.
   * @returns {number}
   */
  deathDurationFor(style)
  {
    const configured = this.deathDurations[style];

    // an unknown style still has to take some amount of time, or the corpse pops.
    if (configured === undefined) return this.deathDurations[this.defaultDeathStyle];

    return configured;
  }

  /**
   * Determines whether a style name is one this plugin knows how to animate.
   * @param {string} style The death style being checked.
   * @returns {boolean}
   */
  isKnownDeathStyle(style)
  {
    return this.deathDurations[style] !== undefined;
  }
}

export default J_MOTION_ABS_PluginMetadata;
//endregion plugin metadata