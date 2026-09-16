//region plugins/message/ext/chatter/services/chatter-scheduler.test.js
import { describe, expect, it } from 'vitest';

import ChatterProfile from '../../../../../../src/plugins/message/ext/chatter/__models/ChatterProfile.js';
import ChatterScheduler from '../../../../../../src/plugins/message/ext/chatter/services/ChatterScheduler.js';

/**
 * These are the rules that decide whether the player hears anything at all, so every boundary gets a
 * value on each side of it rather than one comfortably inside. A radius comparison written with the
 * wrong operator is invisible in play - it just means the last tile of earshot is silent - and it is
 * exactly the sort of thing that survives a test suite made of midpoints.
 */
describe('J-Message-Chatter ChatterScheduler (direct src import)', () =>
{
  /**
   * A profile with a pool and a five tile radius.
   * @param {object} values Anything to override.
   * @returns {ChatterProfile}
   */
  function talkative(values = {})
  {
    const base = { lines: [ 'Lovely weather.' ] };

    return ChatterProfile.fromValues(Object.assign(base, values));
  }

  describe('earshot', () =>
  {
    it('hears a character standing closer than the radius', () =>
    {
      // Arrange
      const profile = talkative({ radius: 5 });

      // Act
      const heard = ChatterScheduler.isWithinEarshot(4, profile);

      // Assert
      expect(heard).toBe(true);
    });

    it('hears a character standing exactly at the radius', () =>
    {
      // Arrange- the tile an author counted to when they wrote the number is inside it.
      const profile = talkative({ radius: 5 });

      // Act
      const heard = ChatterScheduler.isWithinEarshot(5, profile);

      // Assert
      expect(heard).toBe(true);
    });

    it('does not hear a character one tile past the radius', () =>
    {
      // Arrange
      const profile = talkative({ radius: 5 });

      // Act
      const heard = ChatterScheduler.isWithinEarshot(6, profile);

      // Assert
      expect(heard).toBe(false);
    });
  });

  describe('rolling a wait', () =>
  {
    it('waits no time at all at the bottom of the range', () =>
    {
      // Arrange
      const profile = talkative({ delay: 300 });

      // Act
      const waited = ChatterScheduler.rollDelay(profile, () => 0);

      // Assert
      expect(waited).toBe(0);
    });

    it('lands inside the range for a source in the middle of it', () =>
    {
      // Arrange
      const profile = talkative({ delay: 300 });

      // Act
      const waited = ChatterScheduler.rollDelay(profile, () => 0.5);

      // Assert- pinned to the value the implementation actually produces rather than recomputed
      // from the inputs, so a change to the arithmetic has to be looked at rather than agreed with.
      expect(waited).toBe(150);
    });

    it('can wait the whole of the configured delay', () =>
    {
      // Arrange- a source just under one, which is the most `Math.random` ever answers.
      const profile = talkative({ delay: 300 });

      // Act
      const waited = ChatterScheduler.rollDelay(profile, () => 0.9999);

      // Assert- the number an author wrote has to be reachable, or it is a value the game can never
      // actually wait.
      expect(waited).toBe(300);
    });
  });

  describe('deciding to speak', () =>
  {
    it('speaks when the wait is over and the player is close enough', () =>
    {
      // Arrange
      const profile = talkative({ radius: 5 });

      // Act
      const speaks = ChatterScheduler.shouldSpeak(3, profile, 0);

      // Assert
      expect(speaks).toBe(true);
    });

    it('speaks when the wait has run past zero', () =>
    {
      // Arrange
      const profile = talkative({ radius: 5 });

      // Act
      const speaks = ChatterScheduler.shouldSpeak(3, profile, -1);

      // Assert
      expect(speaks).toBe(true);
    });

    it('stays quiet while there is still a wait to serve', () =>
    {
      // Arrange
      const profile = talkative({ radius: 5 });

      // Act
      const speaks = ChatterScheduler.shouldSpeak(3, profile, 1);

      // Assert
      expect(speaks).toBe(false);
    });

    it('stays quiet when the player is too far away to hear it', () =>
    {
      // Arrange
      const profile = talkative({ radius: 5 });

      // Act
      const speaks = ChatterScheduler.shouldSpeak(6, profile, 0);

      // Assert
      expect(speaks).toBe(false);
    });

    it('says the moment has come even for a character with nothing to say', () =>
    {
      // Arrange- an event with chatter tuning on it but no lines, which is what page two of a
      // character who has stopped being chatty looks like.
      const profile = ChatterProfile.fromValues({ radius: 5 });

      // Act
      const speaks = ChatterScheduler.shouldSpeak(1, profile, 0);

      // Assert- this answers about the moment, not about the pool. Whoever holds the pool is the one
      // who decides there is nothing to pick from, and saying so here as well would make one of the
      // two checks incapable of changing anything.
      expect(speaks).toBe(true);
    });
  });

  describe('typing a line out', () =>
  {
    it('shows nothing on the frame a line appears', () =>
    {
      // Arrange & Act
      const revealed = ChatterScheduler.revealedCount(0, 2, 20);

      // Assert
      expect(revealed).toBe(0);
    });

    it('shows one character per the configured number of frames', () =>
    {
      // Arrange & Act
      const revealed = ChatterScheduler.revealedCount(7, 2, 20);

      // Assert
      expect(revealed).toBe(3);
    });

    it('never shows more of a line than the line has', () =>
    {
      // Arrange & Act
      const revealed = ChatterScheduler.revealedCount(500, 2, 20);

      // Assert
      expect(revealed).toBe(20);
    });

    it('shows the whole line at once at a speed of no frames per character', () =>
    {
      // Arrange- the setting somebody reaches for when they want chatter to appear whole, and the
      // one that would divide by zero if it were not answered before the arithmetic.
      const revealed = ChatterScheduler.revealedCount(0, 0, 20);

      // Assert
      expect(revealed).toBe(20);
    });
  });
});
//endregion plugins/message/ext/chatter/services/chatter-scheduler.test.js