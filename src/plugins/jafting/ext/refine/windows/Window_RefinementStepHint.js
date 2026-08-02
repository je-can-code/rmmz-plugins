//region Window_RefinementStepHint
/**
 * Short workflow copy above the refinable lists so the base vs material steps read clearly.
 */
class Window_RefinementStepHint
  extends Window_Base
{
  /**
   * @param {Rectangle} rect The rectangle for this window.
   */
  constructor(rect)
  {
    super(rect);
    this._text = String.empty;
  }

  /**
   * @param {string} text Plain instruction line (no control codes; keeps to one row).
   */
  setText(text)
  {
    if (this._text === text)
    {
      return;
    }

    // store  text on the instance for later reads.
    this._text = text;
    this.refresh();
  }

  /**
   * @returns {string}
   */
  getText()
  {
    return this._text;
  }

  /**
   * Single-line instruction across the full width; truncates if it cannot fit.
   */
  refresh()
  {
    this.contents.clear();

    const x = 0;
    const y = 0;
    const { innerWidth } = this;

    this.changeTextColor(ColorManager.systemColor());
    this.drawText(this.getText(), x, y, innerWidth, 'left');
    this.resetTextColor();
  }
}

export default Window_RefinementStepHint;

//endregion Window_RefinementStepHint