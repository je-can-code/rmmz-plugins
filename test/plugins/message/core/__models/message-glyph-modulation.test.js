//region plugins/message/core/__models/message-glyph-modulation.test.js
import { describe, expect, it } from 'vitest';

import MessageGlyphModulation
  from '../../../../../src/plugins/message/core/__models/MessageGlyphModulation.js';

/**
 * Composition is where two effects on one glyph either cooperate or silently cancel each other, and
 * the two halves behave deliberately differently: offsets add, tint does not. The tint cases below
 * each pair an opinionated modulation with a silent one, in both orders, because "the last opinion
 * wins" and "any opinion wins" are the same program when only one modulation ever has one.
 */
describe('J-Message MessageGlyphModulation (direct src import)', () =>
{
  it('describes no change at all when asked for nothing', () =>
  {
    // Arrange & Act
    const modulation = MessageGlyphModulation.none();

    // Assert
    expect(modulation.offsetX).toBe(0);
    expect(modulation.offsetY).toBe(0);
    expect(modulation.tint).toBeNull();
  });

  it('composes an empty list into no change', () =>
  {
    // Arrange & Act
    const composed = MessageGlyphModulation.compose([]);

    // Assert
    expect(composed.offsetX).toBe(0);
    expect(composed.offsetY).toBe(0);
    expect(composed.tint).toBeNull();
  });

  it('sums the horizontal offsets of everything acting on the glyph', () =>
  {
    // Arrange
    const first = new MessageGlyphModulation(3, 0, null);
    const second = new MessageGlyphModulation(4, 0, null);

    // Act
    const composed = MessageGlyphModulation.compose([ first, second ]);

    // Assert
    expect(composed.offsetX).toBe(7);
  });

  it('sums the vertical offsets of everything acting on the glyph', () =>
  {
    // Arrange
    const first = new MessageGlyphModulation(0, -5, null);
    const second = new MessageGlyphModulation(0, 2, null);

    // Act
    const composed = MessageGlyphModulation.compose([ first, second ]);

    // Assert
    expect(composed.offsetY).toBe(-3);
  });

  it('takes the colour from an opinionated modulation when the one before it was silent', () =>
  {
    // Arrange
    const silent = new MessageGlyphModulation(1, 1, null);
    const opinionated = new MessageGlyphModulation(0, 0, 0x00ff00);

    // Act
    const composed = MessageGlyphModulation.compose([ silent, opinionated ]);

    // Assert
    expect(composed.tint).toBe(0x00ff00);
    expect(composed.offsetX).toBe(1);
  });

  it('keeps an established colour when a later modulation has no opinion', () =>
  {
    // Arrange
    const opinionated = new MessageGlyphModulation(0, 0, 0x00ff00);
    const silent = new MessageGlyphModulation(1, 1, null);

    // Act
    const composed = MessageGlyphModulation.compose([ opinionated, silent ]);

    // Assert
    expect(composed.tint).toBe(0x00ff00);
    expect(composed.offsetY).toBe(1);
  });

  it('lets the last opinion win when two modulations both have one', () =>
  {
    // Arrange
    const earlier = new MessageGlyphModulation(0, 0, 0x00ff00);
    const later = new MessageGlyphModulation(0, 0, 0x0000ff);

    // Act
    const composed = MessageGlyphModulation.compose([ earlier, later ]);

    // Assert
    expect(composed.tint).toBe(0x0000ff);
  });

  it('treats pure black as a real opinion rather than an absent one', () =>
  {
    // Arrange
    // black is zero, and zero is the value most likely to be mistaken for "nothing here".
    const established = new MessageGlyphModulation(0, 0, 0xffffff);
    const blackened = new MessageGlyphModulation(0, 0, 0x000000);

    // Act
    const composed = MessageGlyphModulation.compose([ established, blackened ]);

    // Assert
    expect(composed.tint).toBe(0x000000);
  });

  it('defaults to no change when constructed with no arguments', () =>
  {
    // Arrange & Act
    const modulation = new MessageGlyphModulation();

    // Assert
    expect(modulation.offsetX).toBe(0);
    expect(modulation.offsetY).toBe(0);
    expect(modulation.tint).toBeNull();
    expect(modulation.scale).toBe(1);
  });

  it('leaves a glyph at its drawn size when nothing is acting on it', () =>
  {
    // Arrange & Act
    const composed = MessageGlyphModulation.compose([]);

    // Assert
    // one rather than zero: this is a ratio, and a summed identity would erase the glyph.
    expect(composed.scale).toBe(1);
  });

  it('multiplies the scales of everything acting on the glyph', () =>
  {
    // Arrange
    const first = new MessageGlyphModulation(0, 0, null, 1.1);
    const second = new MessageGlyphModulation(0, 0, null, 1.1);

    // Act
    const composed = MessageGlyphModulation.compose([ first, second ]);

    // Assert
    // two effects each swelling a glyph a tenth arrive at a fifth larger; summing would double it.
    expect(composed.scale).toBeCloseTo(1.21, 10);
  });

  it('lets a shrinking effect undo a swelling one rather than fighting it', () =>
  {
    // Arrange
    const swelling = new MessageGlyphModulation(0, 0, null, 2);
    const shrinking = new MessageGlyphModulation(0, 0, null, 0.5);

    // Act
    const composed = MessageGlyphModulation.compose([ swelling, shrinking ]);

    // Assert
    expect(composed.scale).toBeCloseTo(1, 10);
  });

  it('leaves the scale alone for an effect that only displaces', () =>
  {
    // Arrange
    const displacing = new MessageGlyphModulation(4, -4, null);

    // Act
    const composed = MessageGlyphModulation.compose([ displacing ]);

    // Assert
    expect(composed.scale).toBe(1);
    expect(composed.offsetX).toBe(4);
  });
});
//endregion plugins/message/core/__models/message-glyph-modulation.test.js