//region plugin metadata
/**
 * Plugin metadata class for J-ABS-Pixelistics.
 */
class JAbsPixelistics_PluginMetadata
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
     * The radius in tiles from home that an idle enemy may wander.
     * A value of 1.5 produces a 3x3-tile wander area centered on the home point.
     * @type {number}
     */
    this.IdleWanderRadius = parseFloat(this.parsedPluginParameters['idleWanderRadius']) || 1.50;
  }
}
//endregion plugin metadata
