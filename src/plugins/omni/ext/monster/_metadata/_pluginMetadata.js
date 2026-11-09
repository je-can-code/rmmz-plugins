//region plugin metadata
class J_OmniMonster_PluginMetadata
  extends PluginMetadata
{
  /**
   * The path where the omnipedia's configuration is located.
   * @type {string}
   */
  static CONFIG_PATH = 'data/config.omni.json';

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

    // the pages the monsterpedia flips between are authored in the omnipedia's configuration.
    this.initializeMonsterTypes();
  }

  /**
   * Loads the kinds of entry the monsterpedia lists, each a page of its own, from the omnipedia's
   * configuration file.<br/>
   * A kind carries the key enemy rows name with `<monsterType:KEY>`, plus the name and icon its page
   * shows in the strip above the list. The order they are authored in is the order L2/R2 walks them,
   * and the first of them is the page the monsterpedia opens on.
   */
  initializeMonsterTypes()
  {
    // name this plugin and its file in anything the loader has to report.
    const options = ExternalJsonConfigLoaderOptions.Builder()
      .pluginName(__PLUGIN_NAME__)
      .configName('omnipedia configuration')
      .build();

    // read the configuration; a missing or malformed file stops the boot with the path named.
    const parsedConfiguration = ExternalJsonConfigLoader.load(J_OmniMonster_PluginMetadata.CONFIG_PATH, options);

    /**
     * Every kind of entry the monsterpedia lists, in the order its pages are walked, and whether the
     * entries on each page show their stats.
     * @type {{key: string, name: string, iconIndex: number, showsStats: boolean}[]}
     */
    this.monsterTypes = parsedConfiguration.monsterTypes;
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