//region Window_JabsRemapHelp
/**
 * Help/instructions window for remapping.
 */
class Window_JabsRemapHelp
  extends Window_Help
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
   * Refreshes the help text.
   */
  refresh()
  {
    // clear the contents.
    this.contents.clear();

    // Line 1: how to rebind and clear using PS terms.
    const l1 = "OK/A-button/Z-key: Rebind Prompt   |   R1/W-key/E-key: Clear Binding";

    // Line 2: how to apply/reset using PS terms (Options/Triangle).
    const l2 = "Select: Apply   |   Triangle/Y-button/C-key: Reset";

    // Line 3: combat guidance for PS controller.
    const l3 = "For combat skills, hold the skill-trigger + (mainhand/offhand/tool/dash).";

    // draw the three lines.
    this.drawText(l1, 0, 0, this.contentsWidth());
    this.drawText(l2, 0, this.lineHeight(), this.contentsWidth());
    this.drawText(l3, 0, this.lineHeight() * 3, this.contentsWidth());
  }

  lineHeight()
  {
    return super.lineHeight() * 0.66;
  }
}

//endregion Window_JabsRemapHelp