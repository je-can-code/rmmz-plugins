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

    /**
     * The terrain tags that deny passage on all maps.
     *
     * Terrain tags are authored on the tileset rather than the map, which makes them the cheaper
     * way to mark a whole family of tiles unwalkable- ceilings, cliff faces, anything that reads as
     * scenery but happens to sit on a passable tile. Marking those by region would mean painting
     * every map that uses the tileset.
     * @type {number[]}
     */
    this.globalDenyTerrainTags = J.REGIONS.Helpers.translateRegionIds(this.parsedPluginParameters['globalDenyTerrainTags']);
  }
}

export default J_RegionEffectsPluginMetadata;
//endregion plugin metadata