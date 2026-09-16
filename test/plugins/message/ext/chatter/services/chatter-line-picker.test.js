//region plugins/message/ext/chatter/services/chatter-line-picker.test.js
import { describe, expect, it } from 'vitest';

import ChatterLinePicker from '../../../../../../src/plugins/message/ext/chatter/services/ChatterLinePicker.js';

/**
 * Every pool below holds three lines rather than two, because the thing being tested is that the
 * *previous* line is removed from the running and the others are not. With two lines, "skip the last
 * one" and "alternate" are the same program, and alternating is exactly the pattern a player notices.
 */
describe('J-Message-Chatter ChatterLinePicker (direct src import)', () =>
{
  /**
   * Three distinct things a shopkeeper might say.
   * @type {string[]}
   */
  const pool = [ 'Half price today.', 'Anything I can get you?', 'Mind the step.' ];

  it('picks the line the random source points at', () =>
  {
    // Arrange & Act
    const line = ChatterLinePicker.pick(pool, '', () => 0);

    // Assert
    expect(line).toBe('Half price today.');
  });

  it('picks a later line for a source further along the range', () =>
  {
    // Arrange & Act
    const line = ChatterLinePicker.pick(pool, '', () => 0.7);

    // Assert
    expect(line).toBe('Mind the step.');
  });

  it('never says the same thing twice in a row', () =>
  {
    // Arrange- a source pointing at the very start of the pool, which is the line just said.
    const previous = 'Half price today.';

    // Act
    const line = ChatterLinePicker.pick(pool, previous, () => 0);

    // Assert
    expect(line).toBe('Anything I can get you?');
  });

  it('leaves the rest of the pool in the running', () =>
  {
    // Arrange- the line just said sits in the middle, so the pool either side of it has to survive.
    const previous = 'Anything I can get you?';

    // Act
    const line = ChatterLinePicker.pick(pool, previous, () => 0.9);

    // Assert
    expect(line).toBe('Mind the step.');
  });

  it('keeps working for a character with only one thing to say', () =>
  {
    // Arrange- very common: most chattering NPCs will carry a single line.
    const single = [ 'Mind the step.' ];

    // Act
    const line = ChatterLinePicker.pick(single, 'Mind the step.', () => 0);

    // Assert- repeating is the only thing left, and it is what an author asked for by writing one
    // line. Refusing to pick would leave the character silent forever instead.
    expect(line).toBe('Mind the step.');
  });

  it('keeps working for a pool an author filled with the same line twice', () =>
  {
    // Arrange
    const duplicated = [ 'Mind the step.', 'Mind the step.' ];

    // Act
    const line = ChatterLinePicker.pick(duplicated, 'Mind the step.', () => 0);

    // Assert
    expect(line).toBe('Mind the step.');
  });

  it('picks freely when the character has not spoken yet', () =>
  {
    // Arrange- the very first line of the game session, where there is no previous line at all.
    const line = ChatterLinePicker.pick(pool, '', () => 0.4);

    // Assert- the whole pool is still in the running, so the middle of the range is the middle line.
    expect(line).toBe('Anything I can get you?');
  });
});
//endregion plugins/message/ext/chatter/services/chatter-line-picker.test.js