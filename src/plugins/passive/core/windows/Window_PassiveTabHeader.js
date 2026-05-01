//region Window_PassiveTabHeader
/**
 * A non-interactive header strip that displays the currently active passive viewer tab.
 * The ◀ and ▶ glyphs hint at left/right navigation without consuming any input.
 */
class Window_PassiveTabHeader
  extends Window_Base
{
  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle for this window.
   */
  constructor(rect)
  {
    // call super when having extended constructors.
    super(rect);

    // jumpstart initialization on creation.
    this.initialize(rect);
  }

  //region init
  /**
   * Initializes this window.
   * @param {Rectangle} rect The rectangle for this window.
   */
  initialize(rect)
  {
    // perform original logic.
    super.initialize(rect);

    // initialize the label to the default.
    this._label = 'All';

    // paint the initial state.
    this.refresh();
  }
  //endregion init

  //region update
  /**
   * Sets the tab label displayed in this header and redraws immediately.
   * @param {string} label The display label for the current tab.
   */
  setLabel(label)
  {
    // update the tracked label.
    this._label = label;

    // repaint with the new label.
    this.refresh();
  }
  //endregion update

  //region draw
  /**
   * Redraws the tab header with the current label and navigation glyphs.
   */
  refresh()
  {
    // clear prior contents.
    this.contents.clear();

    // draw the label centered with arrow hints on each side.
    const text = `◀  ${this._label}  ▶`;
    this.drawText(text, 0, 0, this.innerWidth, 'center');
  }
  //endregion draw
}
//endregion Window_PassiveTabHeader