//region Window_SdpConfirmation
/**
 * The window that prompts the user to confirm/cancel the upgrading of a chosen panel.
 * Long panel names must not become {@link Window_Command} labels: {@link Window_Command#drawItem}
 * feeds names through {@link Window_Base#drawTextEx}, which wraps and stacks multiple lines inside
 * a single-row {@link Window_Selectable#itemRect}, producing overlapping unreadable text.
 */
class Window_SdpConfirmation
  extends Window_Command
{
  /**
   * @constructor
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  constructor(rect)
  {
    super(rect);
    this.initialize(rect);
    this.initMembers();

    // assign opacity on this instance for callers.
    this.opacity = 255;
    this.contentsBack.opacity = 255;
    this.contents.opacity = 255;
  }

  updateBackOpacity()
  {
    this.backOpacity = 255;
  }

  /**
   * Initializes all members of this window.
   */
  initMembers()
  {
    /**
     * The current mode of this confirmation window.
     * - single: upgrade hovered panel once.
     * - cart: checkout the queued cart.
     * @type {string}
     */
    // assign mode on this instance for callers.
    this.mode = 'single';

    /**
     * The summary of the current cart checkout, if applicable.
     * @type {{
     *   panelCount: number,
     *   levelCount: number,
     *   totalCost: number,
     *   wallet: number,
     *   remaining: number,
     *   canAfford: boolean,
     *   solePanelName: string|null
     * }|null}
     */
    this.cartSummary = null;

    /**
     * The summary of the current single-panel upgrade, if applicable.
     * @type {{ panelName: string, cost: number, wallet: number, remaining: number, canAfford: boolean }|null}
     */
    this.singleSummary = null;
  }

  /**
   * The amount of columns this command window uses.
   * @returns {number}
   */
  maxCols()
  {
    // horizontal choice row: [Upgrade] [Cancel].
    return 2;
  }

  /**
   * The width of each command cell.
   * @returns {number}
   */
  itemWidth()
  {
    // split the available inner width across two columns.
    const spacing = this.colSpacing();
    return Math.floor((this.innerWidth - spacing) / 2);
  }

  /**
   * Keep the choice row tight; the summary above does the heavy lifting.
   * @returns {number}
   */
  numVisibleRows()
  {
    return 1;
  }

  /**
   * Keep the two choices separated but not wasteful.
   * @returns {number}
   */
  colSpacing()
  {
    return 12;
  }

  /**
   * Sets the mode of this confirmation window.
   * @param {string} mode The mode key.
   */
  setMode(mode)
  {
    this.mode = mode;
  }

  /**
   * Sets the cart summary for this confirmation window.
   * @param {{
   *   panelCount: number,
   *   levelCount: number,
   *   totalCost: number,
   *   wallet: number,
   *   remaining: number,
   *   canAfford: boolean,
   *   solePanelName: string|null
   * }} summary The cart summary.
   */
  setCartSummary(summary)
  {
    this.cartSummary = summary;
  }

  /**
   * Sets the single-upgrade summary for this confirmation window.
   * @param {string} panelName The name of the panel being upgraded.
   * @param {number} cost The cost of the rank-up.
   * @param {number} wallet The actor wallet.
   */
  setSingleSummary(panelName, cost, wallet)
  {
    const remaining = wallet - cost;
    const canAfford = remaining >= 0;
    this.singleSummary = {
      panelName,
      cost,
      wallet,
      remaining,
      canAfford,
    };
  }

  /**
   * Vertical space reserved for the summary block above command rows.
   * Must stay in sync with {@link #drawConfirmationSummary}.
   * @returns {number}
   */
  confirmationSummaryHeight()
  {
    const topPad = this.itemPadding();
    const lh = this.lineHeight();
    const gapBeforeCommands = 8;

    // 4-line summary:
    // - headline (single-panel cart uses panel name + levels; multi-panel cart uses aggregate copy)
    // - wallet line (icon + wallet amount)
    // - (-cost) line
    // - projected remainder line (after horizontal divider).
    return topPad + lh * 4 + gapBeforeCommands;
  }

  /**
   * Shifts command rows below the summary block so list geometry stays coherent.
   * @param {number} index The command index.
   * @returns {Rectangle}
   */
  itemRect(index)
  {
    const rect = Window_Selectable.prototype.itemRect.call(this, index);
    rect.y += this.confirmationSummaryHeight();

    return rect;
  }

  /**
   * Paints summary text first, then command rows (default {@link Window_Selectable#paint} omits summary).
   */
  paint()
  {
    if (!this.contents)
    {
      return;
    }

    this.contents.clear();
    if (this.contentsBack)
    {
      this.contentsBack.clear();
    }

    this.drawConfirmationSummary();
    this.drawAllItems();
  }

  /**
   * Draws the checkout / upgrade context above the OK and Cancel lines.
   */
  drawConfirmationSummary()
  {
    const padX = this.itemPadding();
    const w = this.innerWidth - padX * 2;
    let y = this.itemPadding();

    this.resetFontSettings();

    /**
     * Draws a labeled row with a right-aligned numeric amount.
     * @param {number} iconIndex The icon index, or 0 for none.
     * @param {string} label The left-aligned label.
     * @param {number} amount The right-aligned amount.
     * @param {number} colorIndex The right-text color index.
     */
    const drawLabeledAmountRow = (iconIndex, label, amount, colorIndex = 0) =>
    {
      const hasIcon = iconIndex > 0;
      const iconSpace = hasIcon
        ? 40
        : 0;
      const textX = padX + iconSpace;
      const textW = w - iconSpace;

      if (hasIcon)
      {
        this.drawIcon(iconIndex, padX, y + 2);
      }

      // left label.
      this.drawText(label, textX, y, textW, 'left');

      // right amount (styled zeros + bold significant digits).
      this.drawStyledZeroPaddedNumber(textX, y, amount, textW, 8, 8, colorIndex);

      y += this.lineHeight();
    };

    if (this.mode === 'cart')
    {
      const summary = this.cartSummary;
      if (!summary)
      {
        return;
      }

      // line 1: one panel in the cart reads like single-upgrade copy; multiple panels stay aggregate.
      let lineA;

      if (summary.panelCount === 1 && summary.solePanelName)
      {
        const levelWord = summary.levelCount === 1
          ? 'rank'
          : 'ranks';
        const nameMarked = this.boldenText(summary.solePanelName);

        lineA = `${nameMarked} will be upgraded by ${summary.levelCount} ${levelWord}.`;
      }
      else
      {
        const { unitPlural } = J.SDP.Metadata;
        const upgradeWord = summary.levelCount === 1
          ? 'upgrade'
          : 'upgrades';

        lineA = `${summary.levelCount} ${upgradeWord} on ${summary.panelCount} ${unitPlural}; confirm?`;
      }

      this.drawTextEx(lineA, padX, y, w);
      y += this.lineHeight();

      // line 2: current amount.
      drawLabeledAmountRow(J.SDP.Metadata.sdpIconIndex, 'Current Amount', summary.wallet,);

      // line 3: cost to pay.
      drawLabeledAmountRow(0, 'Cost to pay', summary.totalCost, 18,);

      // line 4: horizontal divider + projected remainder.
      y -= 8;

      // horizontal divider.
      this.drawHorizontalLine(padX, y, w);
      y += 10;

      // remaining row.
      drawLabeledAmountRow(
        0,
        `Remaining ${J.SDP.Metadata.sdpPointsDisplayName}`,
        summary.remaining,);
    }
    else
    {
      const summary = this.singleSummary;
      if (!summary)
      {
        return;
      }

      // line 1: same headline shape as a one-panel cart checkout — single OK path always buys exactly one level.
      const nameMarked = this.boldenText(summary.panelName);
      const lineA = `${nameMarked} will be upgraded by 1 rank.`;

      this.drawTextEx(lineA, padX, y, w);
      y += this.lineHeight();

      // line 2: current amount.
      drawLabeledAmountRow(J.SDP.Metadata.sdpIconIndex, 'Current Amount', summary.wallet,);

      // line 3: cost to pay.
      drawLabeledAmountRow(0, 'Cost to pay', summary.cost, 18,);

      // line 4: horizontal divider + projected remainder.
      y -= 8;

      // horizontal divider.
      this.drawHorizontalLine(padX, y, w);
      y += 10;

      // remaining row.
      drawLabeledAmountRow(
        0,
        `Remaining ${J.SDP.Metadata.sdpPointsDisplayName}`,
        summary.remaining,);
    }

    this.resetFontSettings();
  }

  /**
   * Overwrites {@link #makeCommandList}.<br/>
   * Creates the command list for this window.
   */
  makeCommandList()
  {
    // upgrade/checkout lives on the left; cancel on the right.
    const isCart = this.mode === 'cart';
    const summary = isCart
      ? this.cartSummary
      : this.singleSummary;
    const canAfford = summary
      ? summary.canAfford
      : false;

    // construct upgrade for the next step in this routine.
    const upgrade = new WindowCommandBuilder('Upgrade')
      .setSymbol(isCart
        ? 'panel-cart-ok'
        : 'panel-upgrade-ok')
      .setEnabled(canAfford)
      .setIconIndex(91)
      .build();
    this.addBuiltCommand(upgrade);

    // construct cancel for the next step in this routine.
    const cancel = new WindowCommandBuilder('Cancel')
      .setSymbol('panel-upgrade-cancel')
      .setEnabled(true)
      .setIconIndex(90)
      .build();
    this.addBuiltCommand(cancel);
  }
}

export default Window_SdpConfirmation;
//endregion Window_SdpConfirmation