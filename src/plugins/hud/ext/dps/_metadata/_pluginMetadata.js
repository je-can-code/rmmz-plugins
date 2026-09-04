//region plugin metadata
/**
 * Plugin metadata for J-HUD-Dps.
 *
 * Exposes the anchor, size and opacity of the damage readout, plus the switch that puts it on
 * screen at all. It is an instrument rather than part of the game's presentation, so it defaults to
 * off and stays that way until somebody is actually measuring something.
 */
class JDpsHud_PluginMetadata
  extends PluginMetadata
{
  /**
   * Constructor.
   * @param {string} name The plugin name.
   * @param {string} version The plugin version string.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  /**
   * Extends {@link #postInitialize}.<br/>
   * Reads the window's placement and visibility from plugin parameters.
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
   *
   * Parameter-driven fields are declared here rather than as class fields, so that values coming
   * out of the RMMZ plugin manager actually apply after load.
   */
  initializeMetadata()
  {
    /**
     * Whether or not the damage readout is drawn at all.
     * @type {boolean}
     */
    this.enabled = this.parsedPluginParameters['enabled'] === 'true';

    /**
     * The x coordinate of the readout's top-left corner on screen.
     * @type {number}
     */
    this.windowX = Number(this.parsedPluginParameters['windowX'] ?? 0);

    /**
     * The y coordinate of the readout's top-left corner on screen.
     * @type {number}
     */
    this.windowY = Number(this.parsedPluginParameters['windowY'] ?? 0);

    /**
     * The width of the readout in pixels.
     * @type {number}
     */
    this.windowWidth = Number(this.parsedPluginParameters['windowWidth'] ?? 360);

    /**
     * The height of the readout in pixels.
     *
     * Tall enough for a heading row plus every battle member; raise it if rows clip.
     * @type {number}
     */
    this.windowHeight = Number(this.parsedPluginParameters['windowHeight'] ?? 160);

    /**
     * Opacity of the windowskin frame and backdrop (0-255); the numbers are not faded.
     * @type {number}
     */
    const rawOpacity = Number(this.parsedPluginParameters['windowOpacity'] ?? 255);
    this.windowOpacity = Math.max(0, Math.min(255, rawOpacity));
  }
}

export default JDpsHud_PluginMetadata;
//endregion plugin metadata