//region Window_SdpRankData
class Window_SdpRankData
  extends Window_Base
{
  /**
   * The color index of the rarity of the panel selected.
   * @type {number}
   */
  rarityColorIndex = 0;

  /**
   * The text describing the rarity of this panel.
   * @type {string}
   */
  rarityText = String.empty;

  /**
   * The current rank of the panel selected.
   * @type {number}
   */
  currentRank = 0;

  /**
   * The max rank of the panel selected.
   * @type {number}
   */
  maxRank = 0;

  /**
   * The calculated amount to rank up the selected panel.
   * @type {number}
   */
  costToNext = 0;

  /**
   * The currently-available SDP points the actor has.
   * @type {number}
   */
  #availableSdpPoints = 0;

  /**
   * Constructor.
   */
  constructor(rect)
  {
    super(rect);
  }

  /**
   * Sets all the various data points for the window.
   */
  setRankData(rarityColor, rarityText, currentRank, maxRank, costToNext, sdpPoints)
  {
    this.rarityColorIndex = rarityColor;
    this.rarityText = rarityText;
    this.currentRank = currentRank;
    this.maxRank = maxRank;
    this.costToNext = costToNext;
    this.#availableSdpPoints = sdpPoints;
  }

  /**
   * Implements {@link Window_Base.drawContent}.<br>
   * Draws the various SDP rank-related details.
   */
  drawContent()
  {
    // draw the rarity information.
    this.drawPanelRarity(0);

    // draw the cost-to-next-rank data, colorized.
    this.drawCostDetails(1);

    // draw the current/max rank data.
    this.drawRankDetails(2);
  }

  /**
   * Draws the rarity information for this panel.
   * @param {number} rowCount The row number this should be drawn on.
   */
  drawPanelRarity(rowCount)
  {
    // define some variables.
    const lh = this.lineHeight();
    const ox = 0;
    const rowY = lh * rowCount;

    const rarityColor = ColorManager.textColor(this.rarityColorIndex);
    this.changeTextColor(rarityColor);
    this.toggleBold();
    this.toggleItalics();
    this.modFontSize(16);
    this.drawText(this.rarityText, ox, rowY, 200, "left");
    this.resetFontSettings();
  }

  /**
   * Draws the cost information of ranking this panel up.
   * @param {number} rowCount The row number this should be drawn on.
   */
  drawCostDetails(rowCount)
  {
    // define some variables.
    const lh = this.lineHeight();
    const ox = 0;
    const rowY = lh * rowCount;

    // calculate the color (not-index) for the cost.
    const costColor = this.#determineCostColor(this.costToNext);

    // draw the cost to rank up this panel.
    this.drawText(`Cost:`, ox, rowY, 200, "left");
    if (costColor)
    {
      this.changeTextColor(costColor);
      this.drawText(`${this.costToNext}`, ox + 100, rowY, 120, "left");
      this.resetTextColor();
    }
    else
    {
      this.drawText(`---`, ox + 100, rowY, 80, "left");
    }
  }

  /**
   * Draws the current rank information for this panel.
   * @param {number} rowCount The row number this should be drawn on.
   */
  drawRankDetails(rowCount)
  {
    // define some variables.
    const lh = this.lineHeight();
    const ox = 0;
    const rowY = lh * rowCount;

    // draw the current and max rank, colorized.
    this.drawText(`Rank:`, ox, rowY, 200, "left");
    this.changeTextColor(this.#determinePanelRankColor(this.currentRank, this.maxRank));
    this.drawText(`${this.currentRank}`, ox + 55, rowY, 50, "right");
    this.resetTextColor();
    this.drawText(`/`, ox + 110, rowY, 30, "left");
    this.drawText(`${this.maxRank}`, ox + 130, rowY, 50, "left");
  }

  /**
   * Determines the color of the "current rank" number text.
   * @param {number} currentRank The current rank of this panel.
   * @param {number} maxRank The maximum rank of this panel.
   * @returns {number} The id of the color.
   */
  #determinePanelRankColor(currentRank, maxRank)
  {
    // if there is no ranks in this panel, then use this color.
    if (currentRank === 0) return ColorManager.damageColor();

    // if we have ranks, but still aren't max, use this color.
    if (currentRank < maxRank) return ColorManager.crisisColor();

    // we have exceeded the max rank, so use this color.
    if (currentRank >= maxRank) return ColorManager.powerUpColor();

    // who knows what situation this happens in, but return normal if we do.
    return ColorManager.normalColor();
  }

  /**
   * Determines the color of the "current rank" number text.
   * @param {number} rankUpCost The cost to rank up this panel.
   * @returns {number} The id of the color.
   */
  #determineCostColor(rankUpCost)
  {
    // if the cost is 0, then just return, it doesn't matter.
    if (rankUpCost === 0) return null;

    const currentSdpPoints = this.#availableSdpPoints;

    if (rankUpCost <= currentSdpPoints)
    {
      return ColorManager.powerUpColor();
    }
    else
    {
      return ColorManager.damageColor();
    }
  }
}

//endregion Window_SdpRankData