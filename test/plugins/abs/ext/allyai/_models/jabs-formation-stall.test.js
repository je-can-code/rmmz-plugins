//region plugins/abs/ext/allyai/_models/jabs-formation-stall.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('J-ABS-AllyAI JABS_FormationStall (unit, pure class, no downstream dependencies)', () =>
{
  let JABS_FormationStall;

  beforeAll(async () =>
  {
    ({ default: JABS_FormationStall } = await import('../../../../../../src/plugins/abs/ext/allyai/_models/JABS_FormationStall.js'));
  });

  it('treats the very first look at a slot as a fresh attempt rather than a wasted frame', () =>
  {
    // Arrange
    const stall = new JABS_FormationStall();

    // Act
    stall.observe(5, 10, 10, 0.05);

    // Assert
    expect(stall.isStalled(1)).toBe(false);
  });

  it('restarts the attempt when the slot moves along x', () =>
  {
    // Arrange
    const stall = new JABS_FormationStall();
    stall.observe(5, 10, 10, 0.05);
    stall.observe(5, 10, 10, 0.05);

    // Act
    // the y coordinate is deliberately unchanged, so only the x move can explain the reset.
    stall.observe(5, 11, 10, 0.05);

    // Assert
    expect(stall.isStalled(1)).toBe(false);
  });

  it('restarts the attempt when the slot moves along y', () =>
  {
    // Arrange
    const stall = new JABS_FormationStall();
    stall.observe(5, 10, 10, 0.05);
    stall.observe(5, 10, 10, 0.05);

    // Act
    // the x coordinate is deliberately unchanged, so only the y move can explain the reset.
    stall.observe(5, 10, 11, 0.05);

    // Assert
    expect(stall.isStalled(1)).toBe(false);
  });

  it('counts a frame that got no closer to an unmoved slot', () =>
  {
    // Arrange
    const stall = new JABS_FormationStall();
    stall.observe(5, 10, 10, 0.05);

    // Act
    stall.observe(5, 10, 10, 0.05);

    // Assert
    expect(stall.isStalled(1)).toBe(true);
  });

  it('forgives the accumulated frames once the ally beats its best distance', () =>
  {
    // Arrange
    const stall = new JABS_FormationStall();
    stall.observe(5, 10, 10, 0.05);
    stall.observe(5, 10, 10, 0.05);

    // Act
    stall.observe(4, 10, 10, 0.05);

    // Assert
    expect(stall.isStalled(1)).toBe(false);
  });

  it('does not count a gain smaller than the progress epsilon', () =>
  {
    // Arrange
    const stall = new JABS_FormationStall();
    stall.observe(5, 10, 10, 0.05);

    // Act
    // 4.99 is nearer than 5 but not by the 0.05 the epsilon demands.
    stall.observe(4.99, 10, 10, 0.05);

    // Assert
    expect(stall.isStalled(1)).toBe(true);
  });

  it('is not stalled while it still has frames of patience left', () =>
  {
    // Arrange
    const stall = new JABS_FormationStall();
    stall.observe(5, 10, 10, 0.05);
    stall.observe(5, 10, 10, 0.05);
    stall.observe(5, 10, 10, 0.05);

    // Act
    const stalled = stall.isStalled(3);

    // Assert
    expect(stalled).toBe(false);
  });

  it('is stalled on the frame its patience runs out exactly', () =>
  {
    // Arrange
    const stall = new JABS_FormationStall();
    stall.observe(5, 10, 10, 0.05);
    stall.observe(5, 10, 10, 0.05);
    stall.observe(5, 10, 10, 0.05);

    // Act
    const stalled = stall.isStalled(2);

    // Assert
    expect(stalled).toBe(true);
  });

  it('clears a stall when the attempt is abandoned', () =>
  {
    // Arrange
    const stall = new JABS_FormationStall();
    stall.observe(5, 10, 10, 0.05);
    stall.observe(5, 10, 10, 0.05);

    // Act
    stall.reset();

    // Assert
    expect(stall.isStalled(1)).toBe(false);
  });

  it('measures from scratch after a reset even when the slot never moved', () =>
  {
    // Arrange
    const stall = new JABS_FormationStall();
    stall.observe(2, 10, 10, 0.05);
    stall.reset();

    // Act
    // 9 is far worse than the 2 recorded before the reset, so a surviving best distance would
    // refuse the 8.9 below as no progress at all.
    stall.observe(9, 10, 10, 0.05);
    stall.observe(9, 10, 10, 0.05);
    stall.observe(8.9, 10, 10, 0.05);

    // Assert
    expect(stall.isStalled(1)).toBe(false);
  });
});
//endregion plugins/abs/ext/allyai/_models/jabs-formation-stall.test.js