//region plugins/message/ext/bubbles/services/bubble-placement.test.js
import { describe, expect, it } from 'vitest';

import BubblePlacement from '../../../../../../src/plugins/message/ext/bubbles/services/BubblePlacement.js';

/**
 * The screen here is 816 by 624, which is RMMZ's own default, and the bubbles are never square. A
 * placement service is two independent axes, and a square on a square screen lets an implementation
 * that has swapped them produce the right answer twice.
 */
describe('J-Message-Bubbles BubblePlacement (direct src import)', () =>
{
  const SCREEN_WIDTH = 816;
  const SCREEN_HEIGHT = 624;

  it('centres a bubble over whoever is speaking', () =>
  {
    // Arrange & Act
    const placed = BubblePlacement.place(200, 120, 400, 400, SCREEN_WIDTH, SCREEN_HEIGHT, false);

    // Assert
    expect(placed.x).toBe(300);
  });

  it('floats a bubble clear of the head it belongs to', () =>
  {
    // Arrange & Act
    // twenty of air plus its own height, so the tail has somewhere to be.
    const placed = BubblePlacement.place(200, 120, 400, 400, SCREEN_WIDTH, SCREEN_HEIGHT, false);

    // Assert
    expect(placed.y).toBe(260);
  });

  it('holds a bubble off the left edge of the screen', () =>
  {
    // Arrange & Act
    const placed = BubblePlacement.place(200, 120, 20, 400, SCREEN_WIDTH, SCREEN_HEIGHT, false);

    // Assert- centring would have put it at -80.
    expect(placed.x).toBe(6);
  });

  it('holds a bubble off the right edge of the screen', () =>
  {
    // Arrange & Act
    // the near-miss for the clamp above: an implementation holding only the near edge would pass
    // that test and let this bubble hang off the far side.
    const placed = BubblePlacement.place(200, 120, 800, 400, SCREEN_WIDTH, SCREEN_HEIGHT, false);

    // Assert
    expect(placed.x).toBe(610);
  });

  it('drops below a speaker with no room above them', () =>
  {
    // Arrange & Act
    // squashing the bubble against the ceiling would leave it over their own head with a tail
    // pointing up into itself; underneath them is the only placement that still reads as theirs.
    const placed = BubblePlacement.place(200, 120, 400, 60, SCREEN_WIDTH, SCREEN_HEIGHT, false);

    // Assert
    expect(placed.y).toBe(80);
  });

  it('stays above a speaker with room to spare', () =>
  {
    // Arrange & Act
    // the near-miss for the drop above: one pixel more headroom and it belongs on top again.
    const placed = BubblePlacement.place(200, 120, 400, 146, SCREEN_WIDTH, SCREEN_HEIGHT, false);

    // Assert
    expect(placed.y).toBe(6);
  });

  it('holds a bubble off the bottom of the screen', () =>
  {
    // Arrange & Act
    const placed = BubblePlacement.place(200, 120, 400, 900, SCREEN_WIDTH, SCREEN_HEIGHT, false);

    // Assert
    expect(placed.y).toBe(498);
  });

  it('pins a bubble wider than the screen to the near edge', () =>
  {
    // Arrange & Act
    // a deliberately enormous line: the author owns their line breaks, so this is a thing that can
    // genuinely happen and the start of the text is the half worth keeping.
    const placed = BubblePlacement.place(1000, 120, 400, 400, SCREEN_WIDTH, SCREEN_HEIGHT, false);

    // Assert
    expect(placed.x).toBe(6);
  });

  it('pins a bubble taller than the screen to the top', () =>
  {
    // Arrange & Act
    const placed = BubblePlacement.place(200, 700, 400, 400, SCREEN_WIDTH, SCREEN_HEIGHT, false);

    // Assert
    expect(placed.y).toBe(6);
  });

  it('hangs a bubble under its speaker when the author asked for that side', () =>
  {
    // Arrange & Act
    // the Show Text Position dropdown, which is how two characters in a conversation get put on
    // opposite sides of each other instead of stacking at the same height.
    const placed = BubblePlacement.place(200, 120, 400, 400, SCREEN_WIDTH, SCREEN_HEIGHT, true);

    // Assert- twenty below them, rather than its own height plus twenty above.
    expect(placed.y).toBe(420);
  });

  it('abandons the asked-for side when that side does not fit', () =>
  {
    // Arrange & Act
    // a speaker near the floor, asked to carry their bubble below them: it would hang off the
    // bottom, and a bubble on the wrong side beats one that is half cut off.
    const placed = BubblePlacement.place(200, 120, 400, 560, SCREEN_WIDTH, SCREEN_HEIGHT, true);

    // Assert
    expect(placed.y).toBe(420);
  });

  it('keeps the asked-for side when it fits perfectly', () =>
  {
    // Arrange & Act
    // the near-miss for the abandonment above: one pixel of slack and the request stands.
    const placed = BubblePlacement.place(200, 120, 400, 478, SCREEN_WIDTH, SCREEN_HEIGHT, true);

    // Assert
    expect(placed.y).toBe(498);
  });

  it('puts a bubble somewhere predictable when neither side fits', () =>
  {
    // Arrange & Act
    // taller than the screen it is being placed on; both sides are impossible, so it must not end
    // up bouncing between two wrong answers.
    const placed = BubblePlacement.place(200, 700, 400, 400, SCREEN_WIDTH, SCREEN_HEIGHT, true);

    // Assert
    expect(placed.y).toBe(6);
  });

  it('leaves each axis to its own measurements', () =>
  {
    // Arrange & Act
    // a bubble pushed against the right edge while sitting comfortably vertically: an implementation
    // that clamped both axes against one dimension would drag the y along with it.
    const placed = BubblePlacement.place(300, 100, 790, 400, SCREEN_WIDTH, SCREEN_HEIGHT, false);

    // Assert
    expect(placed.x).toBe(510);
    expect(placed.y).toBe(280);
  });
});
//endregion plugins/message/ext/bubbles/services/bubble-placement.test.js