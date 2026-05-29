//region plugin metadata
class JPassiveConditional_PluginMetadata
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

    // pull reconcile cadence from plugin parameters.
    this.initializeMetadata();
  }

  /**
   * Parses the plugin parameters and assigns them to the metadata.
   */
  initializeMetadata()
  {
    /**
     * Frames between map-side conditional passive reconciles per {@link JABS_Battler}.
     * @type {number}
     */
    const parsed = parseInt(this.parsedPluginParameters['reconcile-delay-frames'], 10);

    this.reconcileDelayFrames = Number.isNaN(parsed) ? 15 : parsed;
  }
}

export default JPassiveConditional_PluginMetadata;
//endregion plugin metadata