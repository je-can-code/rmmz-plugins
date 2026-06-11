//region plugin metadata
/**
 * Plugin metadata for J-ABS-FOOD.
 * Exposes the equip food label used in the JABS quick-menu.
 * The Overstuffed chain entry state is resolved from the boot-time registry
 * rather than from an explicit parameter.
 */
class JFood_PluginMetadata
  extends PluginMetadata
{
  /**
   * Constructor.
   * @param {string} name The plugin name.
   * @param {string} version The plugin version string.
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
    // execute original logic.
    super.postInitialize();

    // initialize this plugin from configuration.
    this.initializeMetadata();
  }

  /**
   * Initializes the metadata associated with this plugin.
   * The Overstuffed entry state is now resolved from the boot-time chain registry
   * rather than from an explicit plugin parameter.
   */
  initializeMetadata()
  {
    // the label shown for the Equip Food command in the JABS quick-menu.
    this.EquipFoodText = String(this.parsedPluginParameters['equipFoodText'] ?? 'Equip Food');
  }
}

export default JFood_PluginMetadata;
//endregion plugin metadata