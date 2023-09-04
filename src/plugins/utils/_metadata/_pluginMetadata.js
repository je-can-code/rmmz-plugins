//region plugin metadata
class J_UtilsPluginMetadata extends PluginMetadata
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


    /**
     * Whether or not to use the "auto-newgame" feature.
     * @type {boolean}
     */
    this.autostartNewgame = this.parsedPluginParameters['autostart-newgame'] === 'true';

    /**
     * Whether or not to use the "auto-newgame" feature.
     * @type {boolean}
     */
    this.autoloadDevtools = this.parsedPluginParameters['autoload-devtools'] === 'true';
  }
}
//endregion plugin metadata