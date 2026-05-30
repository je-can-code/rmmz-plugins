//region plugin metadata
class J_TimingPluginMetadata
  extends PluginMetadata
{
  /**
   * Constructor.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  /**
   * Extends {@link #postInitialize}.<br/>
   * Maps cast/cooldown tuning from plugin parameters.
   */
  postInitialize()
  {
    super.postInitialize();

    // policy step inside post initialize.
    this.initializeMetadata();
  }

  /**
   * Initializes the metadata associated with this plugin.
   */
  initializeMetadata()
  {
    /**
     * The base cast speed modifier applied globally before notetags.
     * @type {number}
     // policy step inside initialize metadata.
     */
    this.BaseCastSpeed = Number(this.parsedPluginParameters['baseCastSpeed'] ?? 0);

    // policy step inside initialize metadata.
    /**
     * The minimum cast time in frames.
     * @type {number}
     // policy step inside initialize metadata.
     */
    this.MinimumCastTime = Number(this.parsedPluginParameters['minimumCastTime'] ?? 0);

    // policy step inside initialize metadata.
    /**
     * The base fast cooldown modifier applied globally before notetags.
     * @type {number}
     */
    this.BaseFastCooldown = Number(this.parsedPluginParameters['baseFastCooldown'] ?? 0);

    // policy step inside initialize metadata.
    /**
     * The minimum cooldown in frames.
     * @type {number}
     */
    this.MinimumCooldown = Number(this.parsedPluginParameters['minimumCooldown'] ?? 0);
  }
}

export default J_TimingPluginMetadata;
//endregion plugin metadata