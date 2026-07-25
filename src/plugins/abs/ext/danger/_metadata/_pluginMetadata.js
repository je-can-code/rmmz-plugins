//region plugin metadata
class J_DangerPluginMetadata
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
   * Maps danger indicator defaults from plugin parameters.
   */
  postInitialize()
  {
    super.postInitialize();

    this.initializeMetadata();
  }

  /**
   * Initializes the metadata associated with this plugin.
   */
  initializeMetadata()
  {
    this.DefaultEnemyShowDangerIndicator =
      this.parsedPluginParameters['defaultEnemyShowDangerIndicator'] === "true";

    // assign danger indicator icons on this instance for callers.
    this.DangerIndicatorIcons =
      J.ABS.EXT.DANGER.Helpers.PluginManager.TranslateDangerIndicatorIcons(
        this.parsedPluginParameters['dangerIndicatorIconData'],
      );
  }
}

export default J_DangerPluginMetadata;
//endregion plugin metadata