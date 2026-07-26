import CmsParameter from './../_models/CmsParameter.js';

//region ParameterCatalogRenderer
/**
 * Shared registry-driven parameter catalog rendering for every CMS scene that shows a battler's
 * parameters (status page 1, the equip comparison panel, etc.). Every consumer draws through here
 * so the group taxonomy, chrome (title/icon/color), and layout math stay identical everywhere —
 * a stat looks and is grouped the same way whether you're looking at the status or equip scene.
 *
 * All methods here are static and take the calling `window` as their first argument instead of
 * this class extending `Window_Base` itself; several CMS windows (like `Window_EquipStatus`) are
 * prototype-patches onto RMMZ's built-in global classes rather than ES class extensions, so a
 * plain delegate is the only shape both callers can use identically.
 */
class ParameterCatalogRenderer
{
  /**
   * Section chrome for the catalog groups every parameter-catalog window renders.
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
   * Catalog group ids per visual row band (left column, then middle column).
   * @type {Array<[string, string]>}
   */
  static PAGE_GROUP_ROW_GROUPS = [
    [ 'combat', 'vitality' ],
    [ 'precision', 'defensive' ],
    [ 'mobility', 'fate' ],
  ];

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
   * Shared layout constants for catalog row bands.
   * @type {{rowGap: number}}
   */
  static PAGE_LAYOUT = {
    rowGap: 24,
  };

