//region Window_FilterStrip
import FilterCycle from './../models/FilterCycle.js';

/**
 * A thin strip above a filterable list, naming the tab the player is currently on.
 *
 * The strip renders a {@link FilterCycle} position directly rather than resolving a key into a label and an
 * icon on every draw. A position already carries its own name and icon because whatever built the cycle had
 * to know both anyway- so resolving here would be doing the same lookup once per frame that the cycle
 * builder already did once per rebuild.
 */
class Window_FilterStrip
  extends Window_Base
{
  /**
   * The position being named, defaulting to the empty one so the strip can draw before a cycle exists.
   * @type {{key: string, name: string, iconIndex: number}}
   */
  _position = FilterCycle.EMPTY_POSITION;

  /**
   * @param {Rectangle} rect The dimensions of the window.
   */
  constructor(rect)
  {
    super(rect);
    this.initialize(rect);
  }

  /**
   * Sets the position this strip names and redraws.
   * @param {{key: string, name: string, iconIndex: number}} position The position driving this step.
   */
  setPosition(position)
  {
    this._position = position;
    this.refresh();
  }

  /**
   * The position this strip is currently naming.
   * @returns {{key: string, name: string, iconIndex: number}}
   */
  position()
  {
    return this._position;
  }

  /**
   * Implements {@link Window_Base.drawContent}.<br/>
   * Renders the active position's icon and label.
   */
  drawContent()
  {
    const {
      name,
      iconIndex
    } = this.position();
    const iconPad = 4;

    // a position may legitimately have no icon, in which case the label takes the whole strip.
    const hasIcon = iconIndex > 0;
    const textX = hasIcon
      ? ImageManager.iconWidth + iconPad
      : 0;

    if (hasIcon)
    {
      this.drawIcon(iconIndex, iconPad, 0);
    }

    this.resetFontSettings();
    this.drawText(name, textX, 0, this.innerWidth - textX, Window_Base.TextAlignments.Left);
    this.resetFontSettings();
  }
}

export default Window_FilterStrip;
//endregion Window_FilterStrip