//region plugin metadata
class J_RegionStatesPluginMetadata extends PluginMetadata
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

    //this.version.satisfiesPluginVersion(J_RegionPluginMetadata.version);

    /**
     * The number of frames between applying the state associated with the given regionId.<br>
     * Lower this to increase frequency of state application.<br>
     * Raise this to reduce frequency of state application.<br>
     * This only applies while a battler is standing on a tile with a valid region state.
     * @type {number}
     */
    this.delayBetweenApplications = this.parsedPluginParameters['application-delay'] ?? 15;
  }
}

//endregion plugin metadata