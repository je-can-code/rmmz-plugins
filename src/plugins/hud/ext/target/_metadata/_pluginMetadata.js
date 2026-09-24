//region plugin metadata
class JHudTarget_PluginMetadata extends PluginMetadata
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
     * The x coordinate of the target frame window.
     * @type {number}
     */
    this.TargetFrameX = Number(this.parsedPluginParameters['targetFrameX']);

    /**
     * The y coordinate of the target frame window.
     * @type {number}
     */
    this.TargetFrameY = Number(this.parsedPluginParameters['targetFrameY']);

    /**
     * The width of the target frame window.
     * @type {number}
     */
    this.TargetFrameWidth = Number(this.parsedPluginParameters['targetFrameWidth']);

    /**
     * The height of the target frame window.
     * @type {number}
     */
    this.TargetFrameHeight = Number(this.parsedPluginParameters['targetFrameHeight']);

    /**
     * Whether or not the hp gauge is enabled by default.
     * @type {boolean}
     */
    this.EnableHP = this.parsedPluginParameters['enableHp'] === 'true';

    /**
     * Whether or not the mp gauge is enabled by default.
     * @type {boolean}
     */
    this.EnableMP = this.parsedPluginParameters['enableMp'] === 'true';

    /**
     * Whether or not the tp gauge is enabled by default.
     * @type {boolean}
     */
    this.EnableTP = this.parsedPluginParameters['enableTp'] === 'true';

    /**
     * The rotation of the tp gauge sprite in degrees.
     * @type {number}
     */
    this.TpGaugeRotation = Number(this.parsedPluginParameters['tpGaugeRotation']);
  }
}

export default JHudTarget_PluginMetadata;
//endregion plugin metadata