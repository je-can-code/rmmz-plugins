//region Window_JabsRemapUsageHelp
/**
 * Static usage/help panel for the JABS remap scene (right side).
 */
class Window_JabsRemapUsageHelp
  extends Window_Base
{
  /**
   * @param {Rectangle} rect The rectangle to draw this window within.
   */
  constructor(rect)
  {
    // perform super initialize.
    super(rect);

    // refresh immediately.
    this.refresh();
  }

  /**
   * Refreshes the static help text.
   */
  refresh()
  {
    // clear the contents.
    this.contents.clear();

    // build the ex-text with icons for each hint line.
    const rebind = `${IconManager.jabsIconTextForSymbol('ok')} Rebind`;
    const clear = `${IconManager.jabsIconTextForSymbol(J.ABS.EXT.INPUT.Symbols.GuardTrigger)} Clear Binding`;

    // draw each line using drawTextEx so icons render.
    this.drawTextEx(rebind, 0, this.lineHeight() * 0, this.contentsWidth());
    this.drawTextEx(clear, 0, this.lineHeight() * 1, this.contentsWidth());
  }
}

export default Window_JabsRemapUsageHelp;
//endregion Window_JabsRemapUsageHelp