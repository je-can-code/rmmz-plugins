//region plugins/message/core/__models/message-glyph-style.test.js
import { beforeAll, describe, expect, it } from 'vitest';

import MessageGlyphStyle from '../../../../../src/plugins/message/core/__models/MessageGlyphStyle.js';

/**
 * This is the only place in the pipeline that reads the window's live font state, so a field taken
 * from the wrong property here is a defect nothing downstream can detect - the glyphs would simply
 * render confidently wrong. Every value in the fake below is deliberately distinct, including the
 * two booleans and the two colours, so a transposition between neighbouring fields fails rather than
 * coincidentally agreeing.
 */
describe('J-Message MessageGlyphStyle (direct src import)', () =>
{
  beforeAll(() =>
  {
    // the model seeds string fields from String.empty, which J-Base installs onto the String constructor.
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
   * A contents bitmap whose every font property carries a recognisably different value.
   * @returns {object}
   */
  function someContents()
  {
    return {
      fontFace: 'rmmz-numberfont',
      fontSize: 18,
      fontBold: true,
      fontItalic: false,
      textColor: '#c0ffee',
      outlineColor: '#123456',
      outlineWidth: 5,
    };
  }

  it('snapshots every font property off the contents bitmap', () =>
  {
    // Arrange
    const contents = someContents();

    // Act
    const style = MessageGlyphStyle.fromContents(contents, 44, [ 'jitter' ]);

    // Assert
    expect(style.fontFace).toBe('rmmz-numberfont');
    expect(style.fontSize).toBe(18);
    expect(style.bold).toBe(true);
    expect(style.italic).toBe(false);
    expect(style.textColor).toBe('#c0ffee');
    expect(style.outlineColor).toBe('#123456');
    expect(style.outlineWidth).toBe(5);
  });

  it('takes the line height and effects from its arguments rather than the bitmap', () =>
  {
    // Arrange
    // neither of these exists on a Bitmap at all: the line belongs to the text state and the
    // effects belong to the message, so reading them off contents would find nothing.
    const contents = someContents();

    // Act
    const style = MessageGlyphStyle.fromContents(contents, 44, [ 'jitter', 'rainbow' ]);

    // Assert
    expect(style.lineHeight).toBe(44);
    expect(style.effects).toEqual([ 'jitter', 'rainbow' ]);
  });

  it('does not keep a reference to the bitmap it read', () =>
  {
    // Arrange
    const contents = someContents();
    const style = MessageGlyphStyle.fromContents(contents, 44, []);

    // Act
    // the window changes font mid-line constantly; a style that read through to the bitmap would
    // report the last code's value rather than the one in force when its glyphs were emitted.
    contents.fontSize = 99;
    contents.textColor = '#000000';

    // Assert
    expect(style.fontSize).toBe(18);
    expect(style.textColor).toBe('#c0ffee');
  });
});
//endregion plugins/message/core/__models/message-glyph-style.test.js