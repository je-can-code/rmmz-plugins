//region plugins/message/ext/bubbles/__models/bubble-bounds.test.js
import { describe, expect, it } from 'vitest';

import BubbleBounds from '../../../../../../src/plugins/message/ext/bubbles/__models/BubbleBounds.js';

/**
 * Every rectangle here is deliberately lopsided - different numbers on all four edges, and never a
 * square. A union is four independent comparisons, and a symmetrical fixture cannot tell an
 * implementation that gets one of them backwards from one that gets all four right.
 */
describe('J-Message-Bubbles BubbleBounds (direct src import)', () =>
{
  it('reports how wide it is from its own edges', () =>
  {
    // Arrange
    const bounds = new BubbleBounds(10, 20, 70, 100);

    // Act
    const width = bounds.width();

    // Assert
    expect(width).toBe(60);
  });

  it('reports how tall it is from its own edges', () =>
  {
    // Arrange
    const bounds = new BubbleBounds(10, 20, 70, 100);

    // Act
    const height = bounds.height();

    // Assert
    expect(height).toBe(80);
  });

  it('encloses nothing when built empty', () =>
  {
    // Arrange & Act
    const bounds = BubbleBounds.empty();

    // Assert
    expect(bounds.width()).toBe(0);
    expect(bounds.height()).toBe(0);
    expect(bounds.left).toBe(0);
    expect(bounds.top).toBe(0);
  });

  it('moves its left edge out for something reaching further left', () =>
  {
    // Arrange
    const bounds = new BubbleBounds(10, 20, 70, 100);

    // Act
    bounds.union(new BubbleBounds(4, 20, 70, 100));

    // Assert
    expect(bounds.left).toBe(4);
  });

  it('leaves its left edge alone for something starting further right', () =>
  {
    // Arrange
    const bounds = new BubbleBounds(10, 20, 70, 100);

    // Act
    bounds.union(new BubbleBounds(30, 20, 70, 100));

    // Assert
    expect(bounds.left).toBe(10);
  });

  it('moves its top edge out for something reaching higher', () =>
  {
    // Arrange
    const bounds = new BubbleBounds(10, 20, 70, 100);

    // Act
    bounds.union(new BubbleBounds(10, 6, 70, 100));

    // Assert
    expect(bounds.top).toBe(6);
  });

  it('leaves its top edge alone for something starting lower', () =>
  {
    // Arrange
    const bounds = new BubbleBounds(10, 20, 70, 100);

    // Act
    bounds.union(new BubbleBounds(10, 44, 70, 100));

    // Assert
    expect(bounds.top).toBe(20);
  });

  it('moves its right edge out for something reaching further right', () =>
  {
    // Arrange
    const bounds = new BubbleBounds(10, 20, 70, 100);

    // Act
    bounds.union(new BubbleBounds(10, 20, 96, 100));

    // Assert
    expect(bounds.right).toBe(96);
  });

  it('leaves its right edge alone for something ending further left', () =>
  {
    // Arrange
    const bounds = new BubbleBounds(10, 20, 70, 100);

    // Act
    bounds.union(new BubbleBounds(10, 20, 55, 100));

    // Assert
    expect(bounds.right).toBe(70);
  });

  it('moves its bottom edge out for something reaching lower', () =>
  {
    // Arrange
    const bounds = new BubbleBounds(10, 20, 70, 100);

    // Act
    bounds.union(new BubbleBounds(10, 20, 70, 130));

    // Assert
    expect(bounds.bottom).toBe(130);
  });

  it('leaves its bottom edge alone for something ending higher', () =>
  {
    // Arrange
    const bounds = new BubbleBounds(10, 20, 70, 100);

    // Act
    bounds.union(new BubbleBounds(10, 20, 70, 88));

    // Assert
    expect(bounds.bottom).toBe(100);
  });

  it('pushes every edge outward when grown', () =>
  {
    // Arrange
    const bounds = new BubbleBounds(10, 20, 70, 100);

    // Act
    bounds.grow(5);

    // Assert- outward on all four, which means the two low edges go down and the two high ones up.
    expect(bounds.left).toBe(5);
    expect(bounds.top).toBe(15);
    expect(bounds.right).toBe(75);
    expect(bounds.bottom).toBe(105);
  });

  it('gets larger rather than merely shifted when grown', () =>
  {
    // Arrange
    const bounds = new BubbleBounds(10, 20, 70, 100);

    // Act
    bounds.grow(5);

    // Assert- a margin applied to one edge of each pair would move the rectangle and leave the size
    // untouched, which is the failure this catches and the edge assertions above do not.
    expect(bounds.width()).toBe(70);
    expect(bounds.height()).toBe(90);
  });
});
//endregion plugins/message/ext/bubbles/__models/bubble-bounds.test.js