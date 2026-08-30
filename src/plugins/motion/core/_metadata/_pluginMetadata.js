//region plugin metadata
/**
 * The metadata for J-Motion.
 *
 * Every motion type's default parameters live in an external config rather than in plugin
 * parameters, because retuning how the whole game breathes is a data edit that should not require
 * opening the plugin manager or rebuilding anything.
 */
class J_MOTION_PluginMetadata
  extends PluginMetadata
{
  /**
   * The path where the config for motion defaults is located.
   * @type {string}
   */
  static CONFIG_PATH = 'data/config.motion.json';

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
   * Loads the motion defaults from external configuration.
   */
  postInitialize()
  {
    // perform original logic.
    super.postInitialize();

    // initialize the motion defaults from configuration.
    this.initializeMotionDefaults();
  }

  /**
   * Reads every motion type's default parameters out of the external config.
   *
   * The config is authoritative for defaults; the type registry only names which parameters a type
   * accepts and in what order. That split means a designer retuning the game never touches source.
   */
  initializeMotionDefaults()
  {
    const options = ExternalJsonConfigLoaderOptions.Builder()
      .pluginName(__PLUGIN_NAME__)
      .configName('motion configuration')
      .build();

    const parsedConfiguration = ExternalJsonConfigLoader.load(J_MOTION_PluginMetadata.CONFIG_PATH, options);

    // flatten the blob into a type:defaults map for lookup at declaration time.
    const defaultsByType = new Map();
    Object.keys(parsedConfiguration)
      .forEach(motionType => defaultsByType.set(motionType, parsedConfiguration[motionType]));

    /**
     * A motionType:defaults map of every configured motion type.
     * @type {Map<string, Object<string, any>>}
     */
    this.motionDefaults = defaultsByType;
  }

  /**
   * Gets the configured default parameters for a motion type.
   *
   * An unconfigured type is not an error worth throwing over — the registry still knows the type's
   * parameter names, so the caller falls back to the registry's own baked defaults and the motion
   * still renders.
   * @param {string} motionType The name of the motion type, ex: `breathe`.
   * @returns {Object<string, any>} The configured defaults, or an empty object when unconfigured.
   */
  defaultsForMotionType(motionType)
  {
    // hand back nothing meaningful when this type was never configured.
    if (this.motionDefaults.has(motionType) === false) return {};

    // hand back the configured defaults.
    return this.motionDefaults.get(motionType);
  }
}

export default J_MOTION_PluginMetadata;
//endregion plugin metadata