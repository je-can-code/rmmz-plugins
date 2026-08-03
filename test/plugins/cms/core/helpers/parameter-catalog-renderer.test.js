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
      contents: { fontBold: false },
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
});
//endregion plugins/cms/core/helpers/parameter-catalog-renderer.test.js
