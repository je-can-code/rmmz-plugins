//region Window_SdpList
import StatDistributionPanel from '../models/StatDistributionPanel.js';
import SdpFamilyFilter from '../managers/SdpFamilyFilter.js';
/**
 * The SDP window containing the list of all unlocked panels.
 */
class Window_SdpList
  extends Window_Command
{
  /**
   * The currently selected actor for listing unlocked panels and drawing ranks/costs.
   * @type {Game_Actor}
   */
  currentActor = null;

  filterNoMaxedPanels = false;

  /**
   * Active family-filter key for the panel list.
   * @type {string}
   */
  familyFilterKey = SdpFamilyFilter.ALL;

  /**
   * The queued cart levels by panel key.
   * @type {Map<string, number>}
   */
  cart = new Map();

  /**
   * @constructor
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  constructor(rect)
  {
    super(rect);
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
   * Gets whether or not the no-max-panels filter is enabled.
   * @returns {boolean}
   */
  usingNoMaxPanelsFilter()
  {
    return this.filterNoMaxedPanels;
  }

  /**
   * Toggles the "hide max panels" filter for this window.
   */
  toggleNoMaxPanelsFilter()
  {
    this.filterNoMaxedPanels = !this.filterNoMaxedPanels;
  }

  /**
   * Sets the active family filter and refreshes the list.
   * @param {string} familyFilterKey The family filter key driving this step.
   */
  setFamilyFilterKey(familyFilterKey)
  {
    this.familyFilterKey = familyFilterKey;
    this.refresh();
  }

  /**
   * Gets the active family filter key.
   * @returns {string}
   */
  getFamilyFilterKey()
  {
    return this.familyFilterKey;
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
   * Overwrites {@link #makeCommandList}.<br/>
   * Creates the command list for this window.
   */
  makeCommandList()
  {
    // grab the actor.
    const actor = this.currentActor;

    // don't render the list of there is no actor.
    if (!actor) return;

    // grab all the panelRankings the actor has unlocked.
    const panelRankings = actor.getAllUnlockedSdps();

    // check if there even are any panels unlocked.
    if (panelRankings.length === 0) return;

    // iterate over each of the unlocked rankings to render the panel in the list.
    const commands = panelRankings
      .map(panelRanking =>
      {
        // grab the actual panel for its data.
        const panel = J.SDP.Metadata.panelsMap.get(panelRanking.key);

        // construct the SDP command.
        const command = this.makeCommand(panel);

        // if the command is invalid, do not add it.
        if (!command) return null;

        // add the command.
        return command;
      }, this)
      .filter(command => command !== null);

    commands.forEach(this.addBuiltCommand, this);
  }

  /**
   * Builds a single command for the SDP list based on a given panel.
   * @param {StatDistributionPanel} panel The panel to build a command for.
   * @returns {BuiltWindowCommand}
   */
  makeCommand(panel)
  {
    const actor = this.currentActor;
    const {
      name,
      key,
      iconIndex,
      maxRank
    } = panel;

    const colorIndex = panel.getPanelRarityColorIndex();

    // get the ranking for a given panel by its key.
    const panelRanking = actor.getSdpByKey(key);

    // grab the current rank of the panel.
    const { currentRank } = panelRanking;

    // check if we're at max rank already.
    const isMaxRank = maxRank <= currentRank;

    // check if the panel is max rank AND we're using the no max panels filter.
    if (isMaxRank && this.usingNoMaxPanelsFilter())
    {
      // don't render this panel.
      return null;
    }

    // apply the active family filter.
    if (SdpFamilyFilter.panelMatchesFilter(panel, this.familyFilterKey) === false)
    {
      return null;
    }

    // keep rows selectable even when the wallet cannot afford the next rank alone — cart totals and
    // queued levels change continuously; disabling by snapshot points goes stale quickly.
    const enabled = !isMaxRank;

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