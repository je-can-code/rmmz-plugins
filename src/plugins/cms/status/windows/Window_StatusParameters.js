//region Window_StatusParameters
import StatusParameter from './../_models/StatusParameter.js';

/**
 * A replacement class for `Window_StatusParams`, which originally extended `Window_Selectable`
 * and rendered only the b-params. This window now extends `Window_Base` and renders all
 * params, including b-/x-/s- params.
 */
class Window_StatusParameters
  extends Window_Base
{
  /**
   * Section chrome for catalog groups rendered on page 1.
   * @type {Object<string, {title: string, iconIndex: number, colorIndex: number}>}
   */
  static GROUP_CHROME = {
    combat: {
      title: 'Combat',
      iconIndex: 76,
      colorIndex: 10,
    },
    vitality: {
      title: 'Vitality',
      iconIndex: 7,
      colorIndex: 3,
    },
    precision: {
      title: 'Precision',
      iconIndex: 1756,
      colorIndex: 6,
    },
    defensive: {
      title: 'Defensive',
      iconIndex: 1625,
      colorIndex: 26,
    },
    mobility: {
      title: 'Haste',
      iconIndex: 82,
      colorIndex: 20,
    },
    fate: {
      title: 'Fate',
      iconIndex: 1619,
      colorIndex: 27,
    },
  };

  /**
   * Gap between a catalog name block and its value column.
   * @type {number}
   */
  static CATALOG_NAME_VALUE_GAP = 8;

  /**
   * Gap between paired values straddling the center divider.
   * @type {number}
   */
  static CATALOG_PAIR_GAP = 8;

  /**
   * Horizontal rules extend this many pixels past {@link #computeThreeColumnLayout} column width.
   * @type {number}
   */
  static COLUMN_LINE_BLEED = 16;

  /**
   * Clear air between columns after accounting for {@link #COLUMN_LINE_BLEED}.
   * @type {number}
   */
  static COLUMN_CLEAR_GAP = 24;

  /**
   * Shared layout constants for page-1 row bands.
   * @type {{rowGap: number}}
   */
  static PAGE_LAYOUT = {
    rowGap: 24,
  };

  /**
   * Catalog group ids per visual row band (left column, then middle column).
   * @type {Array<[string, string]>}
   */
  static PAGE_GROUP_ROW_GROUPS = [
    [ 'combat', 'vitality' ],
    [ 'precision', 'defensive' ],
    [ 'mobility', 'fate' ],
  ];
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

    const { rowGap } = Window_StatusParameters.PAGE_LAYOUT;
    const columnLayout = this.computeThreeColumnLayout();
    let cursorY = 0;

    if (columnLayout)
    {
      const { columnWidth, leftX, middleX, rightX, rightColumnWidth } = columnLayout;
      const columnXs = [ leftX, middleX ];

      // draw the three catalog group rows (combat/vitality, precision/defensive, mobility/fate).
      Window_StatusParameters.PAGE_GROUP_ROW_GROUPS.forEach(rowGroups =>
      {
        const rowHeights = rowGroups.map((groupId, columnIndex) =>
        {
          return this.drawParameterGroup(columnXs[columnIndex], cursorY, groupId, columnWidth);
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

      Window_StatusParameters.PAGE_GROUP_ROW_GROUPS.forEach(rowGroups =>
      {
        const rowHeights = rowGroups.map((groupId, columnIndex) =>
        {
          const x = columnIndex === 0
            ? 0
            : fallbackWidth + 24;

          return this.drawParameterGroup(x, cursorY, groupId, fallbackWidth);
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
   * Computes equal-width three-column layout with equal inter-column gaps.
   * @returns {{ edgePad: number, gap: number, columnWidth: number, leftX: number, middleX: number, rightX: number, rightColumnWidth: number }|null}
   */
  computeThreeColumnLayout()
  {
    const edgePad = 8;
    const usable = this.innerWidth - (edgePad * 2);
    const gap = Window_StatusParameters.COLUMN_LINE_BLEED + Window_StatusParameters.COLUMN_CLEAR_GAP;
    const minColumnWidth = 200;
    const columnWidth = Math.floor((usable - (gap * 2)) / 3);

    if (columnWidth < minColumnWidth)
    {
      return null;
    }

    const leftX = edgePad;
    const middleX = leftX + columnWidth + gap;
    const rightX = middleX + columnWidth + gap;

    // absorb rounding slack; values may use the full inner width through the right edge.
    const rightColumnWidth = this.innerWidth - rightX;

    return {
      edgePad,
      gap,
      columnWidth,
      leftX,
      middleX,
      rightX,
      rightColumnWidth,
    };
  }

  /**
   * X coordinate of the vertical rule between paired stats — matches {@link #drawTSeparator}.
   * @param {number} sectionX The left edge of the group column.
   * @param {number} sectionWidth The drawable width of the group column.
   * @returns {number}
   */
  centerDividerX(sectionX, sectionWidth)
  {
    return sectionX + Math.floor(sectionWidth / 2) + 8;
  }

  /**
   * Outer right edge for catalog row chrome (icon column); matches section width, not line bleed.
   * @param {number} sectionX The left edge of the group column.
   * @param {number} sectionWidth The drawable width of the group column.
   * @returns {number}
   */
  catalogRowRight(sectionX, sectionWidth)
  {
    return sectionX + sectionWidth;
  }

  /**
   * Whether a catalog value already occupies the sign column (space, {@code +}, or {@code -}).
   * @param {string} value The rendered value text.
   * @returns {boolean}
   */
  catalogValueHasSignColumn(value)
  {
    const first = value.charAt(0);

    return first === ' ' || first === '+' || first === '-';
  }

  /**
   * Whether a right-half catalog value should indent one column to match signed percent rows.
   * @param {string} value The rendered value text.
   * @param {boolean} withPadding Whether styled padding is active.
   * @param {boolean} isSentinel Whether the value is a clamped label ({@code FREE}, etc.).
   * @returns {boolean}
   */
  catalogValueRightReservesSignColumn(value, withPadding, isSentinel)
  {
    if (withPadding)
    {
      return this.catalogValueHasSignColumn(value) === false;
    }

    return isSentinel;
  }

  /**
   * Monospace slot width for a right-half catalog value.
   * @param {string} value The rendered value text.
   * @param {boolean} withPadding Whether styled padding is active.
   * @param {boolean} isSentinel Whether the value is a clamped label ({@code FREE}, etc.).
   * @returns {number}
   */
  catalogValueRightMeasureWidth(value, withPadding, isSentinel)
  {
    if (withPadding || isSentinel)
    {
      return this.styledValuePixelWidth(value);
    }

    return this.textWidth(value);
  }

  /**
   * Layout width for a right-half catalog value beside the center divider.
   * Flat numerics and sentinel labels reserve one digit column so they align with signed percents.
   * @param {string} value The rendered value text.
   * @param {boolean} withPadding Whether styled padding is active.
   * @param {boolean} isSentinel Whether the value is a clamped label ({@code FREE}, etc.).
   * @returns {number}
   */
  catalogValueRightLayoutWidth(value, withPadding, isSentinel)
  {
    const measureWidth = this.catalogValueRightMeasureWidth(value, withPadding, isSentinel);

    if (this.catalogValueRightReservesSignColumn(value, withPadding, isSentinel))
    {
      return measureWidth + this.textWidth('0');
    }

    return measureWidth;
  }

  /**
   * X coordinate for drawing a right-half catalog value beside the center divider.
   * @param {number} halfX The inner edge of the right half-column.
   * @param {string} value The rendered value text.
   * @param {boolean} withPadding Whether styled padding is active.
   * @param {boolean} isSentinel Whether the value is a clamped label ({@code FREE}, etc.).
   * @returns {number}
   */
  catalogValueRightDrawX(halfX, value, withPadding, isSentinel)
  {
    if (this.catalogValueRightReservesSignColumn(value, withPadding, isSentinel))
    {
      return halfX + this.textWidth('0');
    }

    return halfX;
  }

  /**
   * Estimates pixel width for a styled padded string (monospace digit assumption).
   * @param {string} value The rendered text.
   * @returns {number}
   */
  styledValuePixelWidth(value)
  {
    return value.length * this.textWidth('0');
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
   * Draws one catalog group section and returns the vertical space consumed.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   * @param {string} groupId The {@link ParameterGroups} id.
   * @param {number} sectionWidth The width of the section.
   * @returns {number}
   */
  drawParameterGroup(x, y, groupId, sectionWidth)
  {
    const chrome = Window_StatusParameters.GROUP_CHROME[groupId];
    const definitions = ParameterRegistry.byGroup(groupId);

    if (!chrome || !definitions.length)
    {
      return 0;
    }

    const rowCount = Math.ceil(definitions.length / 2);
    const titleY = y - 15;
    const rowBaseY = y + 8;

    // draw the section title and separator.
    this.drawTitle(chrome.title, x, titleY, chrome.iconIndex, chrome.colorIndex);
    this.drawTSeparator(x, rowBaseY - 2, sectionWidth, rowCount);

    // draw each registered parameter in left/right pairs.
    this.drawGroupParameters(x, rowBaseY, sectionWidth, definitions);

    // title block + separator + parameter rows.
    return 36 + (rowCount * this.lineHeight()) + 8;
  }

  /**
   * Draws all parameters for a group in two-column pairs.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   * @param {number} sectionWidth The width of the section.
   * @param {ParameterDefinition[]} definitions The catalog entries for this group.
   */
  drawGroupParameters(x, y, sectionWidth, definitions)
  {
    const lh = this.lineHeight();
    const dividerX = this.centerDividerX(x, sectionWidth);
    const pairGap = Window_StatusParameters.CATALOG_PAIR_GAP;
    const leftInnerRight = dividerX - Math.floor(pairGap / 2);
    const rightHalfX = dividerX + Math.ceil(pairGap / 2);
    const rowRight = this.catalogRowRight(x, sectionWidth);

    definitions.forEach((definition, index) =>
    {
      const row = Math.floor(index / 2) + 1;
      const rowY = y + (lh * row);
      const parameter = this.makeParameter(definition.key);

      if (index % 2 === 0)
      {
        this.drawParameterLeft(x, rowY, leftInnerRight, parameter);
      }
      else
      {
        this.drawParameterRight(rightHalfX, rowY, rowRight, parameter);
      }
    });
  }

  /**
   * Draws a T separator by using a horizontal and vertical line.
   * The length of these lines is defined by the section width and the number of lines.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   * @param {number} w The width of the T separator.
   * @param {number=} lines The height of the T separator, multiplied by `lineHeight`; defaults to 1 line.
   */
  drawTSeparator(x, y, w, lines = 1)
  {
    // shorthand the line height.
    const lh = this.lineHeight();

    // define the first row's y coordinate.
    const firstRowY = y + (lh * 1);

    // separate the title from the parameters, for visual effect.
    this.drawHorizontalLine(x, firstRowY - 4, w + Window_StatusParameters.COLUMN_LINE_BLEED, 3);

    // define the right column's x coordinate.
    const secondColumnX = x + (w / 2) + 12;

    // define the x coordinate for the vertical line.
    const verticalLineX = secondColumnX - 4;

    // define the height in pixels for the vertical line.
    const verticalLineHeight = (lh * lines) + 4;

    // separate the two columns of parameters, for visual effect.
    this.drawVerticalLine(verticalLineX, firstRowY - 2, verticalLineHeight, 3);

  }

  /**
   * Draws a catalog stat value with optional styled zero-padding.
   * @param {number} x The value column x coordinate.
   * @param {number} y The y coordinate.
   * @param {number} width The width reserved for the value.
   * @param {StatusParameter} parameter The parameter being rendered.
   * @param {'left'|'right'} align Horizontal alignment within the slot.
   */
  drawCatalogParameterValue(x, y, width, parameter, align = 'right')
  {
    const withPadding = parameter.usesStyledValue();
    const value = parameter.prettyValue(withPadding);

    if (withPadding)
    {
      this.drawStyledPaddedValue(x, y, value, width, 8, parameter.colorIndex, align);
    }
    else
    {
      const valueColorIndex = parameter.colorIndex;

      if (valueColorIndex !== 0)
      {
        this.contents.fontBold = true;
      }

      this.changeTextColor(ColorManager.textColor(valueColorIndex));
      this.drawText(value, x, y, width, align);
      this.resetTextColor();
      this.resetFontFormatting();
    }
  }

  /**
   * Creates a new parameter object that contains the necessary data to draw it into the window.
   * @param {string} parameterKey The parameter registry key (e.g. `'atk'`).
   * @returns {StatusParameter} The compiled {@link StatusParameter}.
   */
  makeParameter(parameterKey)
  {
    // resolve the live value through the catalog — same path as formulas will use later.
    const value = this.actor.parameter(parameterKey);

    // return a newly constructed status parameter.
    return new StatusParameter(value, parameterKey);
  }

  /**
   * Left half of a paired row: {@code [icon][name][value→center]}.
   * @param {number} halfX The left edge of this half-column.
   * @param {number} y The y coordinate.
   * @param {number} innerRight The inner edge where values meet the center divider.
   * @param {StatusParameter} parameter The parameter being rendered.
   */
  drawParameterLeft(halfX, y, innerRight, parameter)
  {
    // clear text color modifiers.
    this.resetFontSettings();

    // draw the icon on the outer edge of this half-column.
    this.drawIcon(parameter.iconIndex, halfX, y);

    // reduce the font size a bit.
    this.makeFontSmaller();

    const iconPad = ImageManager.iconWidth + 4;
    const gap = Window_StatusParameters.CATALOG_NAME_VALUE_GAP;
    const rowSpan = innerRight - halfX;
    const nameX = halfX + iconPad;
    const withPadding = parameter.usesStyledValue();
    const value = parameter.prettyValue(withPadding);
    const valuePixelWidth = withPadding
      ? this.styledValuePixelWidth(value)
      : this.textWidth(value);
    const nameWidth = Math.max(0, rowSpan - iconPad - valuePixelWidth - gap);

    // name fills the middle; value hugs the inner edge toward the center divider.
    this.drawText(`${parameter.name}`, nameX, y, nameWidth, 'left');
    this.drawCatalogParameterValue(halfX, y, rowSpan, parameter, 'right');

    // clear text color modifiers.
    this.resetFontSettings();
  }

  /**
   * Right half of a paired row: {@code [value←center][name][icon]} (mirrored zigzag).
   * @param {number} halfX The left (inner) edge of this half-column.
   * @param {number} y The y coordinate.
   * @param {number} outerRight The outer edge of the section (includes underline bleed).
   * @param {StatusParameter} parameter The parameter being rendered.
   */
  drawParameterRight(halfX, y, outerRight, parameter)
  {
    // clear text color modifiers.
    this.resetFontSettings();

    // reduce the font size a bit.
    this.makeFontSmaller();

    const gap = Window_StatusParameters.CATALOG_NAME_VALUE_GAP;
    const iconX = outerRight - ImageManager.iconWidth;
    const withPadding = parameter.usesStyledValue();
    const value = parameter.prettyValue(withPadding);
    const definition = ParameterRegistry.get(parameter.parameterKey);
    const isSentinel = definition && definition.resolveDisplaySentinel(parameter.value) !== null;
    const layoutWidth = this.catalogValueRightLayoutWidth(value, withPadding, isSentinel);
    const valueDrawX = this.catalogValueRightDrawX(halfX, value, withPadding, isSentinel);
    const valueDrawWidth = this.catalogValueRightMeasureWidth(value, withPadding, isSentinel);
    const nameX = halfX + layoutWidth + gap;
    const nameWidth = Math.max(0, iconX - nameX - gap);

    // signed percents stay at the divider; flats and sentinels indent one column to match them.
    this.drawCatalogParameterValue(valueDrawX, y, valueDrawWidth, parameter, 'left');
    this.resetTextColor();
    this.resetFontFormatting();
    this.drawText(`${parameter.name}`, nameX, y, nameWidth, 'right');
    this.drawIcon(parameter.iconIndex, iconX, y);

    // clear text color modifiers.
    this.resetFontSettings();
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
    this.drawTitle("Elements", x, titleY, 64, 8, 'center', sectionWidth);

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
    this.drawTitle("Ailments", x, titleY, 2, 8, 'center', sectionWidth);

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
    const gap = Window_StatusParameters.CATALOG_NAME_VALUE_GAP;
    const valuePixelWidth = this.styledValuePixelWidth(value);
    const nameWidth = Math.max(48, sectionWidth - (modifiedX - x) - valuePixelWidth - gap);

    this.drawIcon(iconIndex, x, y);
    this.drawText(`${name}`, modifiedX, y, nameWidth, 'left');

    // span the full section so digits hug the inner window edge (no fixed value inset).
    this.drawStyledPaddedValue(x, y, value, sectionWidth, 8, colorIndex);

    this.resetFontSettings();
  }

  /**
   * Draws the title of one of the sections for parameters.
   * @param {string} text The text to write as the title.
   * @param {number} x The `x` coordinate.
   * @param {number} y The `y` coordinate.
   * @param {number=} iconIndex The icon index for this parameter; defaults to none(0).
   * @param {number=} colorIndex The color index for the title; defaults to system color(1).
   * @param {string=} alignment The text-alignment value of the title; defaults to "center".
   * @param {number=} sectionWidth The width available for the title row.
   */
  drawTitle(text, x, y, iconIndex = 0, colorIndex = 1, alignment = "center", sectionWidth = 350)
  {
    // clear any font modifications.
    this.resetFontSettings();

    // draw the icon of the title.
    this.drawIcon(iconIndex, x, y + 16);

    // swap the color over to the title color.
    this.changeTextColor(ColorManager.textColor(colorIndex));

    // upsize the title!
    this.makeFontBigger();

    // draw the title itself.
    this.drawText(text, x + 32, y + 16, sectionWidth - 32, alignment);

    // clear our font modifications because we're good tech citizens.
    this.resetFontSettings();
  }
}

export default Window_StatusParameters;
//endregion Window_StatusParameters