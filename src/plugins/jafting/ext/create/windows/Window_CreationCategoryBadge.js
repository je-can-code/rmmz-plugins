//region Window_CreationCategoryBadge
/**
 * Recipe-browsing chrome: shows the active crafting category icon + name beside the help window.
 */
class Window_CreationCategoryBadge
  extends Window_Base
{
  /**
   * @type {CraftingCategory|null}
   */
  _category = null;

  /**
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  constructor(rect)
  {
    super(rect);
  }

  /**
   * @param {CraftingCategory|null} category The category to render, or null to clear.
   */
  setCategory(category)
  {
    this._category = category;
    this.refresh();
  }

  /**
   * Clears the badge contents (used when leaving recipe browsing).
   */
  clearCategory()
  {
    this._category = null;
    this.refresh();
  }

  /**
   * The category this badge is currently rendering, or null when cleared.
   * @returns {CraftingCategory|null}
   */
  category()
  {
    return this._category;
  }

  /**
   * Implements {@link Window_Base.drawContent}.
   */
  drawContent()
  {
    const category = this.category();
    if (category === null)
    {
      return;
    }

    this.resetFontSettings();

    const { iconIndex, name } = category;
    const lh = this.lineHeight();
    const iy = Math.floor((this.innerHeight - lh) / 2);
    const iconSlot = ImageManager.standardIconWidth + 8;

    this.drawIcon(iconIndex, 8, iy);
    this.drawText(name, iconSlot, iy, Math.max(48, this.innerWidth - iconSlot - 8), Window_Base.TextAlignments.Left);
  }
}
export default Window_CreationCategoryBadge;

//endregion Window_CreationCategoryBadge