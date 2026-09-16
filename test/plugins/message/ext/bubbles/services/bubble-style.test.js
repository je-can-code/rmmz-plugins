//region plugins/message/ext/bubbles/services/bubble-style.test.js
import { describe, expect, it } from 'vitest';

import BubbleStyle from '../../../../../../src/plugins/message/ext/bubbles/services/BubbleStyle.js';

/**
 * Three Background values and three distinct answers, so every assertion here names a value that
 * appears in exactly one of them. A palette where the dim and the ordinary shared a colour would let
 * a resolver that ignored its argument pass most of this file.
 */
describe('J-Message-Bubbles BubbleStyle (direct src import)', () =>
{
  it('draws an ordinary bubble for a message asking for a window', () =>
  {
    // Arrange & Act
    const style = BubbleStyle.forBackground(0);

    // Assert
    expect(style.drawn).toBe(true);
    expect(style.fillColor).toBe(0x121826);
    expect(style.fillAlpha).toBe(0.92);
  });

  it('greys the fill for a message asking to be dimmed', () =>
  {
    // Arrange & Act
    // greyed rather than merely fainter: opacity alone lets the map underneath tint the bubble a
    // different colour in every room, which reads as a fault rather than as a hush.
    const style = BubbleStyle.forBackground(1);

    // Assert
    expect(style.fillColor).toBe(0x232830);
    expect(style.fillAlpha).toBe(0.58);
  });

  it('still draws something for a message asking to be dimmed', () =>
  {
    // Arrange & Act
    const style = BubbleStyle.forBackground(1);

    // Assert- dimmed is quieter, not absent.
    expect(style.drawn).toBe(true);
  });

  it('greys the border for a message asking to be dimmed', () =>
  {
    // Arrange & Act
    const style = BubbleStyle.forBackground(1);

    // Assert
    expect(style.borderColor).toBe(0x8d95a3);
  });

  it('outlines a message that is not dimmed', () =>
  {
    // Arrange & Act
    const style = BubbleStyle.forBackground(0);

    // Assert- the edge is what makes an ordinary bubble read as an object being held up.
    expect(style.bordered).toBe(true);
  });

  it('draws no outline at all for a message asking to be dimmed', () =>
  {
    // Arrange & Act
    const style = BubbleStyle.forBackground(1);

    // Assert- an edge is most of what separates a statement from a hush. A soft translucent shape
    // with nothing around it reads as something happening inside a head rather than in the room.
    expect(style.bordered).toBe(false);
  });

  it('greys the speaker name alongside the border it sits in', () =>
  {
    // Arrange & Act
    // a legend left bright inside a hushed bubble is the loudest thing on it.
    const style = BubbleStyle.forBackground(1);

    // Assert
    expect(style.legendColor).toBe('#8d95a3');
  });

  it('draws no bubble at all for a message asking to be transparent', () =>
  {
    // Arrange & Act
    const style = BubbleStyle.forBackground(2);

    // Assert- the text still floats above the speaker; only the backdrop is gone.
    expect(style.drawn).toBe(false);
  });

  it('keeps the ordinary palette on a transparent message rather than blanking it', () =>
  {
    // Arrange & Act
    const style = BubbleStyle.forBackground(2);

    // Assert- "what colour is the thing nobody draws" has no answer, and a caller should not need
    // one ready in order to read the field.
    expect(style.fillColor).toBe(0x121826);
    expect(style.borderColor).toBe(0xf2f4f8);
  });

  it('treats a value the engine has never issued as transparent', () =>
  {
    // Arrange & Act
    // the dropdown offers exactly three, but the field is a plain number in the event data.
    const style = BubbleStyle.forBackground(7);

    // Assert
    expect(style.drawn).toBe(false);
  });

  it('tells the ordinary and the dimmed apart on every field it answers', () =>
  {
    // Arrange
    const ordinary = BubbleStyle.forBackground(0);

    // Act
    const dimmed = BubbleStyle.forBackground(1);

    // Assert- the near-miss check: a resolver that had collapsed into one palette would pass every
    // "dim is grey" assertion above if grey were simply what it always returned.
    expect(dimmed.fillColor).not.toBe(ordinary.fillColor);
    expect(dimmed.fillAlpha).not.toBe(ordinary.fillAlpha);
    expect(dimmed.borderColor).not.toBe(ordinary.borderColor);
    expect(dimmed.legendColor).not.toBe(ordinary.legendColor);
  });

  it('names the speaker brightly on an ordinary bubble', () =>
  {
    // Arrange & Act
    const style = BubbleStyle.forBackground(0);

    // Assert
    expect(style.legendColor).toBe('#f2f4f8');
  });
});
//endregion plugins/message/ext/bubbles/services/bubble-style.test.js