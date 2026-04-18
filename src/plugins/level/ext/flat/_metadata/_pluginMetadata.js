//region plugin metadata
class JLevelMasterFlat_PluginMetadata
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
     * The flat experience required to level up.
     * @type {number}
     */
    this.expPerLevel = Number(this.parsedPluginParameters['exp-per-level']) ?? 1000;

    /**
     * The multiplier for base experience policy calculations.
     * @type {number}
     */
    this.policyMultiplier = Number(this.parsedPluginParameters['policy-multiplier']) ?? 1.00;
  }
}

//endregion plugin metadata