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
     * The x coordinate of the background gauge image.
     * @type {number}
     */
    this.BackgroundGaugeImageX = Number(this.parsedPluginParameters['backgroundGaugeImageX']);

    /**
     * The y coordinate of the background gauge image.
     * @type {number}
     */
    this.BackgroundGaugeImageY = Number(this.parsedPluginParameters['backgroundGaugeImageY']);

    /**
     * The x coordinate of the middleground gauge image.
     * @type {number}
     */
    this.MiddlegroundGaugeImageX = Number(this.parsedPluginParameters['middlegroundGaugeImageX']);

    /**
     * The y coordinate of the middleground gauge image.
     * @type {number}
     */
    this.MiddlegroundGaugeImageY = Number(this.parsedPluginParameters['middlegroundGaugeImageY']);

    /**
     * The x coordinate of the foreground gauge image.
     * @type {number}
     */
    this.ForegroundGaugeImageX = Number(this.parsedPluginParameters['foregroundGaugeImageX']);

    /**
     * The y coordinate of the foreground gauge image.
     * @type {number}
     */
    this.ForegroundGaugeImageY = Number(this.parsedPluginParameters['foregroundGaugeImageY']);

    /**
     * The filename of the background gauge image.
     * @type {string}
     */
    this.BackgroundFilename = this.parsedPluginParameters['backgroundImageFilename'];

    /**
     * The filename of the foreground gauge image.
     * @type {string}
     */
    this.ForegroundFilename = this.parsedPluginParameters['foregroundImageFilename'];

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
     * The x scale of the hp gauge sprite.
     * @type {number}
     */
    this.HpGaugeScaleX = Number(this.parsedPluginParameters['hpGaugeScaleX']);

    /**
     * The y scale of the hp gauge sprite.
     * @type {number}
     */
    this.HpGaugeScaleY = Number(this.parsedPluginParameters['hpGaugeScaleY']);

    /**
     * The rotation of the hp gauge sprite in degrees.
     * @type {number}
     */
    this.HpGaugeRotation = Number(this.parsedPluginParameters['hpGaugeRotation']);

    /**
     * The x scale of the mp gauge sprite.
     * @type {number}
     */
    this.MpGaugeScaleX = Number(this.parsedPluginParameters['mpGaugeScaleX']);

    /**
     * The y scale of the mp gauge sprite.
     * @type {number}
     */
    this.MpGaugeScaleY = Number(this.parsedPluginParameters['mpGaugeScaleY']);

    /**
     * The rotation of the mp gauge sprite in degrees.
     * @type {number}
     */
    this.MpGaugeRotation = Number(this.parsedPluginParameters['mpGaugeRotation']);

    /**
     * The x scale of the tp gauge sprite.
     * @type {number}
     */
    this.TpGaugeScaleX = Number(this.parsedPluginParameters['tpGaugeScaleX']);

    /**
     * The y scale of the tp gauge sprite.
     * @type {number}
     */
    this.TpGaugeScaleY = Number(this.parsedPluginParameters['tpGaugeScaleY']);

    /**
     * The rotation of the tp gauge sprite in degrees.
     * @type {number}
     */
    this.TpGaugeRotation = Number(this.parsedPluginParameters['tpGaugeRotation']);
  }
}

export default JHudTarget_PluginMetadata;
//endregion plugin metadata