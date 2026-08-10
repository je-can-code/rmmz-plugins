//region plugins/cms/core/helpers/parameter-catalog-renderer.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('ParameterCatalogRenderer (direct src import)', () =>
{
  let ParameterCatalogRenderer;
  let ParameterFormat;
  let fakeDefinition;

  beforeAll(async () =>
  {
    vi.resetModules();

    // String.empty is a J-Base runtime augmentation, always present by the time this file's
    // production code runs in-game; stub it here since this test doesn't boot J-Base itself.
    String.empty = '';

    // `padZero` is vanilla RMMZ's own prototype augmentation from `rmmz_core.js`, which this file
    // does not boot either. The padded affiliation values are built through it.
    Number.prototype.padZero = function(length)
    {
      return String(this)
        .padZero(length);
    };

    String.prototype.padZero = function(length)
    {
      return this.padStart(length, '0');
    };

    // the real format constant is a pure static-only class with no dependencies of its own.
    ({ default: ParameterFormat } = await import('../../../../../src/plugins/_base/core/core/ParameterFormat.js'));
    globalThis.ParameterFormat = ParameterFormat;

    // ParameterCatalogRenderer/CmsParameter only ever call the .get()/.byGroup() surface, so a bare
    // stub of those (rather than the real registry+definition machinery) is enough here.
    globalThis.ParameterRegistry = {
      get: vi.fn(),
      byGroup: vi.fn(),
    };

    globalThis.ColorManager = {
      textColor: vi.fn(index => `color-${index}`),
      paramchangeTextColor: vi.fn(diff => (diff >= 0 ? 'color-good' : 'color-bad')),
    };

    globalThis.ImageManager = { iconWidth: 32 };

    // the real one rather than a stand-in. It depends only on `ParameterDefinition.padSignedMagnitude`,
    // and the whole point of the affiliation rows is which rates are worth a row at all - a stub of
    // `formatDelta` would be a copy of the policy under test rather than a check on it.
    ({ default: globalThis.ParameterDefinition } = await import(
      '../../../../../src/plugins/_base/core/models/ParameterDefinition.js'));
    ({ default: globalThis.AffiliationDisplay } = await import(
      '../../../../../src/plugins/_base/core/core/AffiliationDisplay.js'));

    globalThis.IconManager = { element: vi.fn(index => 1000 + index) };

    ({ default: ParameterCatalogRenderer } =
      await import('../../../../../src/plugins/cms/core/helpers/ParameterCatalogRenderer.js'));
  });

  beforeEach(() =>
  {
    fakeDefinition = {
      label: vi.fn()
        .mockReturnValue('Attack'),
      iconIndex: vi.fn()
        .mockReturnValue(64),
      resolveDisplayColorIndex: vi.fn()
        .mockReturnValue(2),
      resolveDisplaySentinel: vi.fn()
        .mockReturnValue(null),
      prettyValue: vi.fn()
        .mockReturnValue('100'),
      prettyDelta: vi.fn()
        .mockReturnValue('+5'),
      isIncreaseBeneficial: vi.fn()
        .mockReturnValue(true),
      key: 'atk',
      format: ParameterFormat.FLAT,
    };

    globalThis.ParameterRegistry.get.mockReset()
      .mockReturnValue(fakeDefinition);
    globalThis.ParameterRegistry.byGroup.mockReset()
      .mockReturnValue([]);
    globalThis.ColorManager.textColor.mockClear();
    globalThis.ColorManager.paramchangeTextColor.mockClear();
  });

  /**
   * Builds a stubbed drawing surface shaped like the subset of `Window_Base` this renderer touches.
   */
  function makeWindow(overrides = {})
  {
    return {
      innerWidth: 800,
      lineHeight: vi.fn()
        .mockReturnValue(36),
      textWidth: vi.fn(text => text.length * 6),
      drawIcon: vi.fn(),
      drawText: vi.fn(),
      drawStyledPaddedValue: vi.fn(),
      changeTextColor: vi.fn(),
      resetTextColor: vi.fn(),
      resetFontFormatting: vi.fn(),
      resetFontSettings: vi.fn(),
      makeFontSmaller: vi.fn(),
      makeFontBigger: vi.fn(),
      changePaintOpacity: vi.fn(),
      drawHorizontalLine: vi.fn(),
      drawVerticalLine: vi.fn(),
      modFontSize: vi.fn(),
      contents: { fontBold: false },
      ...overrides,
    };
  }

  /**
   * Builds a battler answering the four rate questions the affiliation rows ask it.
   *
   * Every one of them is read through the combat-facing accessor rather than summed from traits, so
   * what the panel claims and what a fight actually does cannot drift apart.
   */
  function makeAffiliationActor(overrides = {})
  {
    return {
      isElementAbsorbed: vi.fn()
        .mockReturnValue(false),
      elementRate: vi.fn()
        .mockReturnValue(1),
      isStateResist: vi.fn()
        .mockReturnValue(false),
      stateRate: vi.fn()
        .mockReturnValue(1),
      ...overrides,
    };
  }

  function makeParameter(overrides = {})
  {
    const actor = { parameter: vi.fn().mockReturnValue(100) };
    return ParameterCatalogRenderer.makeParameter(actor, 'atk', overrides);
  }

  describe('computeThreeColumnLayout', () =>
  {
    it('returns null when the resulting column width would be under the minimum', () =>
    {
      // Arrange
      const window = makeWindow({ innerWidth: 100 });

      // Act
      const layout = ParameterCatalogRenderer.computeThreeColumnLayout(window);

      // Assert
      expect(layout).toBeNull();
    });

    it('computes equal-width three-column layout coordinates', () =>
    {
      // Arrange
      const window = makeWindow({ innerWidth: 1000 });

      // Act
      const layout = ParameterCatalogRenderer.computeThreeColumnLayout(window);

      // Assert
      expect(layout).toEqual({
        edgePad: 8,
        gap: 40,
        columnWidth: 301,
        leftX: 8,
        middleX: 349,
        rightX: 690,
        rightColumnWidth: 310,
      });
    });
  });

  describe('computeTwoColumnLayout', () =>
  {
    it('returns null when the resulting column width would be under the minimum', () =>
    {
      // Arrange
      const window = makeWindow({ innerWidth: 100 });

      // Act
      const layout = ParameterCatalogRenderer.computeTwoColumnLayout(window);

      // Assert
      expect(layout).toBeNull();
    });

    it('computes equal-width two-column layout coordinates', () =>
    {
      // Arrange
      const window = makeWindow({ innerWidth: 1000 });

      // Act
      const layout = ParameterCatalogRenderer.computeTwoColumnLayout(window);

      // Assert
      expect(layout).toEqual({
        edgePad: 8,
        gap: 40,
        columnWidth: 472,
        leftX: 8,
        middleX: 520,
      });
    });
  });

  describe('centerDividerX', () =>
  {
    it('computes the halfway point of the section plus a fixed offset', () =>
    {
      // Arrange/Act
      const result = ParameterCatalogRenderer.centerDividerX(100, 200);

      // Assert
      expect(result).toEqual(208);
    });
  });

  describe('catalogRowRight', () =>
  {
    it('adds the section width to the section x coordinate', () =>
    {
      // Arrange/Act
      const result = ParameterCatalogRenderer.catalogRowRight(100, 200);

      // Assert
      expect(result).toEqual(300);
    });
  });

  describe('catalogValueHasSignColumn', () =>
  {
    it('returns true when the value starts with a space', () =>
    {
      expect(ParameterCatalogRenderer.catalogValueHasSignColumn(' 100')).toBe(true);
    });

    it('returns true when the value starts with a plus', () =>
    {
      expect(ParameterCatalogRenderer.catalogValueHasSignColumn('+100')).toBe(true);
    });

    it('returns true when the value starts with a minus', () =>
    {
      expect(ParameterCatalogRenderer.catalogValueHasSignColumn('-100')).toBe(true);
    });

    it('returns false when the value starts with a digit', () =>
    {
      expect(ParameterCatalogRenderer.catalogValueHasSignColumn('100')).toBe(false);
    });
  });

  describe('catalogValueRightReservesSignColumn', () =>
  {
    it('returns the negated sign-column check when styled padding is active', () =>
    {
      expect(ParameterCatalogRenderer.catalogValueRightReservesSignColumn('100', true, false)).toBe(true);
      expect(ParameterCatalogRenderer.catalogValueRightReservesSignColumn('+100', true, false)).toBe(false);
    });

    it('returns the sentinel flag when styled padding is inactive', () =>
    {
      expect(ParameterCatalogRenderer.catalogValueRightReservesSignColumn('100', false, true)).toBe(true);
      expect(ParameterCatalogRenderer.catalogValueRightReservesSignColumn('100', false, false)).toBe(false);
    });
  });

  describe('styledValuePixelWidth', () =>
  {
    it('multiplies the value length by the width of a single digit glyph', () =>
    {
      // Arrange
      const window = makeWindow();

      // Act
      const width = ParameterCatalogRenderer.styledValuePixelWidth(window, '100');

      // Assert
      expect(width).toEqual(18);
      expect(window.textWidth).toHaveBeenCalledWith('0');
    });
  });

  describe('catalogValueRightMeasureWidth', () =>
  {
    it('uses the styled monospace width when padding is active', () =>
    {
      // Arrange
      const window = makeWindow();

      // Act
      const width = ParameterCatalogRenderer.catalogValueRightMeasureWidth(window, '100', true, false);

      // Assert
      expect(width).toEqual(18);
    });

    it('uses the styled monospace width when the value is a sentinel', () =>
    {
      // Arrange
      const window = makeWindow();

      // Act
      const width = ParameterCatalogRenderer.catalogValueRightMeasureWidth(window, 'FREE', false, true);

      // Assert
      expect(width).toEqual(24);
    });

    it('measures the raw text width when neither padded nor a sentinel', () =>
    {
      // Arrange
      const window = makeWindow();

      // Act
      const width = ParameterCatalogRenderer.catalogValueRightMeasureWidth(window, '100', false, false);

      // Assert
      expect(width).toEqual(18);
      expect(window.textWidth).toHaveBeenCalledWith('100');
    });
  });

  describe('catalogValueRightLayoutWidth', () =>
  {
    it('adds a digit column of width when the sign column is reserved', () =>
    {
      // Arrange
      const window = makeWindow();

      // Act
      const width = ParameterCatalogRenderer.catalogValueRightLayoutWidth(window, '100', false, true);

      // Assert
      // measureWidth (18, styled since sentinel) + one extra digit column (6).
      expect(width).toEqual(24);
    });

    it('does not add a digit column when the sign column is not reserved', () =>
    {
      // Arrange
      const window = makeWindow();

      // Act
      const width = ParameterCatalogRenderer.catalogValueRightLayoutWidth(window, '+100', false, false);

      // Assert
      expect(width).toEqual(24);
    });
  });

  describe('catalogValueRightDrawX', () =>
  {
    it('offsets past the sign column when reserved', () =>
    {
      // Arrange
      const window = makeWindow();

      // Act
      const x = ParameterCatalogRenderer.catalogValueRightDrawX(window, 100, '100', false, true);

      // Assert
      expect(x).toEqual(106);
    });

    it('draws flush against halfX when the sign column is not reserved', () =>
    {
      // Arrange
      const window = makeWindow();

      // Act
      const x = ParameterCatalogRenderer.catalogValueRightDrawX(window, 100, '+100', false, false);

      // Assert
      expect(x).toEqual(100);
    });
  });

  describe('resolveCatalogDisplay', () =>
  {
    it('renders the plain padded value when there is no projected comparison', () =>
    {
      // Arrange
      const parameter = makeParameter();

      // Act
      const display = ParameterCatalogRenderer.resolveCatalogDisplay(parameter, null);

      // Assert
      expect(display.text).toEqual('100');
      expect(display.colorIndex).toEqual(2);
      expect(display.color).toEqual('color-2');
      expect(display.bold).toBe(true);
      expect(display.withPadding).toBe(true);
    });

    it('renders unbolded when the resolved colorIndex is 0', () =>
    {
      // Arrange
      fakeDefinition.resolveDisplayColorIndex.mockReturnValue(0);
      const parameter = makeParameter();

      // Act
      const display = ParameterCatalogRenderer.resolveCatalogDisplay(parameter, null);

      // Assert
      expect(display.bold).toBe(false);
    });

    it('renders the plain value when the projected value matches the current value', () =>
    {
      // Arrange
      const parameter = makeParameter();
      const nextParameter = makeParameter();

      // Act
      const display = ParameterCatalogRenderer.resolveCatalogDisplay(parameter, nextParameter);

      // Assert
      expect(display.withPadding).toBe(true);
    });

    it('renders a "current -> projected" comparison with a delta suffix when values differ and the increase is beneficial', () =>
    {
      // Arrange
      const parameter = makeParameter();
      const actor = { parameter: vi.fn().mockReturnValue(120) };
      const nextParameter = ParameterCatalogRenderer.makeParameter(actor, 'atk');
      fakeDefinition.prettyValue.mockReturnValue('120');

      // Act
      const display = ParameterCatalogRenderer.resolveCatalogDisplay(parameter, nextParameter);

      // Assert
      expect(display.text).toEqual('120 (+5)');
      expect(display.colorIndex).toEqual(0);
      expect(display.bold).toBe(true);
      expect(display.withPadding).toBe(false);
      expect(globalThis.ColorManager.paramchangeTextColor).toHaveBeenCalledWith(20);
    });

    it('flips the color-lookup sign when a decrease is the beneficial direction', () =>
    {
      // Arrange
      fakeDefinition.isIncreaseBeneficial.mockReturnValue(false);
      const parameter = makeParameter();
      const actor = { parameter: vi.fn().mockReturnValue(120) };
      const nextParameter = ParameterCatalogRenderer.makeParameter(actor, 'atk');

      // Act
      ParameterCatalogRenderer.resolveCatalogDisplay(parameter, nextParameter);

      // Assert
      expect(globalThis.ColorManager.paramchangeTextColor).toHaveBeenCalledWith(-20);
    });

    it('omits the delta parenthetical when the definition has no delta text', () =>
    {
      // Arrange
      fakeDefinition.prettyDelta.mockReturnValue(String.empty);
      const parameter = makeParameter();
      const actor = { parameter: vi.fn().mockReturnValue(120) };
      const nextParameter = ParameterCatalogRenderer.makeParameter(actor, 'atk');
      fakeDefinition.prettyValue.mockReturnValue('120');

      // Act
      const display = ParameterCatalogRenderer.resolveCatalogDisplay(parameter, nextParameter);

      // Assert
      expect(display.text).toEqual('120');
    });

    it('omits the delta parenthetical and skips the direction flip when the registry has no definition', () =>
    {
      // Arrange
      const parameter = makeParameter();
      const actor = { parameter: vi.fn().mockReturnValue(120) };
      const nextParameter = ParameterCatalogRenderer.makeParameter(actor, 'atk');
      globalThis.ParameterRegistry.get.mockReturnValue(null);
      fakeDefinition.prettyValue.mockReturnValue('120');

      // Act
      const display = ParameterCatalogRenderer.resolveCatalogDisplay(parameter, nextParameter);

      // Assert
      expect(display.text).toEqual('120');
      expect(globalThis.ColorManager.paramchangeTextColor).toHaveBeenCalledWith(20);
    });
  });

  describe('drawCatalogParameterValue', () =>
  {
    it('draws through the styled padded value helper when withPadding is set', () =>
    {
      // Arrange
      const window = makeWindow();
      const parameter = makeParameter();

      // Act
      ParameterCatalogRenderer.drawCatalogParameterValue(window, 10, 20, 100, parameter, 'right', null);

      // Assert
      expect(window.drawStyledPaddedValue).toHaveBeenCalledWith(10, 20, '100', 100, 8, 2, 'right');
      expect(window.drawText).not.toHaveBeenCalled();
    });

    it('draws bold colored text and resets formatting when not padded and bold', () =>
    {
      // Arrange
      const window = makeWindow();
      const parameter = makeParameter();
      const actor = { parameter: vi.fn().mockReturnValue(120) };
      const nextParameter = ParameterCatalogRenderer.makeParameter(actor, 'atk');
      fakeDefinition.prettyValue.mockReturnValue('120');

      // Act
      ParameterCatalogRenderer.drawCatalogParameterValue(window, 10, 20, 100, parameter, 'left', nextParameter);

      // Assert
      expect(window.contents.fontBold).toBe(true);
      expect(window.changeTextColor).toHaveBeenCalledWith('color-good');
      expect(window.drawText).toHaveBeenCalledWith('120 (+5)', 10, 20, 100, 'left');
      expect(window.resetTextColor).toHaveBeenCalled();
      expect(window.resetFontFormatting).toHaveBeenCalled();
    });

    it('draws plain colored text without bolding when the display is not bold', () =>
    {
      // Arrange
      // REGEN_PER_SECOND format makes usesStyledValue() false so drawText (not the padded helper) runs.
      fakeDefinition.format = ParameterFormat.REGEN_PER_SECOND;
      fakeDefinition.resolveDisplayColorIndex.mockReturnValue(0);
      const window = makeWindow();
      const parameter = makeParameter();

      // Act
      ParameterCatalogRenderer.drawCatalogParameterValue(window, 10, 20, 100, parameter, 'left', null);

      // Assert
      expect(window.contents.fontBold).toBe(false);
      expect(window.drawText).toHaveBeenCalledWith('100', 10, 20, 100, 'left');
    });
  });

  describe('makeParameter', () =>
  {
    it('pulls the live value from the actor and wraps it in a CmsParameter', () =>
    {
      // Arrange
      const actor = { parameter: vi.fn().mockReturnValue(42) };

      // Act
      const parameter = ParameterCatalogRenderer.makeParameter(actor, 'atk');

      // Assert
      expect(actor.parameter).toHaveBeenCalledWith('atk');
      expect(parameter.value).toEqual(42);
      expect(parameter.parameterKey).toEqual('atk');
      expect(parameter.actor).toBe(actor);
    });
  });

  describe('drawParameterLeft', () =>
  {
    it('draws the icon, name, and value within the left half-column', () =>
    {
      // Arrange
      const window = makeWindow();
      const parameter = makeParameter();

      // Act
      ParameterCatalogRenderer.drawParameterLeft(window, 0, 100, 300, parameter, null);

      // Assert
      expect(window.drawIcon).toHaveBeenCalledWith(64, 0, 100);
      expect(window.makeFontSmaller).toHaveBeenCalled();
      expect(window.drawText).toHaveBeenCalledWith('Attack', expect.any(Number), 100, expect.any(Number), 'left');
      expect(window.drawStyledPaddedValue).toHaveBeenCalled();
      expect(window.resetFontSettings).toHaveBeenCalledTimes(2);
    });
  });

  describe('drawParameterRight', () =>
  {
    it('draws the value, name, and icon within the right half-column (mirrored)', () =>
    {
      // Arrange
      const window = makeWindow();
      const parameter = makeParameter();

      // Act
      ParameterCatalogRenderer.drawParameterRight(window, 200, 100, 400, parameter, null);

      // Assert
      expect(window.drawIcon).toHaveBeenCalledWith(64, 400 - 32, 100);
      expect(window.drawText).toHaveBeenCalledWith('Attack', expect.any(Number), 100, expect.any(Number), 'right');
      expect(window.drawStyledPaddedValue).toHaveBeenCalled();
    });

    it('treats a clamped sentinel value as reserving the sign column when not comparing', () =>
    {
      // Arrange
      fakeDefinition.resolveDisplaySentinel.mockReturnValue('FREE');
      const window = makeWindow();
      const parameter = makeParameter();

      // Act
      ParameterCatalogRenderer.drawParameterRight(window, 200, 100, 400, parameter, null);

      // Assert
      expect(window.drawText).toHaveBeenCalled();
    });
  });

  describe('drawGroupParameters', () =>
  {
    it('draws each definition alternating between left and right halves', () =>
    {
      // Arrange
      const window = makeWindow();
      const actor = { parameter: vi.fn().mockReturnValue(10) };
      const definitions = [ { key: 'atk' }, { key: 'atk' }, { key: 'atk' } ];

      // Act
      ParameterCatalogRenderer.drawGroupParameters(window, 0, 0, 300, definitions, actor, null);

      // Assert
      // 3 rows: left, right, left - each draws one icon.
      expect(window.drawIcon).toHaveBeenCalledTimes(3);
      expect(window.changePaintOpacity).toHaveBeenLastCalledWith(true);
    });

    it('fades rows that are unchanged while comparing against a candidate actor', () =>
    {
      // Arrange
      const window = makeWindow();
      const actor = { parameter: vi.fn().mockReturnValue(10) };
      const tempActor = { parameter: vi.fn().mockReturnValue(10) };
      const definitions = [ { key: 'atk' } ];

      // Act
      ParameterCatalogRenderer.drawGroupParameters(window, 0, 0, 300, definitions, actor, tempActor);

      // Assert
      expect(window.changePaintOpacity).toHaveBeenCalledWith(false);
      expect(window.changePaintOpacity).toHaveBeenLastCalledWith(true);
    });

    it('keeps full opacity for rows that are actually changing while comparing', () =>
    {
      // Arrange
      const window = makeWindow();
      const actor = { parameter: vi.fn().mockReturnValue(10) };
      const tempActor = { parameter: vi.fn().mockReturnValue(20) };
      const definitions = [ { key: 'atk' } ];

      // Act
      ParameterCatalogRenderer.drawGroupParameters(window, 0, 0, 300, definitions, actor, tempActor);

      // Assert
      expect(window.changePaintOpacity).toHaveBeenCalledWith(true);
    });
  });

  describe('drawTSeparator', () =>
  {
    it('draws a horizontal rule and a vertical divider using the default single-row height', () =>
    {
      // Arrange
      const window = makeWindow();

      // Act
      ParameterCatalogRenderer.drawTSeparator(window, 0, 0, 300);

      // Assert
      expect(window.drawHorizontalLine).toHaveBeenCalledWith(0, 32, 316, 3);
      expect(window.drawVerticalLine).toHaveBeenCalledWith(158, 34, 40, 3);
    });

    it('scales the vertical divider height by the given number of lines', () =>
    {
      // Arrange
      const window = makeWindow();

      // Act
      ParameterCatalogRenderer.drawTSeparator(window, 0, 0, 300, 2);

      // Assert
      expect(window.drawVerticalLine).toHaveBeenCalledWith(158, 34, 76, 3);
    });
  });

  describe('drawParameterGroup', () =>
  {
    it('returns 0 and draws nothing when the group has no chrome entry', () =>
    {
      // Arrange
      const window = makeWindow();
      globalThis.ParameterRegistry.byGroup.mockReturnValue([ { key: 'atk' } ]);

      // Act
      const consumed = ParameterCatalogRenderer.drawParameterGroup(window, 0, 0, 'not-a-group', 300, {});

      // Assert
      expect(consumed).toEqual(0);
      expect(window.drawText).not.toHaveBeenCalled();
    });

    it('returns 0 and draws nothing when the group has no registered definitions', () =>
    {
      // Arrange
      const window = makeWindow();
      globalThis.ParameterRegistry.byGroup.mockReturnValue([]);

      // Act
      const consumed = ParameterCatalogRenderer.drawParameterGroup(window, 0, 0, 'combat', 300, {});

      // Assert
      expect(consumed).toEqual(0);
      expect(window.drawText).not.toHaveBeenCalled();
    });

    it('draws the section title, separator, and parameter rows, returning the consumed height', () =>
    {
      // Arrange
      const window = makeWindow();
      const actor = { parameter: vi.fn().mockReturnValue(10) };
      globalThis.ParameterRegistry.byGroup.mockReturnValue([ { key: 'atk' }, { key: 'atk' } ]);

      // Act
      const consumed = ParameterCatalogRenderer.drawParameterGroup(window, 0, 0, 'combat', 300, actor);

      // Assert
      // title block + separator + (1 row * lineHeight 36) + 8.
      expect(consumed).toEqual(36 + 36 + 8);
      expect(window.drawHorizontalLine).toHaveBeenCalled();
      expect(window.drawIcon).toHaveBeenCalled();
    });
  });

  describe('drawTitle', () =>
  {
    it('draws the icon and centered title text with default alignment/width', () =>
    {
      // Arrange
      const window = makeWindow();

      // Act
      ParameterCatalogRenderer.drawTitle(window, 'Combat', 10, 20, 76, 10);

      // Assert
      expect(window.drawIcon).toHaveBeenCalledWith(76, 10, 36);
      expect(window.changeTextColor).toHaveBeenCalledWith('color-10');
      expect(window.makeFontBigger).toHaveBeenCalled();
      expect(window.drawText).toHaveBeenCalledWith('Combat', 42, 36, 318, 'center');
      expect(window.resetFontSettings).toHaveBeenCalledTimes(2);
    });

    it('honors an explicit alignment and section width', () =>
    {
      // Arrange
      const window = makeWindow();

      // Act
      ParameterCatalogRenderer.drawTitle(window, 'Combat', 10, 20, 0, 1, 'left', 200);

      // Assert
      expect(window.drawText).toHaveBeenCalledWith('Combat', 42, 36, 168, 'left');
    });
  });

  //region affiliations
  describe('affiliation rows', () =>
  {
    beforeEach(() =>
    {
      // index zero is the engine's own unnamed element, which the rows rename rather than skip.
      globalThis.$dataSystem = {
        elements: [ '', 'Fire', 'Ice', 'Thunder' ],
      };

      // index zero is always null in an RMMZ database table, and the band the rows read starts at 4.
      globalThis.$dataStates = [
        null, null, null, null,
        {
          id: 4,
          name: 'Poison',
          iconIndex: 20,
        },
        {
          id: 5,
          name: 'Blind',
          iconIndex: 21,
        },
        {
          id: 6,
          name: 'Silence',
          iconIndex: 22,
        },
      ];

      // the namespace exists in every running game; whether the elementalistics extension is one of
      // its members is the branch that actually varies.
      globalThis.J = {};
    });

    describe('affiliationFontSizeModifier', () =>
    {
      it('shrinks affiliation rows relative to the catalog rows above them', () =>
      {
        // Arrange
        // Act
        const modifier = ParameterCatalogRenderer.affiliationFontSizeModifier();

        // Assert: these are exceptions rather than standing facts, so they read smaller than the
        // parameters they sit beneath.
        expect(modifier).toEqual(-6);
      });
    });

    describe('ailmentStateIdRange', () =>
    {
      it('reports a narrow band rather than every state in the database', () =>
      {
        // Arrange
        // Act
        const [ firstId, lastId ] = ParameterCatalogRenderer.ailmentStateIdRange();

        // Assert: the database holds over a thousand states, almost all of them passives, affixes and
        // food buffs the player never resists.
        expect(firstId).toEqual(4);
        expect(lastId).toEqual(18);
      });
    });

    describe('affiliationSeparatorY', () =>
    {
      it('places the rule one line below the section anchor, matching the catalog groups', () =>
      {
        // Arrange
        const window = makeWindow();

        // Act
        const y = ParameterCatalogRenderer.affiliationSeparatorY(window, 100);

        // Assert
        expect(y).toEqual(100 + 8 - 2 + 36 - 4);
      });
    });

    describe('collectElementAffiliationRows', () =>
    {
      it('omits an element sitting at the baseline, which is not worth a row of its own', () =>
      {
        // Arrange
        const actor = makeAffiliationActor();

        // Act
        const rows = ParameterCatalogRenderer.collectElementAffiliationRows(actor);

        // Assert
        expect(rows).toEqual([]);
      });

      it('reports a weakness as a positive deviation from the baseline', () =>
      {
        // Arrange
        const actor = makeAffiliationActor({
          elementRate: vi.fn(index => (index === 1 ? 2 : 1)),
        });

        // Act
        const rows = ParameterCatalogRenderer.collectElementAffiliationRows(actor);

        // Assert
        expect(rows.length).toEqual(1);
        expect(rows[0].name).toEqual('Fire');
        expect(rows[0].value).toContain('+');
        expect(rows[0].iconIndex).toEqual(1001);
      });

      it('reports a resistance as a negative deviation from the baseline', () =>
      {
        // Arrange
        const actor = makeAffiliationActor({
          elementRate: vi.fn(index => (index === 2 ? 0.5 : 1)),
        });

        // Act
        const rows = ParameterCatalogRenderer.collectElementAffiliationRows(actor);

        // Assert
        expect(rows[0].name).toEqual('Ice');
        expect(rows[0].value).toContain('-');
      });

      it('reports a nulled element as immunity rather than a hundred percent reduction', () =>
      {
        // Arrange
        const actor = makeAffiliationActor({
          elementRate: vi.fn(index => (index === 3 ? 0 : 1)),
        });

        // Act
        const rows = ParameterCatalogRenderer.collectElementAffiliationRows(actor);

        // Assert
        expect(rows[0].name).toEqual('Thunder');
        expect(rows[0].value).toEqual('IMMUNE');
      });

      it('names the engine\'s unnamed element rather than drawing a row with no label', () =>
      {
        // Arrange
        const actor = makeAffiliationActor({
          elementRate: vi.fn(index => (index === 0 ? 1.5 : 1)),
        });

        // Act
        const rows = ParameterCatalogRenderer.collectElementAffiliationRows(actor);

        // Assert
        expect(rows[0].name).toEqual('Neutral');
      });

      it('never asks about absorption when the elementalistics extension is not installed', () =>
      {
        // Arrange: core must not probe for an extension's behavior, and the namespace check is the one
        // sanctioned way to ask whether the extension is even present.
        const actor = makeAffiliationActor({
          elementRate: vi.fn(index => (index === 1 ? 2 : 1)),
        });

        // Act
        const rows = ParameterCatalogRenderer.collectElementAffiliationRows(actor);

        // Assert
        expect(actor.isElementAbsorbed).not.toHaveBeenCalled();
        expect(rows[0].value).toContain('+');
      });

      it('reports absorption when the elementalistics extension says an element heals', () =>
      {
        // Arrange
        globalThis.J.ELEM = {};
        const actor = makeAffiliationActor({
          isElementAbsorbed: vi.fn(index => index === 1),
          elementRate: vi.fn(index => (index === 1 ? -1 : 1)),
        });

        // Act
        const rows = ParameterCatalogRenderer.collectElementAffiliationRows(actor);

        // Assert
        expect(rows.length).toEqual(1);
        expect(rows[0].value).toContain('ABSORB');
      });

      it('inspects only as many elements as it was asked to', () =>
      {
        // Arrange
        const actor = makeAffiliationActor({
          elementRate: vi.fn(index => (index === 3 ? 2 : 1)),
        });

        // Act
        const rows = ParameterCatalogRenderer.collectElementAffiliationRows(actor, 2);

        // Assert
        expect(rows).toEqual([]);
      });
    });

    describe('collectAilmentAffiliationRows', () =>
    {
      it('omits an ailment sitting at the baseline', () =>
      {
        // Arrange
        const actor = makeAffiliationActor();

        // Act
        const rows = ParameterCatalogRenderer.collectAilmentAffiliationRows(actor);

        // Assert
        expect(rows).toEqual([]);
      });

      it('reports a partial resistance as a deviation from the baseline', () =>
      {
        // Arrange
        const actor = makeAffiliationActor({
          stateRate: vi.fn(id => (id === 4 ? 0.75 : 1)),
        });

        // Act
        const rows = ParameterCatalogRenderer.collectAilmentAffiliationRows(actor);

        // Assert
        expect(rows.length).toEqual(1);
        expect(rows[0].name).toEqual('Poison');
        expect(rows[0].iconIndex).toEqual(20);
        expect(rows[0].value).toContain('-');
      });

      it('reports a full resistance as immunity without consulting the rate at all', () =>
      {
        // Arrange
        const actor = makeAffiliationActor({
          isStateResist: vi.fn(id => id === 5),
        });

        // Act
        const rows = ParameterCatalogRenderer.collectAilmentAffiliationRows(actor);

        // Assert
        expect(rows.length).toEqual(1);
        expect(rows[0].name).toEqual('Blind');
        expect(rows[0].value).toEqual('IMMUNE');
      });

      it('steps over the empty slots a database table carries', () =>
      {
        // Arrange: the band starts at 4, but a project is free to leave holes inside it.
        globalThis.$dataStates[6] = null;
        const actor = makeAffiliationActor({
          stateRate: vi.fn(() => 0.5),
        });

        // Act
        const rows = ParameterCatalogRenderer.collectAilmentAffiliationRows(actor);

        // Assert
        expect(rows.map(row => row.name)).toEqual([ 'Poison', 'Blind' ]);
      });
    });

    describe('drawAffiliationRow', () =>
    {
      it('draws the icon, the name, and the deviation hugging the inner window edge', () =>
      {
        // Arrange
        const window = makeWindow();
        const row = {
          name: 'Fire',
          value: '+0100%',
          iconIndex: 1001,
          colorIndex: 10,
        };

        // Act
        ParameterCatalogRenderer.drawAffiliationRow(window, row, 10, 50, 300);

        // Assert
        expect(window.modFontSize).toHaveBeenCalledWith(-6);
        expect(window.drawIcon).toHaveBeenCalledWith(1001, 10, 50);
        expect(window.drawText).toHaveBeenCalledWith('Fire', 46, 50, expect.any(Number), 'left');
        expect(window.drawStyledPaddedValue).toHaveBeenCalledWith(10, 50, '+0100%', 300, 8, 10);
      });

      it('never lets the name column collapse below a legible width', () =>
      {
        // Arrange: a narrow section with a long value would otherwise compute a negative width.
        const window = makeWindow();
        const row = {
          name: 'Fire',
          value: 'ABSORB (+0100%)',
          iconIndex: 1001,
          colorIndex: 5,
        };

        // Act
        ParameterCatalogRenderer.drawAffiliationRow(window, row, 0, 0, 60);

        // Assert
        const [ firstCall ] = window.drawText.mock.calls;
        const [ , , , nameWidth ] = firstCall;
        expect(nameWidth).toEqual(48);
      });
    });

    describe('drawAffiliationBaselineRow', () =>
    {
      it('says so plainly rather than leaving a bare heading with nothing beneath it', () =>
      {
        // Arrange
        const window = makeWindow();

        // Act
        ParameterCatalogRenderer.drawAffiliationBaselineRow(window, 10, 50, 300);

        // Assert
        expect(window.drawText).toHaveBeenCalledWith('All standard', 10, 50, 300, 'center');
        expect(window.changeTextColor).toHaveBeenCalledWith('color-7');
      });
    });

    describe('drawAffiliationRows', () =>
    {
      it('draws the placeholder and reserves one line for it when nothing deviates', () =>
      {
        // Arrange
        const window = makeWindow();

        // Act
        const bottom = ParameterCatalogRenderer.drawAffiliationRows(window, 0, 100, 300, []);

        // Assert
        expect(window.drawText).toHaveBeenCalledWith('All standard', 0, 144, 300, 'center');
        expect(bottom).toEqual(180);
      });

      it('stacks one line per row and reports where the section ends', () =>
      {
        // Arrange
        const window = makeWindow();
        const rows = [
          {
            name: 'Fire',
            value: '+0100%',
            iconIndex: 1,
            colorIndex: 10,
          },
          {
            name: 'Ice',
            value: '-0050%',
            iconIndex: 2,
            colorIndex: 3,
          },
        ];

        // Act
        const bottom = ParameterCatalogRenderer.drawAffiliationRows(window, 0, 100, 300, rows);

        // Assert
        expect(window.drawIcon).toHaveBeenCalledTimes(2);
        expect(bottom).toEqual(100 + (3 * 36) + 8);
      });
    });

    describe('drawElementAffiliations', () =>
    {
      it('draws the heading, its rule, and whatever deviates beneath them', () =>
      {
        // Arrange
        const window = makeWindow();
        const actor = makeAffiliationActor({
          elementRate: vi.fn(index => (index === 1 ? 2 : 1)),
        });

        // Act
        ParameterCatalogRenderer.drawElementAffiliations(window, actor, 0, 100, 300);

        // Assert
        expect(window.drawText).toHaveBeenCalledWith('Elements', 32, 101, 268, 'center');
        expect(window.drawHorizontalLine).toHaveBeenCalledWith(0, 138, 300, 3);
        expect(window.drawText).toHaveBeenCalledWith('Fire', 36, 144, expect.any(Number), 'left');
      });
    });

    describe('drawAilmentAffiliations', () =>
    {
      it('draws the heading, its rule, and whatever deviates beneath them', () =>
      {
        // Arrange
        const window = makeWindow();
        const actor = makeAffiliationActor({
          isStateResist: vi.fn(id => id === 4),
        });

        // Act
        ParameterCatalogRenderer.drawAilmentAffiliations(window, actor, 0, 100, 300);

        // Assert
        expect(window.drawText).toHaveBeenCalledWith('Ailments', 32, 101, 268, 'center');
        expect(window.drawHorizontalLine).toHaveBeenCalledWith(0, 138, 300, 3);
        expect(window.drawText).toHaveBeenCalledWith('Poison', 36, 144, expect.any(Number), 'left');
      });
    });
  });
  //endregion affiliations
});
//endregion plugins/cms/core/helpers/parameter-catalog-renderer.test.js
