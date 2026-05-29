//region plugin metadata
class J_Omnipedia_PluginMetadata
  extends PluginMetadata
{
  /**
   * Constructor.
   * @param {string} name The plugin name.
   * @param {string} version The plugin version.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  /**
   * Extends {@link #postInitialize}.<br/>
   * Maps static command and switch metadata used by menu integration.
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
    /**
     * The various data points that define the command for the Omnipedia.
     */
    this.Command = {
      Name: 'The Omnipedia',
      Symbol: 'omni-menu',
      IconIndex: 232,
      ColorIndex: 5,
    };

    /**
     * The id of the switch that will represent whether or not the command
     * should be visible in the JABS menu.
     * @type {number}
     */
    this.InJabsMenuSwitch = 102;

    /**
     * The id of the switch that will represent whether or not the command
     * should be visible in the main menu.
     * @type {number}
     */
    this.InMainMenuSwitch = 102;
  }
}

export default J_Omnipedia_PluginMetadata;
//endregion plugin metadata