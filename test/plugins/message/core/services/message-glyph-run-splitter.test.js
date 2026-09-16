//region plugins/message/core/services/message-glyph-run-splitter.test.js
import { beforeAll, describe, expect, it } from 'vitest';

import MessageGlyphRunSplitter
  from '../../../../../src/plugins/message/core/services/MessageGlyphRunSplitter.js';
import MessageGlyphStyle
  from '../../../../../src/plugins/message/core/__models/MessageGlyphStyle.js';

/**
 * The splitter decides where every letter of every message in the game is drawn, so the assertions
 * here are pinned to exact pixels rather than to "roughly right". The measuring fake is the point of
 * the file: it describes a font where "AV" is narrower than "A" plus "V", which is what a real
 * canvas reports and what separates measuring prefixes from adding up characters. Those two
 * implementations agree on every one- and two-character run, so a fixture without a third character
 * after a kerned pair cannot tell them apart at all.
 */
describe('J-Message MessageGlyphRunSplitter (direct src import)', () =>
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
   * A font in which the pair "AV" kerns tighter than its two characters measured apart.
   *
   * Every single character is defined as well as every prefix, deliberately: an implementation that
   * summed character widths would ask for 'V' and 'X' on their own, and a fake that omitted them
   * would throw rather than return the wrong answer - which would pass the test for the wrong
   * reason and prove nothing about kerning.
   * @param {string} text The string to measure.
   * @returns {number}
   */
  function measureKernedFont(text)
  {
    const widths = {
      '': 0,
      'A': 10,
      'V': 10,
      'X': 10,
      'AV': 19,
      'AVX': 29,
    };

    const width = widths[ text ];
    if (width === undefined) throw new Error(`the fake font was not asked about: [ ${text} ]`);

    return width;
  }

  /**
   * A style snapshot with recognisable values, so a glyph that failed to carry one is obvious.
   * @returns {MessageGlyphStyle}
   */
  function someStyle()
  {
    return new MessageGlyphStyle(36, 'rmmz-mainfont', 28, true, false, '#ff0000', '#000000', 3, [ 'wave' ]);
  }

  it('emits nothing when the buffered run is empty', () =>
  {
    // Arrange
    const style = someStyle();

    // Act
    const glyphs = MessageGlyphRunSplitter.split('', { x: 100, y: 40, index: 7 }, style, measureKernedFont);

    // Assert
    expect(glyphs).toEqual([]);
  });

  it('emits one glyph per character of a non-empty run', () =>
  {
    // Arrange
    const style = someStyle();

    // Act
    const glyphs = MessageGlyphRunSplitter.split('AVX', { x: 0, y: 0, index: 0 }, style, measureKernedFont);

    // Assert
    expect(glyphs.length).toBe(3);
    expect(glyphs.map(glyph => glyph.character)).toEqual([ 'A', 'V', 'X' ]);
  });

  it('positions each glyph by measuring the prefix before it, so kerning is preserved', () =>
  {
    // Arrange
    const style = someStyle();

    // Act
    const glyphs = MessageGlyphRunSplitter.split('AVX', { x: 100, y: 0, index: 0 }, style, measureKernedFont);

    // Assert
    // 'X' sits at 100 + width('AV') = 119. Summing character widths would put it at 100 + 10 + 10 = 120,
    // and that one pixel is the entire difference between this pipeline and a reflowed script.
    expect(glyphs[ 0 ].x).toBe(100);
    expect(glyphs[ 1 ].x).toBe(110);
    expect(glyphs[ 2 ].x).toBe(119);
  });

  it('gives each glyph the advance its own prefix pair implies', () =>
  {
    // Arrange
    const style = someStyle();

    // Act
    const glyphs = MessageGlyphRunSplitter.split('AVX', { x: 0, y: 0, index: 0 }, style, measureKernedFont);

    // Assert
    // 'V' advances 9 rather than its standalone 10, because the pair it forms with 'A' is tighter.
    expect(glyphs[ 0 ].width).toBe(10);
    expect(glyphs[ 1 ].width).toBe(9);
    expect(glyphs[ 2 ].width).toBe(10);
  });

  it('carries the origin y onto every glyph without adjusting it', () =>
  {
    // Arrange
    const style = someStyle();

    // Act
    const glyphs = MessageGlyphRunSplitter.split('AVX', { x: 0, y: 72, index: 0 }, style, measureKernedFont);

    // Assert
    expect(glyphs.map(glyph => glyph.y)).toEqual([ 72, 72, 72 ]);
  });

  it('continues the message-wide glyph index from where the run began', () =>
  {
    // Arrange
    const style = someStyle();

    // Act
    const glyphs = MessageGlyphRunSplitter.split('AVX', { x: 0, y: 0, index: 12 }, style, measureKernedFont);

    // Assert
    expect(glyphs.map(glyph => glyph.index)).toEqual([ 12, 13, 14 ]);
  });

  it('copies the style snapshot onto every glyph it emits', () =>
  {
    // Arrange
    const style = someStyle();

    // Act
    const glyphs = MessageGlyphRunSplitter.split('AVX', { x: 0, y: 0, index: 0 }, style, measureKernedFont);

    // Assert
    const [ , middleGlyph ] = glyphs;
    expect(middleGlyph.fontFace).toBe('rmmz-mainfont');
    expect(middleGlyph.fontSize).toBe(28);
    expect(middleGlyph.bold).toBe(true);
    expect(middleGlyph.italic).toBe(false);
    expect(middleGlyph.textColor).toBe('#ff0000');
    expect(middleGlyph.outlineColor).toBe('#000000');
    expect(middleGlyph.outlineWidth).toBe(3);
    expect(middleGlyph.lineHeight).toBe(36);
    expect(middleGlyph.effects).toEqual([ 'wave' ]);
  });
});
//endregion plugins/message/core/services/message-glyph-run-splitter.test.js