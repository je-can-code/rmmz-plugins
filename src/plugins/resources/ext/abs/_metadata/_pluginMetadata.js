//region plugin metadata
class JResourcesAbs_PluginMetadata
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

    // parse the heal cascade chain depth from plugin parameters.
    this.healChainDepth = parseInt(this.parsedPluginParameters['healChainDepth']) || 5;
  }
}

export default JResourcesAbs_PluginMetadata;
//endregion plugin metadata