//region Window_SdpFamilyStrip
import SdpFamilyFilter from '../managers/SdpFamilyFilter.js';

/**
 * Thin strip above the SDP panel list showing the active family filter.
 * Updated by {@link Scene_SDP} when the player cycles with L2/R2.
 */
class Window_SdpFamilyStrip
  extends Window_Base
{
  /**
   * Active family-filter key ({@link SdpFamilyFilter.ALL}, {@link SdpFamilyFilter.UNKNOWN}, or a family key).
   * @type {string}
   */
  _filterKey = SdpFamilyFilter.ALL;

  /**
   * @param {Rectangle} rect The dimensions of the window.
   */
  constructor(rect)
  {
    super(rect);
    this.initialize(rect);
  }

  /**
   * Sets the active family filter and redraws.
   * @param {string} filterKey The filter key driving this step.
   */
  setFilterKey(filterKey)
  {
    this._filterKey = filterKey;
    this.refresh();
  }

  /**
   * The family filter currently driving this strip.
   * @returns {string}
   */
  filterKey()
  {
    return this._filterKey;
  }

  /**
   * Implements {@link Window_Base.drawContent}.<br/>
   * Renders the current family filter label and icon.
   */
  drawContent()
  {
    const filterKey = this.filterKey();
    const label = SdpFamilyFilter.displayNameForFilterKey(filterKey);
    const iconIndex = SdpFamilyFilter.iconIndexForFilterKey(filterKey);
    const iconPad = 4;
    const textX = iconIndex >= 0
      ? ImageManager.iconWidth + iconPad
      : 0;

    if (iconIndex >= 0)
    {
      this.drawIcon(iconIndex, iconPad, 0);
    }

    this.resetFontSettings();
    this.drawText(label, textX, 0, this.innerWidth - textX, Window_Base.TextAlignments.Left);
    this.resetFontSettings();
  }
}

export default Window_SdpFamilyStrip;
//endregion Window_SdpFamilyStrip