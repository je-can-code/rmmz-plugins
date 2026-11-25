//region plugins/abs/ext/allyai/_models/jabs-stance-facing.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('J-ABS-AllyAI JABS_StanceFacing (unit, pure class, no downstream dependencies)', () =>
{
  let JABS_StanceFacing;

  beforeAll(async () =>
  {
    ({ default: JABS_StanceFacing } = await import('../../../../../../src/plugins/abs/ext/allyai/_models/JABS_StanceFacing.js'));
  });

  it('has no facing before anything has been observed', () =>
  {
    // Arrange
    const facing = new JABS_StanceFacing();

    // Act
    const direction = facing.direction();

    // Assert
    expect(direction).toBe(0);
  });

  it('takes the very first facing it sees outright', () =>
  {
    // Arrange
    const facing = new JABS_StanceFacing();

    // Act
    facing.observe(4, 30);

    // Assert
    expect(facing.direction()).toBe(4);
  });

  it('does not turn for a new facing held one frame short of settling', () =>
  {
    // Arrange
    const facing = new JABS_StanceFacing();
    facing.observe(2, 3);

    // Act
    facing.observe(8, 3);
    facing.observe(8, 3);

    // Assert
    expect(facing.direction()).toBe(2);
  });

  it('turns once a new facing has been held for exactly the settle frames', () =>
  {
    // Arrange
    const facing = new JABS_StanceFacing();
    facing.observe(2, 3);

    // Act
    facing.observe(8, 3);
    facing.observe(8, 3);
    facing.observe(8, 3);

    // Assert
    expect(facing.direction()).toBe(8);
  });

  it('forgets a half-made turn when the leader faces back the settled way', () =>
  {
    // Arrange - two frames toward a new facing, then a glance back.
    const facing = new JABS_StanceFacing();
    facing.observe(2, 3);
    facing.observe(8, 3);
    facing.observe(8, 3);
    facing.observe(2, 3);

    // Act - two more frames of the new facing would settle it if the earlier two had been kept.
    facing.observe(8, 3);
    facing.observe(8, 3);

    // Assert
    expect(facing.direction()).toBe(2);
  });

  it('restarts the count when the leader turns to a different new facing', () =>
  {
    // Arrange - two frames toward one new facing, then a turn to another.
    const facing = new JABS_StanceFacing();
    facing.observe(2, 3);
    facing.observe(8, 3);
    facing.observe(8, 3);

    // Act
    facing.observe(4, 3);
    facing.observe(4, 3);

    // Assert - the second new facing has only two frames of its own.
    expect(facing.direction()).toBe(2);
  });

  it('starts every turn from scratch once a facing has settled', () =>
  {
    // Arrange - a turn that settled.
    const facing = new JABS_StanceFacing();
    facing.observe(2, 2);
    facing.observe(8, 2);
    facing.observe(8, 2);

    // Act - a single frame of yet another facing.
    facing.observe(6, 2);

    // Assert - a leftover count from the settled turn would have settled this one too.
    expect(facing.direction()).toBe(8);
  });
});
//endregion plugins/abs/ext/allyai/_models/jabs-stance-facing.test.js
