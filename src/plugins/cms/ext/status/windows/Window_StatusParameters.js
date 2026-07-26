//region Window_StatusParameters
/**
 * A replacement class for `Window_StatusParams`, which originally extended `Window_Selectable`
 * and rendered only the b-params. This window now extends `Window_Base` and renders all
 * params, including b-/x-/s- params, plus the elemental and ailment affiliation panels.
 *
 * The parameter-group grid itself (chrome, layout, registry lookups) is drawn through the shared
 * {@link ParameterCatalogRenderer} in `cms/core` so this page and the equip comparison panel stay
 * visually identical; this window only owns the page-1-specific layout (three columns, elements,
 * ailments) and never touches the registry directly.
 */
class Window_StatusParameters
  extends Window_Base
{
  /**
   * @param {Rectangle} rect A rectangle that represents the shape of this window.
   */
  constructor(rect)
  {
    super(rect);
    this.initMembers();
  }

  /**
   * Initializes all members of this class.
   */
  initMembers()
  {
    this.actor = null;
  }

  /**
   * Overwrites {@link #lineHeight}.<br/>
   * Reduces line height for this window.
   * @returns {number}
   */
  lineHeight()
  {
    return 32;
  }

  /**
   * Sets the actor for this window to draw parameter data for.
   * @param {Game_Actor} actor The actor to set.
   */
  setActor(actor)
  {
    this.actor = actor;
    this.refresh();
  }

  /**
   * Refreshes this window by clearing it and redrawing all its contents.
   */
  refresh()
  {
    this.contents.clear();
    this.drawContent();
  }

  /**
   * Draws all content in this window.
   */
  drawContent()
  {
    // if we don't have an actor to render the parameters for, don't.
    if (!this.actor) return;

    const { rowGap } = ParameterCatalogRenderer.PAGE_LAYOUT;
    const columnLayout = ParameterCatalogRenderer.computeThreeColumnLayout(this);
    let cursorY = 0;

    if (columnLayout)
    {
      const { columnWidth, leftX, middleX, rightX, rightColumnWidth } = columnLayout;
      const columnXs = [ leftX, middleX ];

      // draw the three catalog group rows (combat/vitality, precision/defensive, mobility/fate).
      ParameterCatalogRenderer.PAGE_GROUP_ROW_GROUPS.forEach(rowGroups =>
      {
        const rowHeights = rowGroups.map((groupId, columnIndex) =>
        {
          return ParameterCatalogRenderer.drawParameterGroup(this, columnXs[columnIndex], cursorY, groupId, columnWidth, this.actor);
        });

        const tallestSection = Math.max(...rowHeights);
        cursorY += tallestSection + rowGap;
      });

      const elementsBottomY = this.drawElementalRates(rightX, 0, 10, rightColumnWidth);
      this.drawStateRates(rightX, elementsBottomY + 16, rightColumnWidth);
    }
    else
    {
      // when the window is too narrow for three columns, fall back to two columns below the grid.
      const fallbackWidth = Math.floor((this.innerWidth - 24) / 2);

      ParameterCatalogRenderer.PAGE_GROUP_ROW_GROUPS.forEach(rowGroups =>
      {
        const rowHeights = rowGroups.map((groupId, columnIndex) =>
        {
          const x = columnIndex === 0
            ? 0
            : fallbackWidth + 24;

          return ParameterCatalogRenderer.drawParameterGroup(this, x, cursorY, groupId, fallbackWidth, this.actor);
        });

        const tallestSection = Math.max(...rowHeights);
        cursorY += tallestSection + rowGap;
      });

      const halfWidth = Math.floor((this.innerWidth - 16) / 2);
      const elementsHeight = this.drawElementalRates(0, cursorY + 8, 10, halfWidth);
      this.drawStateRates(halfWidth + 16, cursorY + 8, halfWidth);
    }
  }

  /**
   * Y coordinate for the horizontal rule beneath a section title — matches {@link #drawTSeparator}.
   * @param {number} sectionY The section's content anchor y (same as catalog groups use).
   * @returns {number}
   */
  sectionSeparatorY(sectionY)
  {
    const rowBaseY = sectionY + 8;
    const firstRowY = (rowBaseY - 2) + this.lineHeight();

    return firstRowY - 4;
  }

  /**
   * Collects element affiliation rows that differ from the 100% baseline.
   * Uses {@link Game_Battler#elementRate} so the panel matches combat math (incl. J.ELEM absorb).
   * @param {number} limit The number of elements to inspect.
   * @returns {Array<{name: string, value: string, iconIndex: number, colorIndex: number}>}
   */
  collectElementAffiliationRows(limit = 10)
  {
    /** @type {Array<{name: string, value: string, iconIndex: number, colorIndex: number}>} */
    const rows = [];

    // Copy a sub-range without mutating the source array.
    $dataSystem.elements.slice(0, limit)
      .forEach((elementName, index) =>
      {
        const absorbed = J.ELEM && this.actor.isElementAbsorbed(index);
        const combatRate = this.actor.elementRate(index);
        const magnitudePercent = Math.round(Math.abs(combatRate) * 100);
        const formatted = AffiliationDisplay.formatDelta(magnitudePercent, {
          absorbed,
          immune: absorbed === false && magnitudePercent <= 0,
        });

        if (!formatted)
        {
          return;
        }

        const name = (elementName === String.empty)
          ? 'Neutral'
          : elementName;

        // Append the row to the working collection.
        rows.push({
          name,
          value: formatted.value,
          iconIndex: IconManager.element(index),
          colorIndex: formatted.colorIndex,
        });
      });

    return rows;
  }

  /**
   * Collects ailment resistance rows that differ from the 100% baseline.
   * Uses {@link Game_Battler#stateRate} so the panel matches combat math.
   * @returns {Array<{name: string, value: string, iconIndex: number, colorIndex: number}>}
   */
  collectAilmentAffiliationRows()
  {
    /** @type {Array<{name: string, value: string, iconIndex: number, colorIndex: number}>} */
    const rows = [];

    // Copy a sub-range without mutating the source array.
    $dataStates.slice(4, 18)
      .forEach(state =>
      {
        if (!state) return;

        const immune = this.actor.isStateResist(state.id);
        const ratePercent = immune
          ? 0
          : Math.round(this.actor.stateRate(state.id) * 100);
        const formatted = AffiliationDisplay.formatDelta(ratePercent, {
          immune,
        });

        if (!formatted)
        {
          return;
        }

        // Append the row to the working collection.
        rows.push({
          name: state.name,
          value: formatted.value,
          iconIndex: state.iconIndex,
          colorIndex: formatted.colorIndex,
        });
      });

    return rows;
  }

  /**
   * Draws a single baseline placeholder row when every entry in a section is standard.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   * @param {number} sectionWidth The width available for this row.
   */
  drawAffiliationBaselineRow(x, y, sectionWidth)
  {
    this.resetFontSettings();
    this.makeFontSmaller();
    this.changeTextColor(ColorManager.textColor(7));
    this.drawText('All standard', x, y, sectionWidth, 'center');
    this.resetFontSettings();
  }

  /**
   * Draws filtered affiliation rows beneath a section header.
   * @param {number} x The x coordinate.
   * @param {number} y The section anchor y.
   * @param {number} sectionWidth The width available for each row.
   * @param {Array<{name: string, value: string, iconIndex: number, colorIndex: number}>} rows The rows to draw.
   * @returns {number} The y coordinate just below the last visible row.
   */
  drawAffiliationRows(x, y, sectionWidth, rows)
  {
    if (rows.length === 0)
    {
      const rowY = y + this.lineHeight() + 8;
      this.drawAffiliationBaselineRow(x, rowY, sectionWidth);

      return rowY + this.lineHeight();
    }

    rows.forEach((row, index) =>
    {
      const rowY = y + ((index + 1) * this.lineHeight()) + 8;
      this.drawParameter(row.name, row.value, row.iconIndex, x, rowY, row.colorIndex, sectionWidth);
    });

    return y + ((rows.length + 1) * this.lineHeight()) + 8;
  }

  /**
   * Overwrites {@link #makeFontSmaller}.<br/>
   * Makes the reduction step smaller.
   */
  makeFontSmaller()
  {
    if (this.contents.fontSize >= 24)
    {
      this.contents.fontSize -= 6;
    }
  }

  /**
   * Overwrites {@link #makeFontBigger}.<br/>
   * Makes the expansion step smaller.
   */
  makeFontBigger()
  {
    if (this.contents.fontSize <= 96)
    {
      this.contents.fontSize += 6;
    }
  }

  /**
   * Draws the elemental rates section.
   * @param {number} x The `x` coordinate.
   * @param {number} y The `y` coordinate.
   * @param {number} limit The endpoint if applicable of elements to pull.
   * @param {number=} sectionWidth The width of this section; defaults to 450.
   * @returns {number} The y coordinate just below the last drawn row.
   */
  drawElementalRates(x, y, limit = 10, sectionWidth = 450)
  {
    const titleY = y - 15;
    const separatorY = this.sectionSeparatorY(y);

    // draw the title for this section — same chrome rhythm as catalog groups.
    ParameterCatalogRenderer.drawTitle(this, "Elements", x, titleY, 64, 8, 'center', sectionWidth);

    // draw a visual separator aligned with the affiliation value edge.
    this.drawHorizontalLine(x, separatorY, sectionWidth, 3);

    const rows = this.collectElementAffiliationRows(limit);

    return this.drawAffiliationRows(x, y, sectionWidth, rows);
  }

  /**
   * Draws the state rates section.
   * @param {number} x The `x` coordinate.
   * @param {number} y The `y` coordinate.
   * @param {number=} sectionWidth The width of this section; defaults to 450.
   * @returns {number} The y coordinate just below the last drawn row.
   */
  drawStateRates(x, y, sectionWidth = 450)
  {
    const titleY = y - 15;
    const separatorY = this.sectionSeparatorY(y);

    // draw the title — same chrome rhythm as catalog groups.
    ParameterCatalogRenderer.drawTitle(this, "Ailments", x, titleY, 2, 8, 'center', sectionWidth);

    // draw a visual separator aligned with the affiliation value edge.
    this.drawHorizontalLine(x, separatorY, sectionWidth, 3);

    const rows = this.collectAilmentAffiliationRows();

    return this.drawAffiliationRows(x, y, sectionWidth, rows);
  }

  /**
   * Draws the given data as "a parameter".
   * @param {string} name The name of the parameter.
   * @param {number} value The value of the parameter.
   * @param {number} iconIndex The icon index for this parameter.
   * @param {number} x The `x` coordinate.
   * @param {number} y The `y` coordinate.
   * @param {number} colorIndex The color index for this parameter.
   * @param {number=} sectionWidth The width available for this row.
   */
  drawParameter(name, value, iconIndex, x, y, colorIndex = 0, sectionWidth = 450)
  {
    this.resetFontSettings();
    this.makeFontSmaller();

    const modifiedX = x + ImageManager.iconWidth + 4;
    const gap = 8;
    const valuePixelWidth = ParameterCatalogRenderer.styledValuePixelWidth(this, value);
    const nameWidth = Math.max(48, sectionWidth - (modifiedX - x) - valuePixelWidth - gap);

    this.drawIcon(iconIndex, x, y);
    this.drawText(`${name}`, modifiedX, y, nameWidth, 'left');

    // span the full section so digits hug the inner window edge (no fixed value inset).
    this.drawStyledPaddedValue(x, y, value, sectionWidth, 8, colorIndex);

    this.resetFontSettings();
  }
}

export default Window_StatusParameters;
//endregion Window_StatusParameters
