//region plugin metadata
class J_RegionEffectsPluginMetadata
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
   *  Extends {@link #postInitialize}.<br>
   *  Includes translation of plugin parameters.
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
     * The global region ids that allow passage on all maps.
     * @type {number[]}
     */
    this.globalAllowRegions = J.REGIONS.Helpers.translateRegionIds(this.parsedPluginParameters['globalAllowRegions']);

    /**
     * The global region ids that deny passage on all maps.
     * @type {number[]}
     */
    this.globalDenyRegions = J.REGIONS.Helpers.translateRegionIds(this.parsedPluginParameters['globalDenyRegions']);
  }
}

export default J_RegionEffectsPluginMetadata;
//endregion plugin metadata