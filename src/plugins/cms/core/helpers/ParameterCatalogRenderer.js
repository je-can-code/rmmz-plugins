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
    fate: {
      title: 'Fate',
      iconIndex: 1619,
      colorIndex: 27,
    },
    support: {
      title: 'Support',
      iconIndex: 86,
      colorIndex: 14,
    },
  };

  /**
   * Catalog group ids per visual row band (left column, then middle column).
   *
   * Three bands, all paired. There used to be a fourth holding `support` alone, with the two movement
   * stats above it in a `mobility` group titled "Haste" - two groups of two, stacked, where one group
   * of four says the same thing. Merging them frees the whole bottom band, which is where the elemental
   * and ailment affiliations now go.
   * @type {Array<[string, string]>}
   */
  static PAGE_GROUP_ROW_GROUPS = [
    [ 'combat', 'vitality' ],
    [ 'precision', 'defensive' ],
    [ 'support', 'fate' ],
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
   * Computes equal-width two-column layout spanning the full inner width. Unlike
   * {@link #computeThreeColumnLayout}, this reserves no third column for elements/ailments — for
   * consumers (like the equip comparison panel) that have nothing to put there, splitting into two
   * wider columns instead gives every parameter name and value room to breathe.
   * @param {Window_Base} window The window driving the layout.
   * @returns {{ edgePad: number, gap: number, columnWidth: number, leftX: number, middleX: number }|null}
   */
  static computeTwoColumnLayout(window)
  {
    const edgePad = 8;
    const usable = window.innerWidth - (edgePad * 2);
    const gap = ParameterCatalogRenderer.COLUMN_LINE_BLEED + ParameterCatalogRenderer.COLUMN_CLEAR_GAP;
    const minColumnWidth = 200;
    const columnWidth = Math.floor((usable - gap) / 2);

    if (columnWidth < minColumnWidth)
    {
      return null;
    }

    const leftX = edgePad;
    const middleX = leftX + columnWidth + gap;

    return {
      edgePad,
      gap,
      columnWidth,
      leftX,
      middleX,
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
   * Resolves what text/color a catalog value slot should render. When `nextParameter` is supplied
   * and its value differs from `parameter`, this collapses "current → projected" into a single
   * colored string instead of the padded single-value display — that's the whole reason equip's
   * comparison panel can share this renderer with the plain status page instead of duplicating it.
   *
   * `color` is always a ready-to-draw CSS color string. It is kept separate from `colorIndex`
   * (a raw palette index, only meaningful in the non-diff/padded-value path) because
   * {@link ColorManager#paramchangeTextColor} — used for the diff path — already returns a resolved
   * CSS string rather than a palette index; feeding that back through {@link ColorManager#textColor}
   * a second time throws, since that call expects a number.
   * @param {CmsParameter} parameter The parameter's current value.
   * @param {CmsParameter|null} nextParameter The parameter's projected value, if comparing.
   * @returns {{text: string, colorIndex: number, color: string, bold: boolean, withPadding: boolean}}
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
        color: ColorManager.textColor(parameter.colorIndex),
        bold: parameter.colorIndex !== 0,
        withPadding,
      };
    }

    const diffValue = nextParameter.value - parameter.value;

    // color alone carries direction now (no arrow glyph) — but "good"/"bad" still depends on the
    // parameter's policy; cost/damage-rate params are lower-is-better, so a decrease there needs to
    // read green, not red. Flip the sign fed into the color lookup for those.
    const definition = ParameterRegistry.get(parameter.parameterKey);
    const colorDiff = (definition && definition.isIncreaseBeneficial() === false)
      ? -diffValue
      : diffValue;

    // show only the projected value instead of "current → next" — a compound string doubles the
    // width of long formats (regen rates, percents), which crowds out the icon/name on rows that
    // are already the ones meant to stand out. The magnitude of the change is still worth
    // surfacing though, since the old value is otherwise gone from view entirely — append it as a
    // signed "(+diff)"/"(-diff)" using the same unit conventions.
    const deltaText = definition
      ? definition.prettyDelta(diffValue, parameter.actor)
      : String.empty;

    return {
      text: `${nextParameter.prettyValue()}${deltaText ? ` (${deltaText})` : String.empty}`,
      colorIndex: 0,
      color: ColorManager.paramchangeTextColor(colorDiff),
      bold: true,
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

    if (display.bold)
    {
      window.contents.fontBold = true;
    }

    window.changeTextColor(display.color);
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

      // while comparing against a candidate, fade every stat that isn't actually changing so the
      // handful that are stand out instead of competing for attention with the whole catalog.
      const isComparing = tempActor !== null;
      const isUnchanged = (nextParameter === null) || (nextParameter.value === parameter.value);
      window.changePaintOpacity(!(isComparing && isUnchanged));

      if (index % 2 === 0)
      {
        ParameterCatalogRenderer.drawParameterLeft(window, x, rowY, leftInnerRight, parameter, nextParameter);
      }
      else
      {
        ParameterCatalogRenderer.drawParameterRight(window, rightHalfX, rowY, rowRight, parameter, nextParameter);
      }
    });

    // never leave the window's paint opacity dimmed for whatever draws next (next group's title, etc).
    window.changePaintOpacity(true);
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
  //region affiliations
  /**
   * The size step affiliation rows shrink by, relative to body copy.
   *
   * Smaller than the catalog rows above them, because these are exceptions rather than the standing
   * facts about a battler- an actor with no unusual resistances shows none of them at all.
   * @returns {number}
   */
  static affiliationFontSizeModifier()
  {
    return -6;
  }

  /**
   * The range of state ids treated as ailments worth reporting resistance to.
   *
   * Deliberately a narrow band rather than every state in the database. There are over a thousand, the
   * overwhelming majority of which are passives, affixes, food buffs and other machinery the player
   * never resists. These are the debilitations they actually build against.
   * @returns {[number, number]} The inclusive start and exclusive end of the band.
   */
  static ailmentStateIdRange()
  {
    return [ 4, 18 ];
  }

  /**
   * Y coordinate for the horizontal rule beneath a section title.
   * @param {Window_Base} window The window doing the drawing.
   * @param {number} sectionY The section's content anchor y, same as catalog groups use.
   * @returns {number}
   */
  static affiliationSeparatorY(window, sectionY)
  {
    const rowBaseY = sectionY + 8;
    const firstRowY = (rowBaseY - 2) + window.lineHeight();

    return firstRowY - 4;
  }

  /**
   * Collects element affiliation rows that differ from the 100% baseline.
   *
   * Read through {@link Game_Battler.elementRate} rather than summed from traits, so what the panel
   * claims and what combat actually does cannot disagree- including J-Elementalistics absorption.
   * @param {Game_Actor} actor The actor to inspect.
   * @param {number} limit The number of elements to inspect.
   * @returns {Array<{name: string, value: string, iconIndex: number, colorIndex: number}>}
   */
  static collectElementAffiliationRows(actor, limit = 10)
  {
    /** @type {Array<{name: string, value: string, iconIndex: number, colorIndex: number}>} */
    const rows = [];

    // copy a sub-range without mutating the source array.
    $dataSystem.elements.slice(0, limit)
      .forEach((elementName, index) =>
      {
        const absorbed = J.ELEM && actor.isElementAbsorbed(index);
        const combatRate = actor.elementRate(index);
        const magnitudePercent = Math.round(Math.abs(combatRate) * 100);
        const formatted = AffiliationDisplay.formatDelta(magnitudePercent, {
          absorbed,
          immune: absorbed === false && magnitudePercent <= 0,
        });

        // anything sitting at the baseline is not worth a row of its own.
        if (!formatted) return;

        const name = (elementName === String.empty)
          ? 'Neutral'
          : elementName;

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
   *
   * Read through {@link Game_Battler.stateRate} for the same reason the elements are.
   * @param {Game_Actor} actor The actor to inspect.
   * @returns {Array<{name: string, value: string, iconIndex: number, colorIndex: number}>}
   */
  static collectAilmentAffiliationRows(actor)
  {
    /** @type {Array<{name: string, value: string, iconIndex: number, colorIndex: number}>} */
    const rows = [];

    const [ firstId, lastId ] = this.ailmentStateIdRange();

    // copy a sub-range without mutating the source array.
    $dataStates.slice(firstId, lastId)
      .forEach(state =>
      {
        if (!state) return;

        const immune = actor.isStateResist(state.id);
        const ratePercent = immune
          ? 0
          : Math.round(actor.stateRate(state.id) * 100);
        const formatted = AffiliationDisplay.formatDelta(ratePercent, {
          immune,
        });

        // anything sitting at the baseline is not worth a row of its own.
        if (!formatted) return;

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
   * Draws one affiliation row: icon, name, and the deviation from baseline.
   * @param {Window_Base} window The window doing the drawing.
   * @param {{name: string, value: string, iconIndex: number, colorIndex: number}} row The row to draw.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   * @param {number} sectionWidth The width available for this row.
   */
  static drawAffiliationRow(window, row, x, y, sectionWidth)
  {
    window.resetFontSettings();
    window.modFontSize(this.affiliationFontSizeModifier());

    const modifiedX = x + ImageManager.iconWidth + 4;
    const gap = 8;
    const valuePixelWidth = this.styledValuePixelWidth(window, row.value);
    const nameWidth = Math.max(48, sectionWidth - (modifiedX - x) - valuePixelWidth - gap);

    window.drawIcon(row.iconIndex, x, y);
    window.drawText(`${row.name}`, modifiedX, y, nameWidth, 'left');

    // span the full section so digits hug the inner window edge.
    window.drawStyledPaddedValue(x, y, row.value, sectionWidth, 8, row.colorIndex);

    window.resetFontSettings();
  }

  /**
   * Draws a single placeholder row for a section where every entry sits at the baseline.
   * @param {Window_Base} window The window doing the drawing.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   * @param {number} sectionWidth The width available for this row.
   */
  static drawAffiliationBaselineRow(window, x, y, sectionWidth)
  {
    window.resetFontSettings();
    window.modFontSize(this.affiliationFontSizeModifier());
    window.changeTextColor(ColorManager.textColor(7));
    window.drawText('All standard', x, y, sectionWidth, 'center');
    window.resetFontSettings();
  }

  /**
   * Draws filtered affiliation rows beneath a section header.
   * @param {Window_Base} window The window doing the drawing.
   * @param {number} x The x coordinate.
   * @param {number} y The section anchor y.
   * @param {number} sectionWidth The width available for each row.
   * @param {Array<{name: string, value: string, iconIndex: number, colorIndex: number}>} rows The rows.
   * @returns {number} The y coordinate just below the last visible row.
   */
  static drawAffiliationRows(window, x, y, sectionWidth, rows)
  {
    // a section with nothing unusual to report says so, rather than rendering as a bare heading.
    if (rows.length === 0)
    {
      const rowY = y + window.lineHeight() + 8;
      this.drawAffiliationBaselineRow(window, x, rowY, sectionWidth);

      return rowY + window.lineHeight();
    }

    rows.forEach((row, index) =>
    {
      const rowY = y + ((index + 1) * window.lineHeight()) + 8;
      this.drawAffiliationRow(window, row, x, rowY, sectionWidth);
    });

    return y + ((rows.length + 1) * window.lineHeight()) + 8;
  }

  /**
   * Draws the elemental affiliations section.
   * @param {Window_Base} window The window doing the drawing.
   * @param {Game_Actor} actor The actor to inspect.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   * @param {number} sectionWidth The width of this section.
   * @param {number} limit The number of elements to inspect.
   * @returns {number} The y coordinate just below the last drawn row.
   */
  static drawElementAffiliations(window, actor, x, y, sectionWidth, limit = 10)
  {
    const titleY = y - 15;

    // same chrome rhythm as the catalog groups above.
    this.drawTitle(window, 'Elements', x, titleY, 64, 8, 'center', sectionWidth);
    window.drawHorizontalLine(x, this.affiliationSeparatorY(window, y), sectionWidth, 3);

    return this.drawAffiliationRows(window, x, y, sectionWidth, this.collectElementAffiliationRows(actor, limit));
  }

  /**
   * Draws the ailment affiliations section.
   * @param {Window_Base} window The window doing the drawing.
   * @param {Game_Actor} actor The actor to inspect.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   * @param {number} sectionWidth The width of this section.
   * @returns {number} The y coordinate just below the last drawn row.
   */
  static drawAilmentAffiliations(window, actor, x, y, sectionWidth)
  {
    const titleY = y - 15;

    // same chrome rhythm as the catalog groups above.
    this.drawTitle(window, 'Ailments', x, titleY, 2, 8, 'center', sectionWidth);
    window.drawHorizontalLine(x, this.affiliationSeparatorY(window, y), sectionWidth, 3);

    return this.drawAffiliationRows(window, x, y, sectionWidth, this.collectAilmentAffiliationRows(actor));
  }

  //endregion affiliations
}

export default ParameterCatalogRenderer;
//endregion ParameterCatalogRenderer
