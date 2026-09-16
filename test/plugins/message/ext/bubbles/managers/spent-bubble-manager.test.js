//region plugins/message/ext/bubbles/managers/spent-bubble-manager.test.js
import { afterEach, describe, expect, it } from 'vitest';

import SpentBubbleManager
  from '../../../../../../src/plugins/message/ext/bubbles/managers/SpentBubbleManager.js';

/**
 * Every fixture here holds two speakers, because a conversation is the only situation this class
 * exists for - with one entry loaded, "forgot the right speaker" and "forgot everybody" are the same
 * program, and a manager that had collapsed into the second would wipe a conversation every time
 * anybody opened their mouth.
 */
describe('J-Message-Bubbles SpentBubbleManager (direct src import)', () =>
{
  afterEach(() =>
  {
    // the map is a static that outlives the test file.
    SpentBubbleManager.clear();
  });

  /**
   * A stand-in for everything a finished message leaves behind.
   * @param {string} speakerName Whose line it was.
   * @returns {object}
   */
  function retained(speakerName)
  {
    return {
      speakerName,
      glyphs: [],
      frame: 0,
    };
  }

  it('starts a conversation with nobody having spoken', () =>
  {
    // Arrange & Act
    const empty = SpentBubbleManager.isEmpty();

    // Assert
    expect(empty).toBe(true);
  });

  it('remembers a speaker after their message closes', () =>
  {
    // Arrange & Act
    SpentBubbleManager.retain('a1', retained('Jerald'));

    // Assert
    expect(SpentBubbleManager.isEmpty()).toBe(false);
    expect(SpentBubbleManager.entries()).toEqual([ { token: 'a1', entry: retained('Jerald') } ]);
  });

  it('holds two speakers at once', () =>
  {
    // Arrange
    SpentBubbleManager.retain('a1', retained('Jerald'));

    // Act
    SpentBubbleManager.retain('a2', retained('Rupert'));

    // Assert- the whole point: a conversation is more than one person.
    expect(SpentBubbleManager.entries()
      .map(({ token }) => token)).toEqual([ 'a1', 'a2' ]);
  });

  it('replaces a speaker own bubble rather than stacking a second', () =>
  {
    // Arrange
    SpentBubbleManager.retain('a1', retained('Jerald'));

    // Act
    SpentBubbleManager.retain('a1', retained('Jerald again'));

    // Assert- four lines in a row should leave one bubble behind, not four in the same place.
    const listed = SpentBubbleManager.entries();
    expect(listed.length).toBe(1);
    expect(listed[ 0 ].entry.speakerName).toBe('Jerald again');
  });

  it('forgets one speaker without disturbing the other', () =>
  {
    // Arrange
    SpentBubbleManager.retain('a1', retained('Jerald'));
    SpentBubbleManager.retain('a2', retained('Rupert'));

    // Act
    SpentBubbleManager.release('a1');

    // Assert- the near-miss that matters: releasing the speaker about to talk must leave the person
    // they are talking to exactly where they were.
    expect(SpentBubbleManager.entries()
      .map(({ token }) => token)).toEqual([ 'a2' ]);
  });

  it('shrugs at being asked to forget somebody who never spoke', () =>
  {
    // Arrange
    SpentBubbleManager.retain('a2', retained('Rupert'));

    // Act
    // every message releases its own target on the way in, and most speakers have said nothing yet.
    SpentBubbleManager.release('a1');

    // Assert
    expect(SpentBubbleManager.entries()
      .map(({ token }) => token)).toEqual([ 'a2' ]);
  });

  it('ends a conversation by forgetting everybody in it', () =>
  {
    // Arrange
    SpentBubbleManager.retain('a1', retained('Jerald'));
    SpentBubbleManager.retain('a2', retained('Rupert'));

    // Act
    SpentBubbleManager.clear();

    // Assert
    expect(SpentBubbleManager.isEmpty()).toBe(true);
    expect(SpentBubbleManager.entries()).toEqual([]);
  });

  it('hands back each speaker alongside the target that identifies them', () =>
  {
    // Arrange
    SpentBubbleManager.retain('e12', retained('The Signpost'));

    // Act
    const [ listed ] = SpentBubbleManager.entries();

    // Assert- the token is the identity, because the character it resolves to changes as the party
    // is reordered while the token does not.
    expect(listed.token).toBe('e12');
    expect(listed.entry.speakerName).toBe('The Signpost');
  });
});
//endregion plugins/message/ext/bubbles/managers/spent-bubble-manager.test.js