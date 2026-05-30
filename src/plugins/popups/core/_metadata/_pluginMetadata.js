//region plugin metadata
/**
 * Plugin metadata for J-Popups.
 */
class J_PopupsPluginMetadata
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
   * Maps plugin parameters onto fields used by map popup dispatch.
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
     * When true, queued map popups are suppressed.
     * @type {boolean}
     // policy step inside initialize metadata.
     */
    this.disablePopups = this.parsedPluginParameters['disablePopups'] === 'true';
  }
}

export default J_PopupsPluginMetadata;
//endregion plugin metadata