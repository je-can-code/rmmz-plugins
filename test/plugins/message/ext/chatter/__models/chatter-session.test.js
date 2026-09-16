//region plugins/message/ext/chatter/__models/chatter-session.test.js
import { describe, expect, it } from 'vitest';

import ChatterProfile from '../../../../../../src/plugins/message/ext/chatter/__models/ChatterProfile.js';
import ChatterSession from '../../../../../../src/plugins/message/ext/chatter/__models/ChatterSession.js';

/**
 * The whole reason this class exists is the ordering rule: a line's time on screen is counted from
 * when it finished typing itself out, never from when it appeared. Every case below that touches
 * the duration is really testing that, from one side or the other.
 */
describe('J-Message-Chatter ChatterSession (direct src import)', () =>
{
  /**
   * A session of a line that has just started being said.
   * @param {boolean} forced Whether a plugin command demanded it.
   * @returns {ChatterSession}
   */
  function started(forced = false, persistent = false)
  {
    const profile = ChatterProfile.fromValues({ lines: [ 'Half price today.' ] });

    return new ChatterSession('Half price today.', profile, forced, 180, persistent);
  }

  it('remembers the line it was given', () =>
  {
    // Arrange & Act
    const session = started();

    // Assert
    expect(session.line()).toBe('Half price today.');
  });

  it('remembers the profile it is being said under', () =>
  {
    // Arrange & Act
    const session = started();

    // Assert- the bubble reads its speed and its side off this rather than off the character, so a
    // page changed mid-line cannot move a bubble that is already on screen.
    expect(session.profile()
      .speed()).toBe(2);
  });

  it('starts with the whole of its time on screen ahead of it', () =>
  {
    // Arrange & Act
    const session = started();

    // Assert
    expect(session.durationRemaining()).toBe(180);
  });

  it('starts with nothing revealed', () =>
  {
    // Arrange & Act
    const session = started();

    // Assert
    expect(session.hasRevealed()).toBe(false);
  });

  it('knows a line a plugin command demanded', () =>
  {
    // Arrange & Act
    const session = started(true);

    // Assert
    expect(session.isForced()).toBe(true);
  });

  it('knows a line a character started on their own', () =>
  {
    // Arrange & Act
    const session = started(false);

    // Assert
    expect(session.isForced()).toBe(false);
  });

  it('comes down for a conversation unless it was told not to', () =>
  {
    // Arrange & Act
    const session = started(true, false);

    // Assert- a scene demanding a line is not the same as a scene wanting it to share the screen
    // with dialogue, so the two are separate answers rather than one.
    expect(session.isForced()).toBe(true);
    expect(session.isPersistent()).toBe(false);
  });

  it('stays up through a conversation when it was told to', () =>
  {
    // Arrange & Act
    const session = started(true, true);

    // Assert
    expect(session.isPersistent()).toBe(true);
  });

  it('takes the word of the bubble that the line has typed itself out', () =>
  {
    // Arrange
    const session = started();

    // Act
    session.flagRevealed();

    // Assert
    expect(session.hasRevealed()).toBe(true);
  });

  it('is never finished while the line is still typing itself out', () =>
  {
    // Arrange
    const session = started();

    // Act- a duration long spent, with the reveal never having completed.
    session.setDurationRemaining(0);

    // Assert- the reveal is what starts the clock, so a line nobody has finished reading out cannot
    // have run out of reading time.
    expect(session.isFinished()).toBe(false);
  });

  it('is not finished while a revealed line still has time on screen', () =>
  {
    // Arrange
    const session = started();
    session.flagRevealed();

    // Act
    session.setDurationRemaining(1);

    // Assert
    expect(session.isFinished()).toBe(false);
  });

  it('is finished once a revealed line has run out of time on screen', () =>
  {
    // Arrange
    const session = started();
    session.flagRevealed();

    // Act
    session.setDurationRemaining(0);

    // Assert
    expect(session.isFinished()).toBe(true);
  });
});
//endregion plugins/message/ext/chatter/__models/chatter-session.test.js