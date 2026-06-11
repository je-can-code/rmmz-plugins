//region plugin metadata
/**
 * Plugin metadata for J-HUD-FOOD.
 * Exposes the x/y anchor coordinates of the food chain window so Jeremy can
 * reposition it without touching source code. Height follows the strip layout;
 * width and height are configurable. Height only changes how many chain state
 * labels fit; the icon and duration bar keep their fixed size.
 */
class JFoodHud_PluginMetadata
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
   * Extends {@link #postInitialize}.<br>
   * Reads the window anchor coordinates from plugin parameters.
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
   * Parameter-driven fields are declared here only — not as class fields —
   * so RMMZ plugin manager values actually apply after load.
   */
  initializeMetadata()
  {
    /**
     * The x coordinate of the food frame window's top-left corner on screen.
     * @type {number}
     */
    this.windowX = Number(this.parsedPluginParameters['windowX'] ?? 0);

    /**
     * The y coordinate of the food frame window's top-left corner on screen.
     * @type {number}
     */
    this.windowY = Number(this.parsedPluginParameters['windowY'] ?? 70);

    /**
     * The width of the food frame window in pixels.
     * @type {number}
     */
    this.windowWidth = Number(this.parsedPluginParameters['windowWidth'] ?? 200);

    /**
     * The total height of the food frame window in pixels.
     * Only the chain-state label region grows or shrinks with this value.
     * @type {number}
     */
    this.windowHeight = Number(this.parsedPluginParameters['windowHeight'] ?? 478);

    /**
     * Opacity of the windowskin frame and backdrop (0–255); contents are not faded.
     * @type {number}
     */
    const rawOpacity = Number(this.parsedPluginParameters['windowOpacity'] ?? 255);
    this.windowOpacity = Math.max(0, Math.min(255, rawOpacity));
  }
}

export default JFoodHud_PluginMetadata;
//endregion plugin metadata