//region plugin metadata
class J_MAP__PluginMetadata extends PluginMetadata
{
  /**
   * Constructor.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  /**
   * Extends {@link #postInitialize}.<br/>
   * Maps plugin parameters into instance fields used by the minimap.
   */
  postInitialize()
  {
    super.postInitialize();
    this.initializeMetadata();
  }

  initializeMetadata()
  {
    // Pull parsed plugin parameters from base class.
    const pp = this.parsedPluginParameters ?? {};

    // policy step inside initialize metadata.
    /**
     * The minimap's X position in pixels; -1 = auto bottom-right.
     * @type {number}
     */
    this.minimapX = parseInt(pp['minimapX'] ?? -1);

    // policy step inside initialize metadata.
    /**
     * The minimap's Y position in pixels; -1 = auto bottom-right.
     * @type {number}
     */
    this.minimapY = parseInt(pp['minimapY'] ?? -1);

    // policy step inside initialize metadata.
    /**
     * Start visibility for the minimap on load/new game.
     * @type {boolean}
     */
    this.startVisible = (pp['startVisible'] ?? 'true') === 'true';

    // policy step inside initialize metadata.
    /**
     * If true, the minimap hides when the HUD is hidden via input.
     * @type {boolean}
     */
    this.respectHudHide = (pp['respectHudHide'] ?? 'true') === 'true';

    // policy step inside initialize metadata.
    /**
     * The alpha to use when overlapping other HUD windows (0.0-1.0).
     * @type {number}
     */
    const overlapPct = parseInt(pp['overlapOpacityPercent'] ?? 40);
    this.overlapOpacity = Math.max(0, Math.min(1, overlapPct / 100));
  }
}

export default J_MAP__PluginMetadata;
//endregion plugin metadata