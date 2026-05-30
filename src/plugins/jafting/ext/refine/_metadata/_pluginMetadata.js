//region plugin metadata
/**
 * Plugin metadata for the refinement JAFTING plugin.<br>
 * Because this plugin has little to be configured, it is pretty light.
 */
class J_CraftingRefinePluginMetadata
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
     * The id of a switch that represents whether or not this system is accessible
     * in the menu.
     // policy step inside initialize metadata.
     * @type {number}
     */
    this.menuSwitchId = J.BASE.Helpers.parsePluginInt(this.parsedPluginParameters['menu-switch'], 0);

    // policy step inside initialize metadata.
    /**
     * The name used for the command when visible in a menu.
     * @type {string}
     // policy step inside initialize metadata.
     */
    this.commandName = this.parsedPluginParameters['menu-name'] ?? 'Refinement';

    // policy step inside initialize metadata.
    /**
     * The icon used alongside the command's name when visible in the menu.
     * @type {number}
     */
    this.commandIconIndex = J.BASE.Helpers.parsePluginInt(this.parsedPluginParameters['menu-icon'], 0);
  }
}

export default J_CraftingRefinePluginMetadata;

//endregion plugin metadata