  /**
   * Computes equal-width three-column layout with equal inter-column gaps.
   * @param {Window_Base} window The window driving the layout.
   * @returns {{ edgePad: number, gap: number, columnWidth: number, leftX: number, middleX: number, rightX: number, rightColumnWidth: number }|null}
   */
  static computeThreeColumnLayout(window)
  {
    const edgePad = 8;
    const usable = window.innerWidth - (edgePad * 2);
    const gap = ParameterCatalogRenderer.COLUMN_LINE_BLEED + ParameterCatalogRenderer.COLUMN_CLEAR_GAP;
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
    const rightColumnWidth = window.innerWidth - rightX;

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
  static centerDividerX(sectionX, sectionWidth)
  {
    return sectionX + Math.floor(sectionWidth / 2) + 8;
  }

  /**
   * Outer right edge for catalog row chrome (icon column); matches section width, not line bleed.
   * @param {number} sectionX The left edge of the group column.
   * @param {number} sectionWidth The drawable width of the group column.
   * @returns {number}
   */
  static catalogRowRight(sectionX, sectionWidth)
  {
    return sectionX + sectionWidth;
  }

  /**
   * Whether a catalog value already occupies the sign column (space, {@code +}, or {@code -}).
   * @param {string} value The rendered value text.
   * @returns {boolean}
   */
  static catalogValueHasSignColumn(value)
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
  static catalogValueRightReservesSignColumn(value, withPadding, isSentinel)
  {
    if (withPadding)
    {
      return ParameterCatalogRenderer.catalogValueHasSignColumn(value) === false;
    }

    return isSentinel;
  }

  /**
   * Estimates pixel width for a styled padded string (monospace digit assumption).
   * @param {Window_Base} window The window measuring the text.
   * @param {string} value The rendered text.
   * @returns {number}
   */
  static styledValuePixelWidth(window, value)
  {
    return value.length * window.textWidth('0');
  }

  /**
   * Monospace slot width for a right-half catalog value.
   * @param {Window_Base} window The window measuring the text.
   * @param {string} value The rendered value text.
   * @param {boolean} withPadding Whether styled padding is active.
   * @param {boolean} isSentinel Whether the value is a clamped label ({@code FREE}, etc.).
   * @returns {number}
   */
  static catalogValueRightMeasureWidth(window, value, withPadding, isSentinel)
  {
    if (withPadding || isSentinel)
    {
      return ParameterCatalogRenderer.styledValuePixelWidth(window, value);
    }

    return window.textWidth(value);
  }

  /**
   * Layout width for a right-half catalog value beside the center divider.
   * Flat numerics and sentinel labels reserve one digit column so they align with signed percents.
   * @param {Window_Base} window The window measuring the text.
   * @param {string} value The rendered value text.
   * @param {boolean} withPadding Whether styled padding is active.
   * @param {boolean} isSentinel Whether the value is a clamped label ({@code FREE}, etc.).
   * @returns {number}
   */
  static catalogValueRightLayoutWidth(window, value, withPadding, isSentinel)
  {
    const measureWidth = ParameterCatalogRenderer.catalogValueRightMeasureWidth(window, value, withPadding, isSentinel);

    if (ParameterCatalogRenderer.catalogValueRightReservesSignColumn(value, withPadding, isSentinel))
    {
      return measureWidth + window.textWidth('0');
    }

    return measureWidth;
  }

  /**
   * X coordinate for drawing a right-half catalog value beside the center divider.
   * @param {Window_Base} window The window measuring the text.
   * @param {number} halfX The inner edge of the right half-column.
   * @param {string} value The rendered value text.
   * @param {boolean} withPadding Whether styled padding is active.
   * @param {boolean} isSentinel Whether the value is a clamped label ({@code FREE}, etc.).
   * @returns {number}
   */
  static catalogValueRightDrawX(window, halfX, value, withPadding, isSentinel)
  {
    if (ParameterCatalogRenderer.catalogValueRightReservesSignColumn(value, withPadding, isSentinel))
    {
      return halfX + window.textWidth('0');
    }

    return halfX;
  }

  /**
   * Picks the arrow glyph describing the direction of a projected change.
   * @param {number} diffValue The signed delta between the current and projected value.
   * @returns {string}
   */
  static arrowCharacter(diffValue)
  {
    if (diffValue > 0)
    {
      return '↗';
    }

    if (diffValue < 0)
    {
      return '↘';
    }

    return '→';
  }

  /**
   * Resolves what text/color a catalog value slot should render. When `nextParameter` is supplied
   * and its value differs from `parameter`, this collapses "current → projected" into a single
   * colored string instead of the padded single-value display — that's the whole reason equip's
   * comparison panel can share this renderer with the plain status page instead of duplicating it.
   * @param {CmsParameter} parameter The parameter's current value.
   * @param {CmsParameter|null} nextParameter The parameter's projected value, if comparing.
   * @returns {{text: string, colorIndex: number, withPadding: boolean}}
   */
  static resolveCatalogDisplay(parameter, nextParameter)
  {
    const hasDiff = (nextParameter !== null) && (nextParameter.value !== parameter.value);

    if (!hasDiff)
    {
      const withPadding = parameter.usesStyledValue();
      return {
        text: parameter.prettyValue(withPadding),
        colorIndex: parameter.colorIndex,
        withPadding,
      };
    }

    const diffValue = nextParameter.value - parameter.value;
    const arrow = ParameterCatalogRenderer.arrowCharacter(diffValue);
    return {
      text: `${parameter.prettyValue()} ${arrow} ${nextParameter.prettyValue()}`,
      colorIndex: ColorManager.paramchangeTextColor(diffValue),
      withPadding: false,
    };
  }

  /**
   * Draws a catalog stat value, optionally as a "current → projected" comparison.
   * @param {Window_Base} window The window to draw into.
   * @param {number} x The value column x coordinate.
   * @param {number} y The y coordinate.
   * @param {number} width The width reserved for the value.
   * @param {CmsParameter} parameter The parameter being rendered.
   * @param {'left'|'right'} align Horizontal alignment within the slot.
   * @param {CmsParameter|null} nextParameter The projected value to compare against, if any.
   */
  static drawCatalogParameterValue(window, x, y, width, parameter, align = 'right', nextParameter = null)
  {
    const display = ParameterCatalogRenderer.resolveCatalogDisplay(parameter, nextParameter);

    if (display.withPadding)
    {
      window.drawStyledPaddedValue(x, y, display.text, width, 8, display.colorIndex, align);
      return;
    }

    if (display.colorIndex !== 0)
    {
      window.contents.fontBold = true;
    }

    window.changeTextColor(ColorManager.textColor(display.colorIndex));
    window.drawText(display.text, x, y, width, align);
    window.resetTextColor();
    window.resetFontFormatting();
  }

  /**
   * Creates a new parameter object that contains the necessary data to draw it into a window.
   * @param {Game_Battler} actor The battler to resolve the value from.
   * @param {string} parameterKey The parameter registry key (e.g. `'atk'`).
   * @returns {CmsParameter} The compiled {@link CmsParameter}.
   */
  static makeParameter(actor, parameterKey)
  {
    // resolve the live value through the catalog — same path formulas use elsewhere.
    const value = actor.parameter(parameterKey);

    // return a newly constructed catalog parameter.
    return new CmsParameter(value, parameterKey, actor);
  }

  /**
   * Left half of a paired row: {@code [icon][name][value→center]}.
   * @param {Window_Base} window The window to draw into.
   * @param {number} halfX The left edge of this half-column.
   * @param {number} y The y coordinate.
   * @param {number} innerRight The inner edge where values meet the center divider.
   * @param {CmsParameter} parameter The parameter being rendered.
   * @param {CmsParameter|null} nextParameter The projected value to compare against, if any.
   */
  static drawParameterLeft(window, halfX, y, innerRight, parameter, nextParameter = null)
  {
    // clear text color modifiers.
    window.resetFontSettings();

    // draw the icon on the outer edge of this half-column.
    window.drawIcon(parameter.iconIndex, halfX, y);

    // reduce the font size a bit.
    window.makeFontSmaller();

    const iconPad = ImageManager.iconWidth + 4;
    const gap = ParameterCatalogRenderer.CATALOG_NAME_VALUE_GAP;
    const rowSpan = innerRight - halfX;
    const nameX = halfX + iconPad;
    const display = ParameterCatalogRenderer.resolveCatalogDisplay(parameter, nextParameter);
    const valuePixelWidth = display.withPadding
      ? ParameterCatalogRenderer.styledValuePixelWidth(window, display.text)
      : window.textWidth(display.text);
    const nameWidth = Math.max(0, rowSpan - iconPad - valuePixelWidth - gap);

    // name fills the middle; value hugs the inner edge toward the center divider.
    window.drawText(`${parameter.name}`, nameX, y, nameWidth, 'left');
    ParameterCatalogRenderer.drawCatalogParameterValue(window, halfX, y, rowSpan, parameter, 'right', nextParameter);

    // clear text color modifiers.
    window.resetFontSettings();
  }

  /**
   * Right half of a paired row: {@code [value←center][name][icon]} (mirrored zigzag).
   * @param {Window_Base} window The window to draw into.
   * @param {number} halfX The left (inner) edge of this half-column.
   * @param {number} y The y coordinate.
   * @param {number} outerRight The outer edge of the section (includes underline bleed).
   * @param {CmsParameter} parameter The parameter being rendered.
   * @param {CmsParameter|null} nextParameter The projected value to compare against, if any.
   */
  static drawParameterRight(window, halfX, y, outerRight, parameter, nextParameter = null)
  {
    // clear text color modifiers.
    window.resetFontSettings();

    // reduce the font size a bit.
    window.makeFontSmaller();

    const gap = ParameterCatalogRenderer.CATALOG_NAME_VALUE_GAP;
    const iconX = outerRight - ImageManager.iconWidth;
    const display = ParameterCatalogRenderer.resolveCatalogDisplay(parameter, nextParameter);
    const definition = ParameterRegistry.get(parameter.parameterKey);
    // a comparison in progress always renders as a plain "current → next" string, never a sentinel.
    const isSentinel = (nextParameter === null) && definition && (definition.resolveDisplaySentinel(parameter.value) !== null);
    const layoutWidth = ParameterCatalogRenderer.catalogValueRightLayoutWidth(window, display.text, display.withPadding, isSentinel);
    const valueDrawX = ParameterCatalogRenderer.catalogValueRightDrawX(window, halfX, display.text, display.withPadding, isSentinel);
    const valueDrawWidth = ParameterCatalogRenderer.catalogValueRightMeasureWidth(window, display.text, display.withPadding, isSentinel);
    const nameX = halfX + layoutWidth + gap;
    const nameWidth = Math.max(0, iconX - nameX - gap);

    // signed percents stay at the divider; flats and sentinels indent one column to match them.
    ParameterCatalogRenderer.drawCatalogParameterValue(window, valueDrawX, y, valueDrawWidth, parameter, 'left', nextParameter);
    window.resetTextColor();
    window.resetFontFormatting();
    window.drawText(`${parameter.name}`, nameX, y, nameWidth, 'right');
    window.drawIcon(parameter.iconIndex, iconX, y);

    // clear text color modifiers.
    window.resetFontSettings();
  }

  /**
   * Draws all parameters for a group in two-column pairs.
   * @param {Window_Base} window The window to draw into.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   * @param {number} sectionWidth The width of the section.
   * @param {ParameterDefinition[]} definitions The catalog entries for this group.
   * @param {Game_Battler} actor The battler whose current values are shown.
   * @param {Game_Battler|null} tempActor The battler whose projected values are compared, if any.
   */
  static drawGroupParameters(window, x, y, sectionWidth, definitions, actor, tempActor = null)
  {
    const lh = window.lineHeight();
    const dividerX = ParameterCatalogRenderer.centerDividerX(x, sectionWidth);
    const pairGap = ParameterCatalogRenderer.CATALOG_PAIR_GAP;
    const leftInnerRight = dividerX - Math.floor(pairGap / 2);
    const rightHalfX = dividerX + Math.ceil(pairGap / 2);
    const rowRight = ParameterCatalogRenderer.catalogRowRight(x, sectionWidth);

    definitions.forEach((definition, index) =>
    {
      const row = Math.floor(index / 2) + 1;
      const rowY = y + (lh * row);
      const parameter = ParameterCatalogRenderer.makeParameter(actor, definition.key);
      const nextParameter = tempActor
        ? ParameterCatalogRenderer.makeParameter(tempActor, definition.key)
        : null;

      if (index % 2 === 0)
      {
        ParameterCatalogRenderer.drawParameterLeft(window, x, rowY, leftInnerRight, parameter, nextParameter);
      }
      else
      {
        ParameterCatalogRenderer.drawParameterRight(window, rightHalfX, rowY, rowRight, parameter, nextParameter);
      }
    });
  }

  /**
   * Draws a T separator by using a horizontal and vertical line.
   * The length of these lines is defined by the section width and the number of lines.
   * @param {Window_Base} window The window to draw into.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   * @param {number} w The width of the T separator.
   * @param {number=} lines The height of the T separator, multiplied by `lineHeight`; defaults to 1 line.
   */
  static drawTSeparator(window, x, y, w, lines = 1)
  {
    // shorthand the line height.
    const lh = window.lineHeight();

    // define the first row's y coordinate.
    const firstRowY = y + (lh * 1);

    // separate the title from the parameters, for visual effect.
    window.drawHorizontalLine(x, firstRowY - 4, w + ParameterCatalogRenderer.COLUMN_LINE_BLEED, 3);

    // define the right column's x coordinate.
    const secondColumnX = x + (w / 2) + 12;

    // define the x coordinate for the vertical line.
    const verticalLineX = secondColumnX - 4;

    // define the height in pixels for the vertical line.
    const verticalLineHeight = (lh * lines) + 4;

    // separate the two columns of parameters, for visual effect.
    window.drawVerticalLine(verticalLineX, firstRowY - 2, verticalLineHeight, 3);
  }

  /**
   * Draws one catalog group section and returns the vertical space consumed.
   * @param {Window_Base} window The window to draw into.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   * @param {string} groupId The {@link ParameterGroups} id.
   * @param {number} sectionWidth The width of the section.
   * @param {Game_Battler} actor The battler whose current values are shown.
   * @param {Game_Battler|null} tempActor The battler whose projected values are compared, if any.
   * @returns {number}
   */
  static drawParameterGroup(window, x, y, groupId, sectionWidth, actor, tempActor = null)
  {
    const chrome = ParameterCatalogRenderer.GROUP_CHROME[groupId];
    const definitions = ParameterRegistry.byGroup(groupId);

    if (!chrome || !definitions.length)
    {
      return 0;
    }

    const rowCount = Math.ceil(definitions.length / 2);
    const titleY = y - 15;
    const rowBaseY = y + 8;

    // draw the section title and separator.
    ParameterCatalogRenderer.drawTitle(window, chrome.title, x, titleY, chrome.iconIndex, chrome.colorIndex);
    ParameterCatalogRenderer.drawTSeparator(window, x, rowBaseY - 2, sectionWidth, rowCount);

    // draw each registered parameter in left/right pairs.
    ParameterCatalogRenderer.drawGroupParameters(window, x, rowBaseY, sectionWidth, definitions, actor, tempActor);

    // title block + separator + parameter rows.
    return 36 + (rowCount * window.lineHeight()) + 8;
  }

  /**
   * Draws the title of one of the sections for parameters.
   * @param {Window_Base} window The window to draw into.
   * @param {string} text The text to write as the title.
   * @param {number} x The `x` coordinate.
   * @param {number} y The `y` coordinate.
   * @param {number=} iconIndex The icon index for this parameter; defaults to none(0).
   * @param {number=} colorIndex The color index for the title; defaults to system color(1).
   * @param {string=} alignment The text-alignment value of the title; defaults to "center".
   * @param {number=} sectionWidth The width available for the title row.
   */
  static drawTitle(window, text, x, y, iconIndex = 0, colorIndex = 1, alignment = "center", sectionWidth = 350)
  {
    // clear any font modifications.
    window.resetFontSettings();

    // draw the icon of the title.
    window.drawIcon(iconIndex, x, y + 16);

    // swap the color over to the title color.
    window.changeTextColor(ColorManager.textColor(colorIndex));

    // upsize the title!
    window.makeFontBigger();

    // draw the title itself.
    window.drawText(text, x + 32, y + 16, sectionWidth - 32, alignment);

    // clear our font modifications because we're good tech citizens.
    window.resetFontSettings();
  }
}

export default ParameterCatalogRenderer;
//endregion ParameterCatalogRenderer
