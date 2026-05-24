//region Window_SdpControlsHint
/**
 * A single-line controller hint for the SDP scene.
 * This must not live in {@link Window_SdpHelp} because that help window is
 * reserved for 2 lines of panel description.
 */
class Window_SdpControlsHint
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
   * Draws the controller-first legend for cart + checkout + filters.
   */
  drawControllerHint()
  {
    // pull away from the chrome edges slightly so it reads like helper chrome.
    const padX = 12;

    // shrink so it fits comfortably without stealing vertical pixels from the panel lists.
    this.resetFontSettings();
    this.modFontSize(-4);

    // avoid palette picks that can disappear on darker skins; still lighter than body copy via size alone.
    this.changeTextColor(ColorManager.normalColor());

    const text = 'L/R: -/+ cart  OK: checkout/upgrade  More: filter';

    const y = Math.max(0, Math.floor((this.innerHeight - this.lineHeight()) / 2));
    this.drawText(text, padX, y, this.innerWidth - padX * 2, 'left');
    this.resetFontSettings();
  }
}

export default Window_SdpControlsHint;
//endregion Window_SdpControlsHint