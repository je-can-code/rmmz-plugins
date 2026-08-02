//region plugin metadata
/**
 * The metadata for J-Base-Save, which owns the shape a savefile takes on disk.
 */
class J_BaseSavePluginMetadata
  extends PluginMetadata
{
  /**
   * Constructor.
   * @param {string} name The name of this plugin.
   * @param {string} version The version of this plugin.
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
   */
  initializeMetadata()
  {
    /**
     * How many past generations of a slot survive on disk for rollback.
     *
     * Three is the default because the failure mode of a bad save should be "you lost the last
     * save", never "you lost the file". Size is deliberately not a consideration here.
     * @type {number}
     */
    this.retainedSaveGenerations = this.parsedPluginParameters['retainedSaveGenerations'] ?? 3;
  }
}

export default J_BaseSavePluginMetadata;
//endregion plugin metadata
