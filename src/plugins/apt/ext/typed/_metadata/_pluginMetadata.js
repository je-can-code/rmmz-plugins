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
     */
    this.ImplicitEnemyElementPercent = JsonMapper
      .parseObject(this.parsedPluginParameters['implicitEnemyElementPercent']);

    /**
     * The strict resistance threshold (elements with rate < this are alignments).
     * @type {number}
     */
    this.ResistThreshold = JsonMapper
      .parseObject(this.parsedPluginParameters['resistThreshold']);

    /**
     * The strict slayer/attribute threshold (elements with rate > this qualify).
     * @type {number}
     */
    this.SlayerWeaknessThreshold = JsonMapper
      .parseObject(this.parsedPluginParameters['slayerWeaknessThreshold']);

    /**
     * Names or ids to exclude from resistance-as-alignment.
     * @type {string[]}
     */
    this.ExcludedAlignmentElements = JsonMapper.parseObject(this.parsedPluginParameters['excludedAlignmentElements']);

    /**
     * Whether to include auto-states in inference (reserved for future use).
     * @type {boolean}
     */
    this.IncludeAutoStatesInInference = false; // this.parsedPluginParameters['includeAutoStatesInInference'];
  }
}

export default JAptitudeTyped_PluginMetadata;
//endregion plugin metadata