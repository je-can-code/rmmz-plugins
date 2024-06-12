//region plugin metadata
class J_RegionSkillsPluginMetadata extends PluginMetadata
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
     * The number of frames between executing while standing on the given regionId.<br>
     * Lower this to increase frequency of skill execution.<br>
     * Raise this to reduce frequency of skill execution.<br>
     * This only applies while a battler is standing on a tile with a valid region skill.
     * @type {number}
     */
    this.delayBetweenExecutions = this.parsedPluginParameters['execution-delay'] ?? 60;
  }
}
//endregion plugin metadata