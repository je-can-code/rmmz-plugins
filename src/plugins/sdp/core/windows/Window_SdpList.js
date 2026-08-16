//region Window_SdpList
import StatDistributionPanel from '../models/StatDistributionPanel.js';
import SdpFamilyFilter from '../managers/SdpFamilyFilter.js';
/**
 * The SDP window containing the list of all unlocked panels.
 */
class Window_SdpList
  extends Window_FilterableList
{
  /**
   * @constructor
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  constructor(rect)
  {
    // perform original logic, which seeds this window's members before building the list.
    super(rect);
  }

  /**
   * Extends {@link Window_FilterableList.initMembers}.<br/>
   * Adds the actor and cart this list draws against.
   *
   * These cannot be class field declarations: JavaScript applies those only after `super()` returns,
   * by which point the command list has already been built from them and found them undefined.
   */
  initMembers()
  {
    // perform original logic, which seeds the family filter and the actionable-only toggle.
    super.initMembers();

    /**
     * The currently selected actor for listing unlocked panels and drawing ranks/costs.
     * @type {Game_Actor}
     */
    this.currentActor = null;

    /**
     * The queued cart levels by panel key.
     * @type {Map<string, number>}
     */
    this.cart = new Map();
  }

  /**
   * Sets the actor for this window to the provided actor. Implicit refresh.
   * @param {Game_Actor} actor The actor to assign to this window.
   */
  setActor(actor)
  {
    this.currentActor = actor;
    this.refresh();
  }

  /**
   * Sets the cart map to show queued levels in the list.
   * @param {Map<string, number>} cart The cart mapping.
   */
  setCart(cart)
  {
    this.cart = cart;
    this.refresh();
  }

  /**
   * Overwrites {@link #itemTextAlign}.<br/>
   * Sets the alignment for this command window to be left-aligned.
   */
  itemTextAlign()
  {
    return "left";
  }

  /**
   * Implements {@link Window_FilterableList.sourceItems}.<br/>
   * The panels this actor has unlocked.
   *
   * The rankings-to-panels resolution happens here so the rest of the pipeline only ever sees real panels.
   * A ranking whose panel is missing from the metadata map is dropped at this one point; every step
   * downstream may then assume a panel exists. The actor itself is legitimately absent until the scene
   * calls {@link #setActor}, because `initialize` refreshes before the scene gets a chance.
   * @returns {StatDistributionPanel[]}
   */
  sourceItems()
  {
    const actor = this.currentActor;

    // the first refresh happens inside `initialize`, before the scene has assigned an actor.
    if (actor === null) return [];

    return actor.getAllUnlockedSdps()
      .map(panelRanking => J.SDP.Metadata.panelsMap.get(panelRanking.key))
      .filter(panel => panel !== undefined);
  }

  /**
   * Implements {@link Window_FilterableList.matchesFilter}.<br/>
   * Whether a panel belongs under the active family tab.
   * @param {StatDistributionPanel} panel The panel driving this step.
   * @param {string} filterKey The active family filter key.
   * @returns {boolean}
   */
  matchesFilter(panel, filterKey)
  {
    return SdpFamilyFilter.panelMatchesFilter(panel, filterKey);
  }

  /**
   * Implements {@link Window_FilterableList.isActionable}.<br/>
   * A panel is actionable while there are ranks left to buy in it.
   * @param {StatDistributionPanel} panel The panel driving this step.
   * @returns {boolean}
   */
  isActionable(panel)
  {
    return this.isMaxRank(panel) === false;
  }

  /**
   * Implements {@link Window_FilterableList.compareItems}.<br/>
   * Orders rows by family, then subgroup, then subgroup tier (alphabetical-by-key fallback).
   * @param {StatDistributionPanel} left The first panel driving this step.
   * @param {StatDistributionPanel} right The second panel driving this step.
   * @returns {number}
   */
  compareItems(left, right)
  {
    return SdpFamilyFilter.comparePanels(left, right);
  }

  /**
   * Whether this actor has already taken a panel as far as it goes.
   * @param {StatDistributionPanel} panel The panel driving this step.
   * @returns {boolean}
   */
  isMaxRank(panel)
  {
    const { currentRank } = this.currentActor.getSdpByKey(panel.key);

    return panel.maxRank <= currentRank;
  }

  /**
   * Implements {@link Window_FilterableList.buildCommand}.<br/>
   * Builds a single row for the SDP list based on a given panel.
   * @param {StatDistributionPanel} panel The panel to build a command for.
   * @returns {BuiltWindowCommand}
   */
  buildCommand(panel)
  {
    const {
      name,
      key,
      iconIndex
    } = panel;

    const colorIndex = panel.getPanelRarityColorIndex();

    // keep rows selectable even when the wallet cannot afford the next rank alone — cart totals and
    // queued levels change continuously; disabling by snapshot points goes stale quickly.
    const enabled = this.isMaxRank(panel) === false;

    // construct the SDP command.
    const command = new WindowCommandBuilder(name)
      .setSymbol(key)
      .setEnabled(enabled)
      // keep the panel as the ext; the scene expects `currentExt()` to be the panel.
      .setExtensionData(panel)
      .setIconIndex(iconIndex)
      .setColorIndex(colorIndex)
      .build();

    return command;
  }

  /**
   * Overwrites {@link #drawItem}.<br/>
   * Renders SDP list rows with styled padded ranks.
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

    // draw the rank block on the right.
    this.drawRankDetails(index, rectX, rectY, rectWidth);
  }

  /**
   * Draws the rank block flush right (`CC / MM`). With cart, the left number becomes a preview
   * (`min(max, current + queued)`) in palette **24** (power-up) — no extra ` +NN` column.
   * @param {number} index The command index.
   * @param {number} x The row x.
   * @param {number} y The row y.
   * @param {number} width The row width.
   */
  drawRankDetails(index, x, y, width)
  {
    const command = this.commandEntryAt(index);
    const panel = command
      ? command.ext
      : null;
    if (!panel)
    {
      return;
    }

    const actor = this.currentActor;
    const {
      key,
      maxRank,
    } = panel;
    const { currentRank } = actor.getSdpByKey(key);
    const isMaxRank = maxRank <= currentRank;
    const cartLevels = this.cart.get(key) ?? 0;

    const pad = 12;
    const rightEdge = x + width - pad;

    // maxed panels just say DONE.
    if (isMaxRank)
    {
      const done = 'DONE';
      const doneW = this.textWidth(done);
      this.drawText(done, rightEdge - doneW, y, doneW, Window_Base.TextAlignments.Left);
      return;
    }

    // `CC / MM` — anchor from the right edge first so columns stay fixed.
    const rankW = this.textWidth('00');
    const slashText = ' / ';
    const slashW = this.textWidth(slashText);

    const maxX = rightEdge - rankW;
    const slashX = maxX - slashW;
    const curX = slashX - rankW;

    // with cart levels, the left column shows **preview rank** (capped) in “power up” green; no separate +NN column.
    const hasCart = cartLevels > 0;
    const previewCurrent = Math.min(maxRank, currentRank + cartLevels);
    const currentColor = hasCart
      ? 24
      : 0;

    this.drawStyledZeroPaddedNumber(
      curX,
      y,
      hasCart
        ? previewCurrent
        : currentRank,
      rankW,
      2,
      8,
      currentColor);
    this.drawText(slashText, slashX, y, slashW, Window_Base.TextAlignments.Left);
    this.drawStyledZeroPaddedNumber(maxX, y, maxRank, rankW, 2, 8, 0);
  }

  //region cart
  /**
   * Extends {@link #cursorLeft}.<br/>
   * Enables tab-switching via left input (controller-first).
   */
  cursorLeft(wrap)
  {
    // if the scene is listening for cart-dec, then do that instead of noop'ing on a single-column list.
    if (this.isHandled('cart-dec'))
    {
      this.callHandler('cart-dec');
      return;
    }

    // perform original logic.
    Window_Selectable.prototype.cursorLeft.call(this, wrap);
  }

  /**
   * Extends {@link #cursorRight}.<br/>
   * Enables tab-switching via right input (controller-first).
   */
  cursorRight(wrap)
  {
    // if the scene is listening for cart-inc, then do that instead of noop'ing on a single-column list.
    if (this.isHandled('cart-inc'))
    {
      this.callHandler('cart-inc');
      return;
    }

    // perform original logic.
    Window_Selectable.prototype.cursorRight.call(this, wrap);
  }
  //endregion cart
}

export default Window_SdpList;
//endregion Window_SdpList