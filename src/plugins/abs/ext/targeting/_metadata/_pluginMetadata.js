//region plugin metadata
class JTargeting_PluginMetadata
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

    // initialize this plugin from configuration.
    this.initializeMetadata();
  }

  /**
   * Initializes the metadata associated with this plugin.
   */
  initializeMetadata()
  {
    /**
     * The filename (under img/system/) of the reticle sprite shown while aiming.
     * @type {string}
     */
    this.reticleImage = this.parsedPluginParameters['reticleImage'] ?? 'WindowArrow';

    /**
     * The screen X of the cycle-select list window.
     * @type {number}
     */
    this.targetingListWindowX = parseInt(this.parsedPluginParameters['targetingListWindowX']);

    /**
     * The screen Y of the cycle-select list window.
     * @type {number}
     */
    this.targetingListWindowY = parseInt(this.parsedPluginParameters['targetingListWindowY']);
  }
}

export default JTargeting_PluginMetadata;
//endregion plugin metadata
