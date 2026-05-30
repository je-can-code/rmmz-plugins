//region plugin metadata
class J_OmniMonster_PluginMetadata
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
   * Maps static command and switch metadata used by the monsterpedia entry.
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
     * The various data points that define the command for the Monsterpedia.
     */
    // assign command on this instance for callers.
    this.Command = {
      Name: 'Monsterpedia',
      Symbol: 'monster-pedia',
      IconIndex: 14,
    };

    /**
     * The id of the switch that will represent whether or not the command
     * should be visible in the Omnipedia menu.
     * @type {number}
     */
    this.EnabledSwitch = 103;
  }
}

export default J_OmniMonster_PluginMetadata;
//endregion plugin metadata