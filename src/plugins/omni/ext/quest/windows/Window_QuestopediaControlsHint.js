//region Window_QuestopediaControlsHint
/**
 * A single-line controller hint for the Questopedia scene.
 */
class Window_QuestopediaControlsHint
  extends Window_Base
{
  /**
   * @param {Rectangle} rect The dimensions of the window.
   */
  constructor(rect)
  {
    super(rect);
    this.initialize(rect);
  }

  /**
   * Re-renders the static controller hint.
   */
  refresh()
  {
    this.contents.clear();
    this.drawControllerHint();
  }

  /**
   * Draws the controller-first legend for quest category cycling.
   */
  drawControllerHint()
  {
    const padX = 12;

    this.resetFontSettings();
    this.modFontSize(-4);
    this.changeTextColor(ColorManager.normalColor());

    const text = 'L2/R2: category';

    const y = Math.max(0, Math.floor((this.innerHeight - this.lineHeight()) / 2));
    this.drawText(text, padX, y, this.innerWidth - padX * 2, 'left');
    this.resetFontSettings();
  }
}

export default Window_QuestopediaControlsHint;
//endregion Window_QuestopediaControlsHint
