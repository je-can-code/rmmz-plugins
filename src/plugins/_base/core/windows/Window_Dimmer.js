//region Window_Dimmer
/**
 * Full-box tint painted into {@link Window_Base#contents}. Uses normal {@link WindowLayer} ordering like any window so
 * scenes can insert it above most chrome and below a chosen anchor sibling.
 */
class Window_Dimmer
  extends Window_Base
{
  /**
   * Frameless box covering the menu viewport. Strength is {@link Window#contentsOpacity}, not {@link Window#opacity}.
   *
   * @param {Rectangle} rect Usually {@link Graphics.boxWidth} by {@link Graphics.boxHeight} at the origin.
   */
  initialize(rect)
  {
    super.initialize(rect);
    this.frameVisible = false;
    this.deactivate();
    this.refresh();
  }

  /**
   * Locks padding at zero so the tint reaches the inner edges.
   */
  updatePadding()
  {
    this.padding = 0;
  }

  /**
   * Skips skin tone shifts so only {@link Window#contentsOpacity} drives how cold the overlay reads.
   */
  updateTone()
  {
  }

  /**
   * Hides the plated backdrop so the painted contents alone carry the dim.
   */
  updateBackOpacity()
  {
    this.backOpacity = 0;
  }

  /**
   * Solid black pixels in contents; {@link Window#contentsOpacity} scales the composite.
   */
  refresh()
  {
    this.contents.clear();
    this.contents.fillRect(0, 0, this.contentsWidth(), this.contentsHeight(), '#000000');
  }
}

export default Window_Dimmer;
//endregion Window_Dimmer