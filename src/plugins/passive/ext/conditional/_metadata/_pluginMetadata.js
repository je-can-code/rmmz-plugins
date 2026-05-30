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
    super.postInitialize();

    this.initializeMetadata();
  }

  /**
   * Parses the plugin parameters and assigns them to the metadata.
   */
  initializeMetadata()
  {
    const reconcileParsed = parseInt(this.parsedPluginParameters['reconcile-delay-frames'], 10);

    /**
     * Frames between map-side passive rule reconciles per {@link JABS_Battler}.
     * @type {number}
     */
    this.reconcileDelayFrames = Number.isNaN(reconcileParsed) ? 15 : reconcileParsed;

    const proximityParsed = parseInt(this.parsedPluginParameters['default-proximity-tiles'], 10);

    /**
     * Default tile radius for alliesNearby/enemiesNearby rules and stack counts.
     * @type {number}
     */
    this.defaultProximityTiles = Number.isNaN(proximityParsed) ? 5 : proximityParsed;
  }
}

export default JPassiveConditional_PluginMetadata;
//endregion plugin metadata
