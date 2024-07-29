//region plugin metadata
class J_QUEST_PluginMetadata extends PluginMetadata
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
     */
    this.menuSwitchId = parseInt(this.parsedPluginParameters['menu-switch']);

    /**
     * When this switch is enabled, the command will be rendered into the command list as well.
     * @type {number}
     */
    this.enabledSwitchId = 104; //parseInt(this.parsedPluginParameters['enabled-switch-id']);

    /**
     * The data associated with rendering this plugin's command in a command list.
     */
    this.Command = {
      /**
       * The name of the command when viewed from the Omnipedia.
       */
      Name: "Questopedia",

      /**
       * The symbol of the command in the command list.
       */
      Symbol: "quest-pedia",

      /**
       * The icon for the command anywhere it is viewed.
       */
      IconIndex: 2564,
    };
  }
}
//endregion plugin metadata