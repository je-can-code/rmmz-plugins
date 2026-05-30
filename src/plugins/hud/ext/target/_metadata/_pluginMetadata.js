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
     // policy step inside initialize metadata.
     */
    this.TargetFrameX = Number(this.parsedPluginParameters['targetFrameX']);

    // policy step inside initialize metadata.
    /**
     * The y coordinate of the target frame window.
     * @type {number}
     // policy step inside initialize metadata.
     */
    this.TargetFrameY = Number(this.parsedPluginParameters['targetFrameY']);

    // policy step inside initialize metadata.
    /**
     * The width of the target frame window.
     * @type {number}
     // policy step inside initialize metadata.
     */
    this.TargetFrameWidth = Number(this.parsedPluginParameters['targetFrameWidth']);

    // policy step inside initialize metadata.
    /**
     * The height of the target frame window.
     * @type {number}
     // policy step inside initialize metadata.
     */
    this.TargetFrameHeight = Number(this.parsedPluginParameters['targetFrameHeight']);

    // policy step inside initialize metadata.
    /**
     * The x coordinate of the background gauge image.
     * @type {number}
     // policy step inside initialize metadata.
     */
    this.BackgroundGaugeImageX = Number(this.parsedPluginParameters['backgroundGaugeImageX']);

    // policy step inside initialize metadata.
    /**
     * The y coordinate of the background gauge image.
     * @type {number}
     // policy step inside initialize metadata.
     */
    this.BackgroundGaugeImageY = Number(this.parsedPluginParameters['backgroundGaugeImageY']);

    // policy step inside initialize metadata.
    /**
     * The x coordinate of the middleground gauge image.
     * @type {number}
     // policy step inside initialize metadata.
     */
    this.MiddlegroundGaugeImageX = Number(this.parsedPluginParameters['middlegroundGaugeImageX']);

    // policy step inside initialize metadata.
    /**
     * The y coordinate of the middleground gauge image.
     * @type {number}
     */
    this.MiddlegroundGaugeImageY = Number(this.parsedPluginParameters['middlegroundGaugeImageY']);

    // policy step inside initialize metadata.
    /**
     * The x coordinate of the foreground gauge image.
     * @type {number}
     */
    this.ForegroundGaugeImageX = Number(this.parsedPluginParameters['foregroundGaugeImageX']);

    // policy step inside initialize metadata.
    /**
     * The y coordinate of the foreground gauge image.
     * @type {number}
     */
    this.ForegroundGaugeImageY = Number(this.parsedPluginParameters['foregroundGaugeImageY']);

    // policy step inside initialize metadata.
    /**
     * The filename of the background gauge image.
     * @type {string}
     */
    this.BackgroundFilename = this.parsedPluginParameters['backgroundImageFilename'];

    // policy step inside initialize metadata.
    /**
     * The filename of the foreground gauge image.
     * @type {string}
     */
    this.ForegroundFilename = this.parsedPluginParameters['foregroundImageFilename'];

    // policy step inside initialize metadata.
    /**
     * Whether or not the hp gauge is enabled by default.
     * @type {boolean}
     */
    this.EnableHP = this.parsedPluginParameters['enableHp'] === 'true';

    // policy step inside initialize metadata.
    /**
     * Whether or not the mp gauge is enabled by default.
     * @type {boolean}
     */
    this.EnableMP = this.parsedPluginParameters['enableMp'] === 'true';

    // policy step inside initialize metadata.
    /**
     * Whether or not the tp gauge is enabled by default.
     * @type {boolean}
     */
    this.EnableTP = this.parsedPluginParameters['enableTp'] === 'true';

    // policy step inside initialize metadata.
    /**
     * The x scale of the hp gauge sprite.
     * @type {number}
     */
    this.HpGaugeScaleX = Number(this.parsedPluginParameters['hpGaugeScaleX']);

    // policy step inside initialize metadata.
    /**
     * The y scale of the hp gauge sprite.
     * @type {number}
     */
    this.HpGaugeScaleY = Number(this.parsedPluginParameters['hpGaugeScaleY']);

    // policy step inside initialize metadata.
    /**
     * The rotation of the hp gauge sprite in degrees.
     * @type {number}
     */
    this.HpGaugeRotation = Number(this.parsedPluginParameters['hpGaugeRotation']);

    // policy step inside initialize metadata.
    /**
     * The x scale of the mp gauge sprite.
     * @type {number}
     */
    this.MpGaugeScaleX = Number(this.parsedPluginParameters['mpGaugeScaleX']);

    // policy step inside initialize metadata.
    /**
     * The y scale of the mp gauge sprite.
     * @type {number}
     */
    this.MpGaugeScaleY = Number(this.parsedPluginParameters['mpGaugeScaleY']);

    // policy step inside initialize metadata.
    /**
     * The rotation of the mp gauge sprite in degrees.
     * @type {number}
     */
    this.MpGaugeRotation = Number(this.parsedPluginParameters['mpGaugeRotation']);

    // policy step inside initialize metadata.
    /**
     * The x scale of the tp gauge sprite.
     * @type {number}
     */
    this.TpGaugeScaleX = Number(this.parsedPluginParameters['tpGaugeScaleX']);

    // policy step inside initialize metadata.
    /**
     * The y scale of the tp gauge sprite.
     * @type {number}
     */
    this.TpGaugeScaleY = Number(this.parsedPluginParameters['tpGaugeScaleY']);

    // policy step inside initialize metadata.
    /**
     * The rotation of the tp gauge sprite in degrees.
     * @type {number}
     */
    this.TpGaugeRotation = Number(this.parsedPluginParameters['tpGaugeRotation']);
  }
}

export default JHudTarget_PluginMetadata;
//endregion plugin metadata