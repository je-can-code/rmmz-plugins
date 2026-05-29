//region Window_SdpCart
import StatDistributionPanel from './../__models/StatDistributionPanel.js';
/**
 * A controller-first "shopping cart" window for queued SDP rankups.
 * This window is display-only; selection happens in {@link Window_SdpList}.
 */
class Window_SdpCart
  extends Window_Command
{
  /**
   * The actor whose wallet + rankings apply.
   * @type {Game_Actor|null}
   */
  actor = null;

  /**
   * The queued cart levels by panel key.
   * @type {Map<string, number>}
   */
  cart = new Map();

  /**
   * The cached wallet value for the pinned row.
   * @type {number}
   */
  wallet = 0;

  /**
   * The cached total cost for the pinned row.
   * @type {number}
   */
  totalCost = 0;

  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  constructor(rect)
  {
    super(rect);
  }

  /**
   * Binds the cart context to this window.
   * @param {Game_Actor} actor The actor whose SDP points will be spent.
   * @param {Map<string, number>} cart The queued levels by panel key.
   */
  setCart(actor, cart)
  {
    this.actor = actor;
    this.cart = cart;
  }

  /**
   * Overwrites {@link #isCurrentItemEnabled}.<br/>
   * No commands are selectable in this window.
   */
  isCurrentItemEnabled()
  {
    return false;
  }

  /**
   * Implements {@link #makeCommandList}.<br/>
   * Draws the contents of the cart and the total cost.
   */
  makeCommandList()
  {
    const { actor } = this;
    if (!actor)
    {
      return;
    }

    // if the cart is empty, say so.
    if (this.cart.size === 0)
    {
      const empty = new WindowCommandBuilder('Cart: empty')
        .setSymbol('cart-empty')
        .setEnabled(false)
        .setColorIndex(8)
        .build();
      this.addBuiltCommand(empty);
      return;
    }

    // compute total cost first so it stays pinned at the top.
    let totalCost = 0;
    this.cart.forEach((levels, key) =>
    {
      const panel = J.SDP.Metadata.panelsMap.get(key);
      if (!panel)
      {
        return;
      }

      const { currentRank } = actor.getSdpByKey(key);
      const cost = Window_SdpCart.#calculateQueuedCost(panel, currentRank, levels);
      totalCost += cost;

    });

    // wallet row (the anchor row) pinned at the top.
    const wallet = actor.getSdpPoints();
    this.wallet = wallet;
    this.totalCost = totalCost;

    // wallet row: we custom-render the styled numbers, so keep the command text simple.
    const walletRow = new WindowCommandBuilder(J.SDP.Metadata.sdpPointsDisplayName)
      .setSymbol('cart-wallet')
      .setEnabled(false)
      .setIconIndex(J.SDP.Metadata.sdpIconIndex)
      .build();
    this.addBuiltCommand(walletRow);

    // now build the cart line items.
    this.cart.forEach((levels, key) =>
    {
      const panel = J.SDP.Metadata.panelsMap.get(key);
      if (!panel)
      {
        return;
      }

      const { currentRank } = actor.getSdpByKey(key);
      const cost = Window_SdpCart.#calculateQueuedCost(panel, currentRank, levels);

      const command = new WindowCommandBuilder(panel.name)
        .setSymbol(`cart-${key}`)
        .setEnabled(false)
        .setIconIndex(panel.iconIndex)
        .setExtensionData({
          levels,
          cost,
        })
        .build();

      this.addBuiltCommand(command);
    });
  }

  /**
   * Overwrites {@link #drawItem}.<br/>
   * Renders the cart rows with styled padded numbers.
   * @param {number} index The command index.
   */
  drawItem(index)
  {
    // handles the setup that occurs before each item drawn.
    this.preDrawItem(index);

    // grab the rectangle for the line item.
    const {
      x: rectX,
      y: rectY,
      width: rectWidth
    } = this.itemLineRect(index);

    // identify the icon for this command.
    const commandIcon = this.commandIcon(index);
    if (commandIcon)
    {
      this.drawIcon(commandIcon, rectX + 4, rectY);
    }

    // render the command name.
    const commandNameX = rectX + 40;
    this.drawTextEx(this.buildCommandName(index), commandNameX, rectY, rectWidth);

    const symbol = this.commandSymbol(index);
    if (symbol === 'cart-wallet')
    {
      this.drawCartWalletRow(rectX, rectY, rectWidth);
    }
    else if (symbol.startsWith('cart-'))
    {
      this.drawCartLineItemRow(index, rectX, rectY, rectWidth);
    }
  }

  /**
   * Draws the pinned wallet row with styled numbers.
   * @param {number} x The row x.
   * @param {number} y The row y.
   * @param {number} width The row width.
   */
  drawCartWalletRow(x, y, width)
  {
    const pad = 12;
    const gap = 12;

    const spendW = this.textWidth('(-00000000)');
    const amountW = this.textWidth('00000000');
    const spendX = x + width - spendW - pad;
    const amountX = spendX - gap - amountW;

    // wallet amount (always normal coloring; zeros dim).
    this.drawStyledZeroPaddedNumber(amountX, y, this.wallet, amountW, 8, 8, 0);

    // spend indicator (green when affordable, red when short).
    const canAfford = this.totalCost <= this.wallet;
    let spendColor = 0;
    if (this.totalCost > 0)
    {
      spendColor = canAfford
        ? 24
        : 18;
    }

    this.drawStyledZeroPaddedCost(spendX, y, this.totalCost, spendW, 8, 8, spendColor);
  }

  /**
   * Draws a cart line item row with `+NN | 00000000` formatting.
   * @param {number} index The command index.
   * @param {number} x The row x.
   * @param {number} y The row y.
   * @param {number} width The row width.
   */
  drawCartLineItemRow(index, x, y, width)
  {
    const command = this.commandEntryAt(index);
    const ext = command
      ? command.ext
      : null;
    if (!ext)
    {
      return;
    }

    const { levels, cost } = ext;
    const pad = 12;
    const gap = 8;

    // right-most cost.
    const costW = this.textWidth('00000000');
    const costX = x + width - costW - pad;
    this.drawStyledZeroPaddedNumber(costX, y, cost, costW, 8, 8, 0);

    // prefix: +NN |
    const prefix = '+';
    const pipe = ' |';
    const pipeW = this.textWidth(pipe);
    const plusW = this.textWidth(prefix);
    const levelsW = this.textWidth('00');

    const pipeX = costX - gap - pipeW;
    const levelsX = pipeX - levelsW;
    const plusX = levelsX - plusW;

    this.drawText(prefix, plusX, y, plusW, Window_Base.TextAlignments.Left);
    this.drawStyledZeroPaddedNumber(levelsX, y, levels, levelsW, 2, 8, 0);
    this.drawText(pipe, pipeX, y, pipeW, Window_Base.TextAlignments.Left);
  }

  /**
   * Calculates the total cost of a queued number of rankups for a panel.
   * @param {StatDistributionPanel} panel The panel being purchased.
   * @param {number} currentRank The current rank of the panel.
   * @param {number} levels The queued levels.
   * @returns {number}
   */
  static #calculateQueuedCost(panel, currentRank, levels)
  {
    let cost = 0;
    for (let i = 0; i < levels; i++)
    {
      cost += panel.rankUpCost(currentRank + i);
    }
    return cost;
  }
}
export default Window_SdpCart;
//endregion Window_SdpCart