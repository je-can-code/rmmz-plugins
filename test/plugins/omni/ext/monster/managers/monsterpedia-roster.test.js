//region plugins/omni/ext/monster/managers/monsterpedia-roster.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import MonsterpediaRoster from '../../../../../../src/plugins/omni/ext/monster/managers/MonsterpediaRoster.js';

/**
 * The sprite each enemy wears, read off J-ABS's roster of enemy templates.
 *
 * The roster is a map's events indexed by event id, which is also enemy id, so the lookup is tested
 * among neighbors: an enemy that read a sibling's event would wear the wrong sprite and nothing else
 * would notice.
 */
describe('MonsterpediaRoster', () =>
{
  let originalJabsEngine;
  let rosterEvents;

  beforeAll(() =>
  {
    originalJabsEngine = globalThis.JABS_Engine;

    // String.empty is a J-Base runtime augmentation, always present by the time this code runs in-game.
    String.empty = '';

    // J-ABS hands over whatever its roster fetch has produced so far.
    globalThis.JABS_Engine = { getEnemyCloneList: () => rosterEvents };
  });

  afterAll(() =>
  {
    globalThis.JABS_Engine = originalJabsEngine;
  });

  /**
   * Builds a roster event wearing the given sheet and character on its first page.
   * @param {number} id The event id, which is also the enemy id.
   * @param {string} characterName The sheet the event wears.
   * @param {number} characterIndex The character on that sheet.
   * @returns {object}
   */
  const buildRosterEvent = (id, characterName, characterIndex) => ({
    id,
    pages: [ { image: { characterName, characterIndex, direction: 2, pattern: 1 } } ],
  });

  describe('characterOf', () =>
  {
    it('wears nothing before J-ABS\'s roster fetch has landed', () =>
    {
      // Arrange
      rosterEvents = null;

      // Act
      const character = MonsterpediaRoster.characterOf(2);

      // Assert
      expect(character).toEqual({ characterName: '', characterIndex: 0 });
    });

    it('wears nothing for an enemy the roster holds no event for', () =>
    {
      // Arrange: the roster opens with an empty slot and ends at event 2.
      rosterEvents = [ null, buildRosterEvent(1, '$m_slime', 0), buildRosterEvent(2, '$m_wolf', 0) ];

      // Act
      const emptySlot = MonsterpediaRoster.characterOf(0);
      const pastTheEnd = MonsterpediaRoster.characterOf(9);

      // Assert
      expect(emptySlot).toEqual({ characterName: '', characterIndex: 0 });
      expect(pastTheEnd).toEqual({ characterName: '', characterIndex: 0 });
    });

    it('reads the sheet and character the enemy\'s own event wears, not a neighbor\'s', () =>
    {
      // Arrange
      rosterEvents = [
        null,
        buildRosterEvent(1, '$m_slime', 0),
        buildRosterEvent(2, 'Monster', 5),
        buildRosterEvent(3, '$m_wolf', 0),
      ];

      // Act
      const character = MonsterpediaRoster.characterOf(2);

      // Assert
      expect(character).toEqual({ characterName: 'Monster', characterIndex: 5 });
    });
  });
});
//endregion plugins/omni/ext/monster/managers/monsterpedia-roster.test.js
