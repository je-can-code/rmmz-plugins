//region plugins/abs/ext/allyai/_models/jabs-stance-stall.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('J-ABS-AllyAI JABS_StanceStall (unit, pure class, no downstream dependencies)', () =>
{
  let JABS_StanceStall;

  // the drift tolerance every case below runs with, unless it is the thing under test.
  const DRIFT = 0.5;

  beforeAll(async () =>
  {
    ({ default: JABS_StanceStall } = await import('../../../../../../src/plugins/abs/ext/allyai/_models/JABS_StanceStall.js'));
  });

  it('treats the very first look at a spot as a fresh attempt rather than a wasted frame', () =>
  {
    // Arrange
    const stall = new JABS_StanceStall();

    // Act
    stall.observe(5, 10, 10, 0.05, DRIFT);

    // Assert
    expect(stall.isStalled(1)).toBe(false);
  });

  it('restarts the attempt when the spot moves along x past the drift tolerance', () =>
  {
    // Arrange
    const stall = new JABS_StanceStall();
    stall.observe(5, 10, 10, 0.05, DRIFT);
    stall.observe(5, 10, 10, 0.05, DRIFT);

    // Act
    // the y coordinate is deliberately unchanged, so only the x move can explain the reset.
    stall.observe(5, 11, 10, 0.05, DRIFT);

    // Assert
    expect(stall.isStalled(1)).toBe(false);
  });

  it('restarts the attempt when the spot moves along y past the drift tolerance', () =>
  {
    // Arrange
    const stall = new JABS_StanceStall();
    stall.observe(5, 10, 10, 0.05, DRIFT);
    stall.observe(5, 10, 10, 0.05, DRIFT);

    // Act
    // the x coordinate is deliberately unchanged, so only the y move can explain the reset.
    stall.observe(5, 10, 11, 0.05, DRIFT);

    // Assert
    expect(stall.isStalled(1)).toBe(false);
  });

  it('keeps the attempt when the spot drifts by less than the tolerance', () =>
  {
    // Arrange - a shuffling ally drags its spot a hair each frame; that is the shuffle, not a new spot.
    const stall = new JABS_StanceStall();
    stall.observe(5, 10, 10, 0.05, DRIFT);

    // Act
    stall.observe(5, 10.2, 10, 0.05, DRIFT);

    // Assert - the frame counted as wasted against the same attempt.
    expect(stall.isStalled(1)).toBe(true);
  });

  it('keeps the attempt when the spot drifts by exactly the tolerance', () =>
  {
    // Arrange - the boundary: a drift of exactly the tolerance is still the same spot.
    const stall = new JABS_StanceStall();
    stall.observe(5, 10, 10, 0.05, DRIFT);

    // Act
    stall.observe(5, 10.5, 10, 0.05, DRIFT);

    // Assert
    expect(stall.isStalled(1)).toBe(true);
  });

  it('measures drift from where the attempt began, not from the frame before', () =>
  {
    // Arrange - two small drifts in a row that together cross the tolerance.
    const stall = new JABS_StanceStall();
    stall.observe(5, 10, 10, 0.05, DRIFT);
    stall.observe(5, 10.3, 10, 0.05, DRIFT);

    // Act
    stall.observe(5, 10.6, 10, 0.05, DRIFT);

    // Assert - 0.6 from where the attempt began is a different spot, so the count started over.
    expect(stall.isStalled(1)).toBe(false);
  });

  it('counts a frame that got no closer to an unmoved spot', () =>
  {
    // Arrange
    const stall = new JABS_StanceStall();
    stall.observe(5, 10, 10, 0.05, DRIFT);

    // Act
    stall.observe(5, 10, 10, 0.05, DRIFT);

    // Assert
    expect(stall.isStalled(1)).toBe(true);
  });

  it('forgives the accumulated frames once the ally beats its best distance', () =>
  {
    // Arrange
    const stall = new JABS_StanceStall();
    stall.observe(5, 10, 10, 0.05, DRIFT);
    stall.observe(5, 10, 10, 0.05, DRIFT);

    // Act
    stall.observe(4, 10, 10, 0.05, DRIFT);

    // Assert
    expect(stall.isStalled(1)).toBe(false);
  });

  it('does not count a gain smaller than the progress epsilon', () =>
  {
    // Arrange
    const stall = new JABS_StanceStall();
    stall.observe(5, 10, 10, 0.05, DRIFT);

    // Act
    // 4.99 is nearer than 5 but not by the 0.05 the epsilon demands.
    stall.observe(4.99, 10, 10, 0.05, DRIFT);

    // Assert
    expect(stall.isStalled(1)).toBe(true);
  });

  it('is not stalled while it still has frames of patience left', () =>
  {
    // Arrange
    const stall = new JABS_StanceStall();
    stall.observe(5, 10, 10, 0.05, DRIFT);
    stall.observe(5, 10, 10, 0.05, DRIFT);
    stall.observe(5, 10, 10, 0.05, DRIFT);

    // Act
    const stalled = stall.isStalled(3);

    // Assert
    expect(stalled).toBe(false);
  });

  it('is stalled on the frame its patience runs out exactly', () =>
  {
    // Arrange
    const stall = new JABS_StanceStall();
    stall.observe(5, 10, 10, 0.05, DRIFT);
    stall.observe(5, 10, 10, 0.05, DRIFT);
    stall.observe(5, 10, 10, 0.05, DRIFT);

    // Act
    const stalled = stall.isStalled(2);

    // Assert
    expect(stalled).toBe(true);
  });

  it('clears a stall when the attempt is abandoned', () =>
  {
    // Arrange
    const stall = new JABS_StanceStall();
    stall.observe(5, 10, 10, 0.05, DRIFT);
    stall.observe(5, 10, 10, 0.05, DRIFT);

    // Act
    stall.reset();

    // Assert
    expect(stall.isStalled(1)).toBe(false);
  });

  it('measures from scratch after a reset even when the spot never moved', () =>
  {
    // Arrange
    const stall = new JABS_StanceStall();
    stall.observe(2, 10, 10, 0.05, DRIFT);
    stall.reset();

    // Act
    // 9 is far worse than the 2 recorded before the reset, so a surviving best distance would
    // refuse the 8.9 below as no progress at all.
    stall.observe(9, 10, 10, 0.05, DRIFT);
    stall.observe(9, 10, 10, 0.05, DRIFT);
    stall.observe(8.9, 10, 10, 0.05, DRIFT);

    // Assert
    expect(stall.isStalled(1)).toBe(false);
  });
});
//endregion plugins/abs/ext/allyai/_models/jabs-stance-stall.test.js
