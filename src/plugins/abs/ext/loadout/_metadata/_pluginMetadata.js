//region plugin metadata
class J_JabsLoadout_PluginMetadata
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
    // perform original logic.
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
     * An id of zero means the command is always available.
     * @type {number}
     */
    this.menuSwitchId = J.BASE.Helpers.parsePluginInt(this.parsedPluginParameters['menu-switch'], 0);

    /**
     * The name this system's command carries in the menu.
     * @type {string}
     */
    this.commandName = this.parsedPluginParameters['command-name'] ?? 'Loadout';

    /**
     * The icon this system's command carries in the menu.
     * @type {number}
     */
    this.commandIconIndex = J.BASE.Helpers.parsePluginInt(this.parsedPluginParameters['command-icon'], 77);
  }
}

export default J_JabsLoadout_PluginMetadata;
//endregion plugin metadata