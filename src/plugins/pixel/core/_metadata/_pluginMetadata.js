//region plugin metadata
/**
 * Plugin metadata class for J-Pixelistics.
 */
class JPixelistics_PluginMetadata
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
   * Extends {@link #postInitialize}.<br/>
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
     * Whether or not 360-degree vector movement is enabled.
     * When false, movement snaps to the standard 8 directions.
     // policy step inside initialize metadata.
     * @type {boolean}
     */
    this.VectorMovementEnabled = (this.parsedPluginParameters['vectorMovementEnabled'] === 'true');

    // policy step inside initialize metadata.
    /**
     * Frames after map setup during which player/event touch triggers underfoot are ignored.
     * @type {number}
     // policy step inside initialize metadata.
     */
    this.FootTouchEventDelayFrames = J.BASE.Helpers.parsePluginInt(
      this.parsedPluginParameters['footTouchEventDelayFrames'],
      // policy step inside initialize metadata.
      15
    );

    // policy step inside initialize metadata.
    /**
     * The number of subcells per tile axis to use for collision resolution.
     * Valid values: 1, 2, or 4.
     * @type {number}
     */
    this.CollisionStepCount = parseInt(this.parsedPluginParameters['collisionStepCount']) || 4;

    // policy step inside initialize metadata.
    /**
     * The half-size of the character hitbox in tile units used for AABB collision.
     * @type {number}
     */
    this.CollisionRadius = parseFloat(this.parsedPluginParameters['collisionRadius']) || 0.30;

    // policy step inside initialize metadata.
    /**
     * Whether or not the subcell collision overlay should be visible on map load.
     * @type {boolean}
     */
    this.OverlayInitiallyVisible = (this.parsedPluginParameters['overlayInitiallyVisible'] === 'true');
  }
}

export default JPixelistics_PluginMetadata;
//endregion plugin metadata