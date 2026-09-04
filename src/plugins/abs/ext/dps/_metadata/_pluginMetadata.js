//region plugin metadata
/**
 * Plugin metadata for J-ABS-Dps.
 *
 * One tunable, and it is the one worth tuning: how far back the rolling rate looks. The right value
 * is a function of how long a typical fight lasts, which is a thing that is learned by watching the
 * number rather than reasoned about in advance.
 */
class JAbsDps_PluginMetadata
  extends PluginMetadata
{
  /**
   * Constructor.
   * @param {string} name The name of this plugin.
   * @param {string} version The semver-formatted version of this plugin.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  /**
   * Extends {@link #postInitialize}.<br/>
   * Reads the rolling window length from plugin parameters.
   */
  postInitialize()
  {
    // perform original logic.
    super.postInitialize();

    // initialize this plugin from configuration.
    this.initializeMetadata();
  }

  /**
   * Initializes the metadata associated with this plugin.
   *
   * Parameter-driven fields are declared here rather than as class fields, so that values coming
   * out of the RMMZ plugin manager actually apply after load.
   */
  initializeMetadata()
  {
    /**
     * How many seconds of combat time the rolling rate looks back across.
     *
     * Shorter than a typical fight on purpose. Once the window outlasts the encounter it stops
     * being a rate and becomes a smoothing filter- three seconds of swinging divided by a fifteen
     * second window reads as a fifth of the real output.
     * @type {number}
     */
    this.rollingWindowSeconds = Number(this.parsedPluginParameters['rollingWindowSeconds'] ?? 5);

    /**
     * The rolling window length expressed in frames, which is the unit the tracker measures in.
     * @type {number}
     */
    this.rollingWindowFrames = this.rollingWindowSeconds * 60;
  }
}

export default JAbsDps_PluginMetadata;
//endregion plugin metadata