//region plugin metadata
/**
 * The metadata for J-Lighting-Time.
 *
 * The whole day/night curve - what colour each phase is and how much light it takes away - lives in
 * an external config rather than in source or in plugin parameters. Deciding what night looks like
 * is an art decision that gets revisited, and revisiting it should be editing a file rather than
 * rebuilding a plugin.
 */
class J_LIGHTING_TIME_PluginMetadata
  extends PluginMetadata
{
  /**
   * The path where the config for the day/night curve is located.
   * @type {string}
   */
  static CONFIG_PATH = 'data/config.lighting-time.json';

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
   * Loads the day/night curve from external configuration.
   */
  postInitialize()
  {
    // perform original logic.
    super.postInitialize();

    // initialize the curve from configuration.
    this.initializeCurve();
  }

  /**
   * Reads the day/night curve out of the external config.
   *
   * The sequence is bookended by the same phase at both ends on purpose. A day opens partway through
   * the fade *into* its first phase and closes having just arrived back at it, so listing it twice
   * lets one lookup serve every hour of the day with no wraparound special case anywhere.
   */
  initializeCurve()
  {
    const options = ExternalJsonConfigLoaderOptions.Builder()
      .pluginName(__PLUGIN_NAME__)
      .configName('day/night lighting curve')
      .build();

    const parsed = ExternalJsonConfigLoader.load(J_LIGHTING_TIME_PluginMetadata.CONFIG_PATH, options);

    /**
     * The tone each phase of the day settles on, in the order a full day cycles through them.
     * @type {number[][]}
     */
    this.toneSequence = parsed.sequence.map(phaseName => parsed.phases[phaseName].tone);

    /**
     * The darkness each phase of the day settles on, in the order a full day cycles through them.
     * @type {number[]}
     */
    this.darknessSequence = parsed.sequence.map(phaseName => parsed.phases[phaseName].darkness);
  }
}

export default J_LIGHTING_TIME_PluginMetadata;
//endregion plugin metadata