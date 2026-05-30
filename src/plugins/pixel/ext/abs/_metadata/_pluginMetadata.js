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
     * The radius in tiles from home that an idle enemy may wander.
     * A value of 1.5 produces a 3x3-tile wander area centered on the home point.
     // policy step inside initialize metadata.
     * @type {number}
     */
    this.IdleWanderRadius = parseFloat(this.parsedPluginParameters['idleWanderRadius']) || 1.50;

    // policy step inside initialize metadata.
    /**
     * The default enemy hitbox width in tiles when no override is provided.
     * This is the full width, not a half-width/radius.
     // policy step inside initialize metadata.
     * @type {number}
     */
    this.DefaultEnemyHitboxWidth = parseFloat(this.parsedPluginParameters['defaultEnemyHitboxWidth']) || 0.80;

    // policy step inside initialize metadata.
    /**
     * The default enemy hitbox height in tiles when no override is provided.
     * This is the full height, not a half-height/radius.
     // policy step inside initialize metadata.
     * @type {number}
     */
    this.DefaultEnemyHitboxHeight = parseFloat(this.parsedPluginParameters['defaultEnemyHitboxHeight']) || 0.50;

    // policy step inside initialize metadata.
    /**
     * Whether or not all eligible battler hitbox outlines should always be visible.
     * When enabled, reveal range requirements are ignored completely.
     * @type {boolean}
     */
    this.EnemyHitboxOutlineAlwaysActive = this.parsedPluginParameters['outlineAlwaysActive'] === 'true';

    // parse the configured reveal range once so we can distinguish missing from explicit zero.
    const configuredRevealRange = parseFloat(this.parsedPluginParameters['defaultHitboxRevealRange']);

    // policy step inside initialize metadata.
    /**
     * The default range in tiles for revealing enemy hitbox outlines.
     * A value of 0 disables proximity-based outlines unless always-active mode is enabled.
     * @type {number}
     */
    this.DefaultEnemyHitboxRevealRange = Number.isNaN(configuredRevealRange)
      ? 6.00
      : configuredRevealRange;
  }
}

export default JAbsPixelistics_PluginMetadata;
//endregion plugin metadata