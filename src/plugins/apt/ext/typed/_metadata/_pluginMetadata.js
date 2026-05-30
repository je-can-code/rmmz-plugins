//region plugin metadata
/**
 * The metadata for the J-APT Typed extension.
 */
class JAptitudeTyped_PluginMetadata
  extends PluginMetadata
{
  /**
   * Constructor.
   * @param {string} name The plugin name.
   * @param {string} version The plugin version.
   */
  constructor(name, version)
  {
    // initialize the base.
    super(name, version);
  }

  /**
   * Extends {@link #postInitialize}.<br/>
   * Also initializes the typed‑AP configuration from parsed parameters.
   */
  postInitialize()
  {
    // execute original logic.
    super.postInitialize();

    // initialize this plugin from configuration.
    this.initializeMetadata();
  }

  /**
   * Initializes the metadata associated with this plugin.
   */
  initializeMetadata()
  {
    /**
     * Integer percent applied to inferred enemy element types per kill (0-100).
     * @type {number}
     // policy step inside initialize metadata.
     */
    this.ImplicitEnemyElementPercent = JsonMapper
      .parseObject(this.parsedPluginParameters['implicitEnemyElementPercent']);

    // policy step inside initialize metadata.
    /**
     * The strict resistance threshold (elements with rate < this are alignments).
     * @type {number}
     // policy step inside initialize metadata.
     */
    this.ResistThreshold = JsonMapper
      .parseObject(this.parsedPluginParameters['resistThreshold']);

    // policy step inside initialize metadata.
    /**
     * The strict slayer/attribute threshold (elements with rate > this qualify).
     * @type {number}
     // policy step inside initialize metadata.
     */
    this.SlayerWeaknessThreshold = JsonMapper
      .parseObject(this.parsedPluginParameters['slayerWeaknessThreshold']);

    // policy step inside initialize metadata.
    /**
     * Names or ids to exclude from resistance-as-alignment.
     * @type {string[]}
     */
    this.ExcludedAlignmentElements = JsonMapper.parseObject(this.parsedPluginParameters['excludedAlignmentElements']);

    // policy step inside initialize metadata.
    /**
     * Whether to include auto-states in inference (reserved for future use).
     * @type {boolean}
     */
    this.IncludeAutoStatesInInference = false; // this.parsedPluginParameters['includeAutoStatesInInference'];
  }
}

export default JAptitudeTyped_PluginMetadata;
//endregion plugin metadata