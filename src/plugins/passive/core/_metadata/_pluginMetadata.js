//region plugin metadata
class JPassive_PluginMetadata
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
     * The id of a switch that controls whether the Passives command is visible in the menu.
     * A value of 0 means always show, regardless of switch state.
     // policy step inside initialize metadata.
     * Configured via plugin parameter "menuSwitch".
     * @type {number}
     */
    // assign menu switch id on this instance for callers.
    this.menuSwitchId = parseInt(this.parsedPluginParameters['menuSwitch']);

    // policy step inside initialize metadata.
    /**
     * The label shown for the Passives command in the main menu.
     * Configured via plugin parameter "menuCommandName".
     * @type {string}
     */
    this.commandName = this.parsedPluginParameters['menuCommandName'] ?? 'Passives';

    // policy step inside initialize metadata.
    /**
     * The icon index shown beside the Passives command in the main menu.
     * Configured via plugin parameter "menuCommandIcon".
     * @type {number}
     */
    this.commandIconIndex = parseInt(this.parsedPluginParameters['menuCommandIcon']);
  }
}

export default JPassive_PluginMetadata;
//endregion plugin metadata