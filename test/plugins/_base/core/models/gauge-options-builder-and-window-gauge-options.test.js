//region plugins/_base/models/gauge-options-builder-and-window-gauge-options.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('GaugeOptionsBuilder / WindowGaugeOptions (direct src import)', () =>
{
  let GaugeOptionsBuilder;
  let WindowGaugeOptions;

  beforeAll(async () =>
  {
    String.empty = '';

    globalThis.Window_Base = { GAUGE_TYPES: { Rectangle: 'rectangle', Radial: 'radial' } };

    ({ default: WindowGaugeOptions } = await import('../../../../../src/plugins/_base/core/models/WindowGaugeOptions.js'));
    ({ default: GaugeOptionsBuilder } = await import('../../../../../src/plugins/_base/core/models/GaugeOptionsBuilder.js'));
  });

  describe('WindowGaugeOptions', () =>
  {
    it('maps every constructor argument onto its corresponding property', () =>
    {
      // Arrange & Act
      const options = new WindowGaugeOptions(
        'rectangle', '#000', '#111', '#222', '#333', 2, 1, '#444', 8, 2, 4, 6, -1.5,
      );

      // Assert
      expect(options.gaugeType).toBe('rectangle');
      expect(options.backColor).toBe('#000');
      expect(options.leftGradientColor).toBe('#111');
      expect(options.rightGradientColor).toBe('#222');
      expect(options.borderColor).toBe('#333');
      expect(options.borderThickness).toBe(2);
      expect(options.borderGap).toBe(1);
      expect(options.dividerColor).toBe('#444');
      expect(options.segments).toBe(8);
      expect(options.gap).toBe(2);
      expect(options.radius).toBe(4);
      expect(options.thickness).toBe(6);
      expect(options.startAngle).toBe(-1.5);
    });

    describe('Builder (static)', () =>
    {
      it('returns a new GaugeOptionsBuilder instance', () =>
      {
        // Arrange & Act
        const result = WindowGaugeOptions.Builder();

        // Assert
        expect(result).toBeInstanceOf(GaugeOptionsBuilder);
      });
    });
  });

  describe('GaugeOptionsBuilder', () =>
  {
    it('build() returns a WindowGaugeOptions instance', () =>
    {
      // Arrange & Act
      const options = new GaugeOptionsBuilder().build();

      // Assert
      expect(options).toBeInstanceOf(WindowGaugeOptions);
    });

    it('build() applies the default gauge type from Window_Base.GAUGE_TYPES', () =>
    {
      // Arrange & Act
      const options = new GaugeOptionsBuilder().build();

      // Assert
      expect(options.gaugeType).toBe('rectangle');
    });

    it('applies every fluently-chained override to the built options', () =>
    {
      // Arrange & Act
      const options = new GaugeOptionsBuilder()
        .gaugeType('radial')
        .backColor('#a')
        .leftGradientColor('#b')
        .rightGradientColor('#c')
        .borderColor('#d')
        .borderThickness(5)
        .borderGap(3)
        .dividerColor('#e')
        .segments(4)
        .gap(1)
        .radius(9)
        .thickness(7)
        .startAngle(2.5)
        .build();

      // Assert
      expect(options.gaugeType).toBe('radial');
      expect(options.backColor).toBe('#a');
      expect(options.leftGradientColor).toBe('#b');
      expect(options.rightGradientColor).toBe('#c');
      expect(options.borderColor).toBe('#d');
      expect(options.borderThickness).toBe(5);
      expect(options.borderGap).toBe(3);
      expect(options.dividerColor).toBe('#e');
      expect(options.segments).toBe(4);
      expect(options.gap).toBe(1);
      expect(options.radius).toBe(9);
      expect(options.thickness).toBe(7);
      expect(options.startAngle).toBe(2.5);
    });

    it('returns the builder itself from each setter to support chaining', () =>
    {
      // Arrange
      const builder = new GaugeOptionsBuilder();

      // Act & Assert
      expect(builder.gaugeType('radial')).toBe(builder);
      expect(builder.backColor('#a')).toBe(builder);
      expect(builder.leftGradientColor('#b')).toBe(builder);
      expect(builder.rightGradientColor('#c')).toBe(builder);
      expect(builder.borderColor('#d')).toBe(builder);
      expect(builder.borderThickness(1)).toBe(builder);
      expect(builder.borderGap(1)).toBe(builder);
      expect(builder.dividerColor('#e')).toBe(builder);
      expect(builder.segments(1)).toBe(builder);
      expect(builder.gap(1)).toBe(builder);
      expect(builder.radius(1)).toBe(builder);
      expect(builder.thickness(1)).toBe(builder);
      expect(builder.startAngle(0)).toBe(builder);
    });
  });
});
//endregion plugins/_base/models/gauge-options-builder-and-window-gauge-options.test.js
