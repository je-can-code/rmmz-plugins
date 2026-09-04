//region plugins/_base/core/core/text-raster-metrics.test.js
import { describe, expect, it } from 'vitest';
import TextRasterMetrics from '../../../../../src/plugins/_base/core/core/TextRasterMetrics.js';

/**
 * The arithmetic that keeps rasterized text from being squeezed, shaved, or smeared.
 *
 * Every sum here exists to defeat a specific canvas behaviour, so the cases are chosen around the
 * boundaries those behaviours live on rather than around round numbers: an odd width beside an even
 * one, a font size on each side of the outline floor, and an unscaled display beside a scaled one.
 */
describe('TextRasterMetrics', () =>
{
  describe('outlineWidth', () =>
  {
    it('holds the outline at its floor for a small font', () =>
    {
      // Arrange - a sixth of 14 is 2.33, which floors to 2 and ties the floor.
      const fontSize = 14;

      // Act.
      const result = TextRasterMetrics.outlineWidth(fontSize);

      // Assert.
      expect(result)
        .toBe(2);
    });

    it('holds the floor for a font small enough to have wanted less', () =>
    {
      // Arrange - a sixth of 6 is 1, which the floor has to overrule.
      const fontSize = 6;

      // Act.
      const result = TextRasterMetrics.outlineWidth(fontSize);

      // Assert.
      expect(result)
        .toBe(2);
    });

    it('derives the outline from the font size once it clears the floor', () =>
    {
      // Arrange - a sixth of 30 is 5, comfortably above the floor of 2.
      const fontSize = 30;

      // Act.
      const result = TextRasterMetrics.outlineWidth(fontSize);

      // Assert.
      expect(result)
        .toBe(5);
    });
  });

  describe('padding', () =>
  {
    it('reserves the outline width exactly when it is already whole', () =>
    {
      // Arrange.
      const outlineWidth = 3;

      // Act.
      const result = TextRasterMetrics.padding(outlineWidth);

      // Assert.
      expect(result)
        .toBe(3);
    });

    it('rounds a fractional outline width up to a whole pixel', () =>
    {
      // Arrange - a 2px outline on a 1.25 display.
      const outlineWidth = 2.5;

      // Act.
      const result = TextRasterMetrics.padding(outlineWidth);

      // Assert.
      expect(result)
        .toBe(3);
    });
  });

  describe('textWidth', () =>
  {
    it('leaves an even whole measurement untouched', () =>
    {
      // Arrange.
      const measuredWidth = 120;

      // Act.
      const result = TextRasterMetrics.textWidth(measuredWidth);

      // Assert.
      expect(result)
        .toBe(120);
    });

    it('lifts an odd whole measurement to the next even number', () =>
    {
      // Arrange - 121 would put centred text on a half-pixel at 60.5.
      const measuredWidth = 121;

      // Act.
      const result = TextRasterMetrics.textWidth(measuredWidth);

      // Assert.
      expect(result)
        .toBe(122);
    });

    it('never rounds a fractional measurement down, which is what would condense the glyphs', () =>
    {
      // Arrange - the exact shape of the bug: a measurement a hair over a whole number.
      const measuredWidth = 120.02;

      // Act.
      const result = TextRasterMetrics.textWidth(measuredWidth);

      // Assert.
      expect(result)
        .toBe(122);
    });
  });

  describe('canvasWidth', () =>
  {
    it('adds the outline margin to both sides of the text area', () =>
    {
      // Arrange.
      const textWidth = 120;
      const padding = 3;

      // Act.
      const result = TextRasterMetrics.canvasWidth(textWidth, padding);

      // Assert.
      expect(result)
        .toBe(126);
    });
  });

  describe('canvasHeight', () =>
  {
    it('gives the glyphs three times their own size to sit in', () =>
    {
      // Arrange.
      const deviceFontSize = 24;

      // Act.
      const result = TextRasterMetrics.canvasHeight(deviceFontSize);

      // Assert.
      expect(result)
        .toBe(72);
    });
  });

  describe('snap', () =>
  {
    it('rounds to a whole pixel on an unscaled display', () =>
    {
      // Arrange.
      const value = 37.4;

      // Act.
      const result = TextRasterMetrics.snap(value, 1);

      // Assert.
      expect(result)
        .toBe(37);
    });

    it('rounds onto the device grid rather than the logical one when scaled', () =>
    {
      // Arrange - 37 logical is device 55.5, so the nearest real pixel is a fractional logical value.
      const value = 37;

      // Act.
      const result = TextRasterMetrics.snap(value, 1.5);

      // Assert.
      expect(result)
        .toBeCloseTo(37.333333, 5);
    });

    it('leaves a value already sitting on the device grid where it is', () =>
    {
      // Arrange - 38 logical is device 57, a whole real pixel already.
      const value = 38;

      // Act.
      const result = TextRasterMetrics.snap(value, 1.5);

      // Assert.
      expect(result)
        .toBe(38);
    });
  });
});
//endregion plugins/_base/core/core/text-raster-metrics.test.js