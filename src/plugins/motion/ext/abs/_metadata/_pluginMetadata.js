//region plugin metadata
/**
 * The metadata for J-Motion-ABS.
 *
 * Death and loot pacing are read from the same external config J-Motion core uses, under their own
 * `death` and `loot` sections. Keeping them there rather than in plugin parameters means the speed
 * at which everything in the game dies or fades away is one file a designer can open, which is the
 * sort of thing that gets retuned by feel rather than by reasoning.
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
   * The loot expiry pacing used when the config says nothing at all.
   *
   * Frames, and the same numbers the shipped config carries. `warnFrames` is when the drop starts
   * blinking and `fadeFrames` is when it additionally starts dissolving, so the fade window sits
   * inside the warning one rather than beside it.
   * @type {Object}
   */
  static FALLBACK_LOOT = {
    warnFrames: 300,
    fadeFrames: 120,
    flicker: {
      min: 0.2,
      max: 1.0,
      interval: 8,
    },
  };

  /**
   * Extends {@link #postInitialize}.<br>
   * Reads the death and loot pacing out of the shared motion configuration.
   */
  postInitialize()
  {
    // perform original logic.
    super.postInitialize();

    // read the file once and hand it to each section rather than re-reading it per section.
    const parsedConfiguration = this.loadMotionConfiguration();

    // initialize the death pacing from configuration.
    this.initializeDeathMetadata(parsedConfiguration);

    // initialize the loot pacing from configuration.
    this.initializeLootMetadata(parsedConfiguration);
  }

  /**
   * Reads the shared motion configuration off disk.
   * @returns {Object} The parsed configuration root.
   */
  loadMotionConfiguration()
  {
    const options = ExternalJsonConfigLoaderOptions.Builder()
      .pluginName(__PLUGIN_NAME__)
      .configName('motion configuration')
      .build();

    return ExternalJsonConfigLoader.load(J_MOTION_ABS_PluginMetadata.CONFIG_PATH, options);
  }

  /**
   * Reads how long each death style lasts, and which one everything gets by default.
   * @param {Object} parsedConfiguration The parsed motion configuration root.
   */
  initializeDeathMetadata(parsedConfiguration)
  {
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
   * Reads how a loot drop announces that it is running out of time.
   * @param {Object} parsedConfiguration The parsed motion configuration root.
   */
  initializeLootMetadata(parsedConfiguration)
  {
    const lootConfiguration = parsedConfiguration.loot ?? {};
    const fallback = J_MOTION_ABS_PluginMetadata.FALLBACK_LOOT;

    /**
     * How many frames before a loot drop expires it begins blinking.
     * @type {number}
     */
    this.lootExpiryWarnFrames = lootConfiguration.expiryWarnFrames ?? fallback.warnFrames;

    /**
     * How many frames before a loot drop expires it additionally begins dissolving.
     * @type {number}
     */
    this.lootExpiryFadeFrames = lootConfiguration.expiryFadeFrames ?? fallback.fadeFrames;

    /**
     * The shape of the blink: the opacity range it swings between and how often it re-rolls.
     * @type {{min: number, max: number, interval: number}}
     */
    this.lootExpiryFlicker = { ...fallback.flicker, ...lootConfiguration.flicker };
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