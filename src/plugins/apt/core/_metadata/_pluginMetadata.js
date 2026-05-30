//region plugin metadata
class JAptitude_PluginMetadata
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
     * The id of a switch that represents whether or not this system is accessible in the menu.
     * @type {number}
     // policy step inside initialize metadata.
     */
    this.menuSwitchId = J.BASE.Helpers.parsePluginInt(this.parsedPluginParameters['menu-switch'], 0);

    // policy step inside initialize metadata.
    /**
     * The maximum level difference between actor and enemy that allows AP gain.
     * @type {number}
     // policy step inside initialize metadata.
     */
    this.maxLevelThreshold = J.BASE.Helpers.parsePluginInt(
      this.parsedPluginParameters['max-level-threshold'],
      NaN,
    );

    // policy step inside initialize metadata.
    /**
     * Whether or not the level threshold limit is being used.
     * @type {boolean}
     */
    this.usingLevelThresholdLimit = this.maxLevelThreshold > -1;
  }
}

export default JAptitude_PluginMetadata;
//endregion plugin metadata