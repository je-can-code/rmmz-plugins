//region Window_StatusPageHint
/**
 * A tiny, non-interactive window that informs the player they can use L2/R2
 * to switch the right-hand view in the Status scene.
 */
class Window_StatusPageHint
  extends Window_Base
{
  /**
   * @param {Rectangle} rect The rectangle for this window.
   */
  constructor(rect)
  {
    // build base window.
    super(rect);

    // draw static content.
    this.refresh();
  }

  //endregion init

  //region drawing
  /**
   * Redraws the hint text centered within the window.
   */
  refresh()
  {
    // clear any existing content.
    this.contents.clear();

    // compute drawing rect.
    const { innerWidth } = this;
    const x = 0;
    const y = 0;

    // pull text to draw.
    const text = 'L2/R2: Switch View · L1/R1: Party';

    // use the system color to denote hint/instruction.
    this.changeTextColor(ColorManager.systemColor());

    // center the hint within the window.
    this.drawText(text, x, y, innerWidth, 'center');

    // reset text color to default.
    this.resetTextColor();
  }

  //endregion drawing
}

export default Window_StatusPageHint;
//endregion Window_StatusPageHint