//region plugins/message/ext/bubbles/services/bubble-layout.test.js
import { describe, expect, it } from 'vitest';

import BubbleBounds from '../../../../../../src/plugins/message/ext/bubbles/__models/BubbleBounds.js';
import BubbleLayout from '../../../../../../src/plugins/message/ext/bubbles/services/BubbleLayout.js';

/**
 * This exists so the live message window and a spent bubble left behind by the previous speaker
 * cannot drift apart, so the assertions worth making are the ones about composition: that the size
 * comes from the content, that the placement comes from the size, and that the tail is expressed in
 * the bubble's own coordinates rather than the screen's. A drift between the two callers would show
 * up as one of those three being computed from the wrong frame of reference.
 */
describe('J-Message-Bubbles BubbleLayout (direct src import)', () =>
{
  const SCREEN_WIDTH = 816;
  const SCREEN_HEIGHT = 624;

  /**
   * Text occupying 300 across and 80 down, measured from the contents origin.
   * @returns {BubbleBounds}
   */
  function content()
  {
    return new BubbleBounds(-3, 0, 300, 80);
  }

  it('sizes the bubble from the far edges of its text plus padding on both sides', () =>
  {
    // Arrange & Act
    const solved = BubbleLayout.solve(content(), 12, 400, 400, SCREEN_WIDTH, SCREEN_HEIGHT, false);

    // Assert- the near edges are slack the padding already covers, so only the far ones count.
    expect(solved.width).toBe(324);
    expect(solved.height).toBe(104);
  });

  it('rounds a fractional text width up rather than down', () =>
  {
    // Arrange
    // effect excursion is fractional - a pulsing glyph reaches a fraction of its own raster.
    const fractional = new BubbleBounds(0, 0, 300.4, 80.2);

    // Act
    const solved = BubbleLayout.solve(fractional, 12, 400, 400, SCREEN_WIDTH, SCREEN_HEIGHT, false);

    // Assert- rounding down would shave the last fraction of a pixel off the widest glyph.
    expect(solved.width).toBe(325);
    expect(solved.height).toBe(105);
  });

  it('centres the bubble over its speaker', () =>
  {
    // Arrange & Act
    const solved = BubbleLayout.solve(content(), 12, 400, 400, SCREEN_WIDTH, SCREEN_HEIGHT, false);

    // Assert
    expect(solved.x).toBe(238);
  });

  it('floats the bubble above its speaker', () =>
  {
    // Arrange & Act
    const solved = BubbleLayout.solve(content(), 12, 400, 400, SCREEN_WIDTH, SCREEN_HEIGHT, false);

    // Assert
    expect(solved.y).toBe(276);
  });

  it('insets the border from the bubble edge on every side', () =>
  {
    // Arrange & Act
    const solved = BubbleLayout.solve(content(), 12, 400, 400, SCREEN_WIDTH, SCREEN_HEIGHT, false);

    // Assert- a stroke is centred on its line, so a border at zero hangs half outside the box.
    expect(solved.bounds.left).toBe(2);
    expect(solved.bounds.top).toBe(2);
    expect(solved.bounds.right).toBe(322);
    expect(solved.bounds.bottom).toBe(102);
  });

  it('aims the tail in the bubble own coordinates rather than the screen', () =>
  {
    // Arrange & Act
    // the speaker is at 400 across; the bubble was placed at 238, so within the bubble they are at
    // 162 - which is where the tail has to leave from.
    const solved = BubbleLayout.solve(content(), 12, 400, 400, SCREEN_WIDTH, SCREEN_HEIGHT, false);

    // Assert
    expect(solved.tail.tipX).toBe(162);
    expect(solved.tail.onTop).toBe(false);
  });

  it('flips the tail for a bubble the screen pushed below its speaker', () =>
  {
    // Arrange & Act
    // a speaker near the top of the screen leaves no room above them.
    const solved = BubbleLayout.solve(content(), 12, 400, 40, SCREEN_WIDTH, SCREEN_HEIGHT, false);

    // Assert
    expect(solved.tail.onTop).toBe(true);
  });

  it('leans the tail toward a speaker the screen pushed the bubble away from', () =>
  {
    // Arrange & Act
    // hard against the left edge and further left than the bubble's own corner: the bubble cannot
    // centre on them and the mouth cannot reach them, so the tail has to do the work.
    const solved = BubbleLayout.solve(content(), 12, 10, 400, SCREEN_WIDTH, SCREEN_HEIGHT, false);

    // Assert
    expect(solved.x).toBe(6);
    expect(solved.tail.tipX).toBeLessThan(solved.tail.mouthStart);
  });

  it('hangs a bubble under its speaker and turns the tail up to match', () =>
  {
    // Arrange & Act
    // the separation mechanism for a conversation: one speaker's bubble above them, the other's
    // below, so two people standing a tile apart do not stack their dialogue in the same place.
    const solved = BubbleLayout.solve(content(), 12, 400, 400, SCREEN_WIDTH, SCREEN_HEIGHT, true);

    // Assert- the tail has to leave from the top edge now, or it points away from the speaker.
    expect(solved.y).toBe(420);
    expect(solved.tail.onTop).toBe(true);
  });

  it('measures a bubble with no text at all as nothing but its own padding', () =>
  {
    // Arrange & Act
    const solved = BubbleLayout.solve(BubbleBounds.empty(), 12, 400, 400, SCREEN_WIDTH, SCREEN_HEIGHT, false);

    // Assert
    expect(solved.width).toBe(24);
    expect(solved.height).toBe(24);
  });

  describe('the inset a window has to give back', () =>
  {
    it('is half of what the box gives up to the screen', () =>
    {
      // Arrange & Act
      // the engine's own numbers: a 1920 screen laid out in the 1912 box it insets by four a side.
      const inset = BubbleLayout.windowInset(1920, 1912);

      // Assert- four, which is how far the window layer begins inside the screen.
      expect(inset).toBe(4);
    });

    it('measures the vertical axis the same way', () =>
    {
      // Arrange & Act
      const inset = BubbleLayout.windowInset(1080, 1072);

      // Assert
      expect(inset).toBe(4);
    });

    it('is nothing at all for a project whose box fills its screen', () =>
    {
      // Arrange & Act
      const inset = BubbleLayout.windowInset(816, 816);

      // Assert- a floating message then needs no correction, and must not invent one.
      expect(inset).toBe(0);
    });
  });
});
//endregion plugins/message/ext/bubbles/services/bubble-layout.test.js