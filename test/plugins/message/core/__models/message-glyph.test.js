//region plugins/message/core/__models/message-glyph.test.js
import { beforeAll, describe, expect, it } from 'vitest';

import MessageGlyph from '../../../../../src/plugins/message/core/__models/MessageGlyph.js';
import MessageGlyphStyle from '../../../../../src/plugins/message/core/__models/MessageGlyphStyle.js';

/**
 * The raster key decides which glyphs share a texture, and it is the one place where being wrong
 * costs nothing visible and everything in memory. Colour must stay out of it - the glyph is
 * rasterized white and tinted afterward, so two glyphs differing only in colour are the same
 * picture, and a key that included colour would quietly hold a separate texture for every shade the
 * letter 'e' is ever drawn in. Everything baked into the picture must stay in.
 */
describe('J-Message MessageGlyph (direct src import)', () =>
{
  beforeAll(() =>
  {
    // the models seed string fields from String.empty, which J-Base installs onto the String constructor.
    if (String.empty === undefined)
    {
      Object.defineProperty(String, 'empty', {
        value: '',
        writable: false,
        configurable: true,
      });
    }
  });

  /**
   * A style snapshot, with any single field swapped out.
   * @param {object} [overrides] The fields to differ from the baseline.
   * @returns {MessageGlyphStyle}
   */
  function styleWith(overrides = {})
  {
    const baseline = {
      lineHeight: 36,
      fontFace: 'rmmz-mainfont',
      fontSize: 28,
      bold: false,
      italic: false,
      textColor: '#ffffff',
      outlineColor: '#000000',
      outlineWidth: 3,
      effects: [],
    };
    const merged = { ...baseline, ...overrides };

    return new MessageGlyphStyle(
      merged.lineHeight,
      merged.fontFace,
      merged.fontSize,
      merged.bold,
      merged.italic,
      merged.textColor,
      merged.outlineColor,
      merged.outlineWidth,
      merged.effects);
  }

  /**
   * Builds a glyph for the given character and style, at a position that never matters to the key.
   * @param {string} character The character the glyph draws.
   * @param {MessageGlyphStyle} style The style in force.
   * @returns {MessageGlyph}
   */
  function glyphOf(character, style)
  {
    return MessageGlyph.forCharacter(character, 40, 72, 14, 3, style);
  }

  it('gives two glyphs differing only in colour the same raster key', () =>
  {
    // Arrange
    const whiteGlyph = glyphOf('e', styleWith({ textColor: '#ffffff' }));
    const redGlyph = glyphOf('e', styleWith({ textColor: '#ff0000' }));

    // Act
    const whiteKey = whiteGlyph.rasterKey();
    const redKey = redGlyph.rasterKey();

    // Assert
    expect(whiteKey).toBe(redKey);
  });

  it('gives two glyphs differing in character different raster keys', () =>
  {
    // Arrange
    const first = glyphOf('e', styleWith());
    const second = glyphOf('a', styleWith());

    // Act & Assert
    expect(first.rasterKey()).not.toBe(second.rasterKey());
  });

  it('gives two glyphs differing in font size different raster keys', () =>
  {
    // Arrange
    const small = glyphOf('e', styleWith({ fontSize: 18 }));
    const large = glyphOf('e', styleWith({ fontSize: 28 }));

    // Act & Assert
    expect(small.rasterKey()).not.toBe(large.rasterKey());
  });

  it('gives two glyphs differing in weight different raster keys', () =>
  {
    // Arrange
    const plain = glyphOf('e', styleWith({ bold: false }));
    const bolded = glyphOf('e', styleWith({ bold: true }));

    // Act & Assert
    expect(plain.rasterKey()).not.toBe(bolded.rasterKey());
  });

  it('gives two glyphs differing in slant different raster keys', () =>
  {
    // Arrange
    const upright = glyphOf('e', styleWith({ italic: false }));
    const slanted = glyphOf('e', styleWith({ italic: true }));

    // Act & Assert
    expect(upright.rasterKey()).not.toBe(slanted.rasterKey());
  });

  it('gives two glyphs differing in outline different raster keys', () =>
  {
    // Arrange
    const thin = glyphOf('e', styleWith({ outlineWidth: 2 }));
    const thick = glyphOf('e', styleWith({ outlineWidth: 6 }));

    // Act & Assert
    expect(thin.rasterKey()).not.toBe(thick.rasterKey());
  });

  it('gives two glyphs differing in outline colour different raster keys', () =>
  {
    // Arrange
    const blackOutline = glyphOf('e', styleWith({ outlineColor: '#000000' }));
    const blueOutline = glyphOf('e', styleWith({ outlineColor: '#0000ff' }));

    // Act & Assert
    expect(blackOutline.rasterKey()).not.toBe(blueOutline.rasterKey());
  });

  it('gives two glyphs differing in line height different raster keys', () =>
  {
    // Arrange
    const shortLine = glyphOf('e', styleWith({ lineHeight: 36 }));
    const tallLine = glyphOf('e', styleWith({ lineHeight: 52 }));

    // Act & Assert
    expect(shortLine.rasterKey()).not.toBe(tallLine.rasterKey());
  });

  it('gives two glyphs differing only in position the same raster key', () =>
  {
    // Arrange
    const style = styleWith();
    const nearGlyph = MessageGlyph.forCharacter('e', 0, 0, 14, 0, style);
    const farGlyph = MessageGlyph.forCharacter('e', 400, 200, 14, 99, style);

    // Act & Assert
    expect(nearGlyph.rasterKey()).toBe(farGlyph.rasterKey());
  });

  it('reports a character glyph as not being an icon', () =>
  {
    // Arrange
    const glyph = glyphOf('e', styleWith());

    // Act & Assert
    expect(glyph.isIcon()).toBe(false);
  });

  it('reports an icon glyph as being one', () =>
  {
    // Arrange
    const glyph = MessageGlyph.forIcon(87, 40, 72, 36, 3, styleWith());

    // Act & Assert
    expect(glyph.isIcon()).toBe(true);
    expect(glyph.iconIndex).toBe(87);
  });

  it('treats icon zero as a real icon rather than as an absent one', () =>
  {
    // Arrange
    // the icon sheet's first cell is index zero, which is also the value most likely to be
    // mistaken for "no icon here" by a check written against falsiness instead of against -1.
    const glyph = MessageGlyph.forIcon(0, 40, 72, 36, 3, styleWith());

    // Act & Assert
    expect(glyph.isIcon()).toBe(true);
  });

  it('leaves an icon glyph with no character to draw', () =>
  {
    // Arrange
    const glyph = MessageGlyph.forIcon(87, 40, 72, 36, 3, styleWith());

    // Act & Assert
    expect(glyph.character).toBe('');
  });

  it('carries position and style onto an icon glyph the same way as a character', () =>
  {
    // Arrange
    const glyph = MessageGlyph.forIcon(87, 40, 72, 36, 3, styleWith({ textColor: '#ff0000' }));

    // Act & Assert
    expect(glyph.x).toBe(40);
    expect(glyph.y).toBe(72);
    expect(glyph.width).toBe(36);
    expect(glyph.index).toBe(3);
    expect(glyph.textColor).toBe('#ff0000');
  });
});
//endregion plugins/message/core/__models/message-glyph.test.js