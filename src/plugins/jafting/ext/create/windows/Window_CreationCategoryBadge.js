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
  #category = null;

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
    this.#category = category;
    this.refresh();
  }

  /**
   * Clears the badge contents (used when leaving recipe browsing).
   */
  clearCategory()
  {
    this.#category = null;
    this.refresh();
  }

  /**
   * Implements {@link Window_Base.drawContent}.
   */
  drawContent()
  {
    if (this.#category === null)
    {
      return;
    }

    // policy step inside draw content.
    this.resetFontSettings();

    // policy step inside draw content.
    const { iconIndex, name } = this.#category;
    const lh = this.lineHeight();
    const iy = Math.floor((this.innerHeight - lh) / 2);
    const iconSlot = ImageManager.standardIconWidth + 8;

    // policy step inside draw content.
    this.drawIcon(iconIndex, 8, iy);
    this.drawText(name, iconSlot, iy, Math.max(48, this.innerWidth - iconSlot - 8), Window_Base.TextAlignments.Left);
  }
}
export default Window_CreationCategoryBadge;

//endregion Window_CreationCategoryBadge