//region plugins/message/ext/bubbles/__models/bubble-anchor.test.js
import { describe, expect, it } from 'vitest';

import BubbleAnchor from '../../../../../../src/plugins/message/ext/bubbles/__models/BubbleAnchor.js';

/**
 * The anchor exists to be indistinguishable from a character at the two places a bubble asks a
 * character anything, so the coordinates here are deliberately different from each other: an
 * implementation that answered the same field for both questions would be invisible against a
 * square fixture.
 */
describe('J-Message-Bubbles BubbleAnchor (direct src import)', () =>
{
  it('answers the horizontal position it was given', () =>
  {
    // Arrange
    const anchor = new BubbleAnchor(320, 180);

    // Act
    const x = anchor.screenX();

    // Assert
    expect(x).toBe(320);
  });

  it('answers the vertical position it was given', () =>
  {
    // Arrange
    const anchor = new BubbleAnchor(320, 180);

    // Act
    const y = anchor.screenY();

    // Assert
    expect(y).toBe(180);
  });

  it('aims a tail at the exact point it was given', () =>
  {
    // Arrange
    const anchor = new BubbleAnchor(320, 180);

    // Act
    const anchorY = anchor.bubbleAnchorY(false);

    // Assert- an author who typed a coordinate meant that coordinate.
    expect(anchorY).toBe(180);
  });

  it('aims at the same point whichever side the bubble ended up on', () =>
  {
    // Arrange
    const anchor = new BubbleAnchor(320, 180);

    // Act
    const anchorY = anchor.bubbleAnchorY(true);

    // Assert- a character answers differently for each side, because they have a head and feet.
    // A fixed point has neither, and moving it by the height of a sprite that is not there would
    // put the bubble somewhere nobody asked for.
    expect(anchorY).toBe(180);
  });

  it('keeps two anchors from sharing their positions', () =>
  {
    // Arrange
    const nearTheTop = new BubbleAnchor(320, 180);
    const nearTheBottom = new BubbleAnchor(48, 560);

    // Act
    const x = nearTheBottom.screenX();
    const y = nearTheBottom.screenY();

    // Assert
    expect(x).toBe(48);
    expect(y).toBe(560);
    expect(nearTheTop.screenX()).toBe(320);
  });
});
//endregion plugins/message/ext/bubbles/__models/bubble-anchor.test.js