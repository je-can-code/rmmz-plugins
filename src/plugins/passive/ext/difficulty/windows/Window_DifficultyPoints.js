//region Window_DifficultyPoints
/**
 * A window containing the difficulty points information.
 */
class Window_DifficultyPoints
  extends Window_Base
{
  /**
   * The difficulty layer that the cursor is currently hovering over.
   * @type {DifficultyLayer|null}
   */
  _hoveredDifficulty = null;

  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  constructor(rect)
  {
    // execute parent constructor.
    super(rect);
  }

  /**
   * Get the currently hovered difficulty from the list window.
   * @returns {DifficultyLayer}
   */
  getHoveredDifficulty()
  {
    return this._hoveredDifficulty;
  }

  /**
   * Set the currently hovered difficulty used by this window.
   * @param {DifficultyLayer} difficulty The difficulty currently hovered.
   */
  setHoveredDifficulty(difficulty)
  {
    this._hoveredDifficulty = difficulty;
  }

  /**
   * Implements {@link Window_Base.drawContent}.<br/>
   * Draws the various data points surrounding the difficulty layer points
   * and how they are affected by the difficulty layer currently being
   * hovered over by the player.
   */
  drawContent()
  {
    // shorthand the lineHeight.
    const lh = this.lineHeight();

    // the header runs across the top.
    this.drawHeader(0, 0);

    // the three figures share the line beneath it, one column each.
    const columnWidth = this.figureColumnWidth();

    // draw the max.
    this.drawMaxLayerPoints(0, lh, columnWidth);

    // draw the current.
    this.drawCurrentLayerPoints(columnWidth, lh, columnWidth);

    // draw the difficulty's modifier.
    this.drawLayerModifier(columnWidth * 2, lh, columnWidth);
  }

  /**
   * The width of each of the three figures on the line beneath the header.
   *
   * A third of the window rather than a pixel count, so the figures spread to fit whatever width the scene
   * gives the window, and a label never shares its space with the value beside it.
   * @returns {number}
   */
  figureColumnWidth()
  {
    return Math.floor(this.innerWidth / 3);
  }

  /**
   * Renders the header for the difficulty layer points available to the player.
   * @param {number} x The origin x coordinate.
   * @param {number} y The origin y coordinate.
   */
  drawHeader(x, y)
  {
    // reset any lingering font settings.
    this.resetFontSettings();

    // make the font size nice and big.
    this.modFontSize(10);

    // enable italics.
    this.toggleItalics(true);

    // TODO: parameterize this.
    // render the icon representing difficulty layers.
    this.drawIcon(2564, x, y);

    // modify the x by the width of an icon with some padding.
    const modX = x + ImageManager.iconWidth + 4;

    // modify the y by an arbitrary small amount to align better with the icon.
    const modY = y - 2;

    // the title may run to the right edge of the window.
    const titleWidth = this.innerWidth - modX;

    // render the headline title text.
    this.drawText('Difficulty Layer Points', modX, modY, titleWidth, 'left');

    // reset any lingering font settings.
    this.resetFontSettings();
  }

  /**
   * Renders the maximum amount of layer points the player has available.
   * @param {number} x The origin x coordinate.
   * @param {number} y The origin y coordinate.
   * @param {number} width The width of this figure's column.
   */
  drawMaxLayerPoints(x, y, width)
  {
    // reset any lingering font settings.
    this.resetFontSettings();

    // make the font size nice and big.
    this.modFontSize(-4);

    // grab the max.
    const layerPointMax = $gameSystem.getLayerPointMax();

    // enable bold.
    this.toggleBold(true);

    // draw the label at the left of the column.
    this.drawText('Max:', x, y, width, 'left');

    // disable bold.
    this.toggleBold(false);

    // the value ends a padding short of the column's edge, so it never touches the next figure's label.
    const valueWidth = width - this.itemPadding();

    // draw the layer point maximum.
    this.drawText(`${layerPointMax}`, x, y, valueWidth, 'right');

    // reset any lingering font settings.
    this.resetFontSettings();
  }

  /**
   * Renders the currently applied layer points.
   * @param {number} x The origin x coordinate.
   * @param {number} y The origin y coordinate.
   * @param {number} width The width of this figure's column.
   */
  drawCurrentLayerPoints(x, y, width)
  {
    // reset any lingering font settings.
    this.resetFontSettings();

    // make the font size nice and big.
    this.modFontSize(-4);

    // grab the current points.
    const layerPointsCurrent = $gameSystem.getLayerPoints();

    // enable bold.
    this.toggleBold(true);

    // draw the label at the left of the column.
    this.drawText('Applied:', x, y, width, 'left');

    // disable bold.
    this.toggleBold(false);

    // the value ends a padding short of the column's edge, so it never touches the modifier beside it.
    const valueWidth = width - this.itemPadding();

    // draw the layer points currently applied.
    this.drawText(`${layerPointsCurrent}`, x, y, valueWidth, 'right');

    // reset any lingering font settings.
    this.resetFontSettings();
  }

  /**
   * Renders the modifier against the current amount of applied layer points.
   * @param {number} x The origin x coordinate.
   * @param {number} y The origin y coordinate.
   * @param {number} width The width of this figure's column.
   */
  drawLayerModifier(x, y, width)
  {
    // get the layer the player is hovering over.
    const difficulty = this.getHoveredDifficulty();

    // if we have no difficulty being hovered, then do not render.
    if (!difficulty) return;

    // don't render for the applied or default layers.
    if (difficulty.isAppliedLayer() || difficulty.isDefaultLayer()) return;

    // reset any lingering font settings.
    this.resetFontSettings();

    // grab the difficulty layer cost.
    const layerCost = difficulty.cost;

    // default the sign to nothing.
    let sign = String.empty;

    // default the color to white like normal.
    let costColorIndex = 0;

    // check if the cost is a positive amount.
    if (layerCost > 0)
    {
      // change the sign to a plus.
      sign = '+';

      if (layerCost + $gameSystem.getLayerPoints() > $gameSystem.getLayerPointMax())
      {
        // too big, red!
        costColorIndex = 10;
      }
      else
      {
        // an increase.
        costColorIndex = 20;
      }
    }

    // make the font size nice and big.
    this.modFontSize(-4);

    // change the color for the current amounts accordingly.
    this.changeTextColor(ColorManager.textColor(costColorIndex));

    // draw the layer point modifier of this layer, reading on from the applied figure beside it.
    this.drawText(`(${sign}${layerCost})`, x, y, width, 'left');

    // reset any lingering font settings.
    this.resetFontSettings();
  }
}

export default Window_DifficultyPoints;
//endregion Window_DifficultyPoints