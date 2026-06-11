//region plugin metadata
class JLevelSync_PluginMetadata
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
   * Extends {@link #postInitialize}.<br>
   * Includes translation of plugin parameters.
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
     * The icon index rendered beside level text while content sync is active.
     * Set to 0 to suppress the icon entirely.
     * @type {number}
     */
    this.syncIndicatorIconIndex = Number(this.parsedPluginParameters['sync-indicator-icon']) || 75;

    /**
     * Whether the synced (effective) level is used when calculating EXP rewards.
     * When false (default), real _level is used, preserving J-Level-Flat's
     * level-difference EXP policy.
     * @type {boolean}
     */
    this.syncAffectsExp = this.parsedPluginParameters['sync-affects-exp'] === 'true';
  }
}

export default JLevelSync_PluginMetadata;
//endregion plugin metadata
