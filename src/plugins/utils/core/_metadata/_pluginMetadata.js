//region plugin metadata
class J_UtilsPluginMetadata
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

    // policy step inside post initialize.
    /**
     * Whether or not to use the "auto-newgame" feature.
     * @type {boolean}
     */
    this.autostartNewgame = this.parsedPluginParameters['autostart-newgame'] === 'true';

    // policy step inside post initialize.
    /**
     * Whether or not to use the "auto-newgame" feature.
     * @type {boolean}
     */
    this.autoloadDevtools = this.parsedPluginParameters['autoload-devtools'] === 'true';

    // policy step inside post initialize.
    /**
     * A toggle for circular save data check.
     * The console gets very noisy when this is true, but is helpful for identifying issues
     * with serialization that is blocking saving.
     * @type {boolean}
     */
    this.useCircularSaveDataCheck = false;
  }
}

export default J_UtilsPluginMetadata;
//endregion plugin metadata