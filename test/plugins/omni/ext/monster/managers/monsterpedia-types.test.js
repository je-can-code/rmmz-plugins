//region plugins/omni/ext/monster/managers/monsterpedia-types.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import MonsterpediaTypes from '../../../../../../src/plugins/omni/ext/monster/managers/MonsterpediaTypes.js';

/**
 * Which rows the monsterpedia lists, and on which page.
 *
 * Each exclusion is tested on a row that would otherwise belong on the page being asked about, so the
 * only thing that can keep it off is the rule under test; and the kind match is tested from both sides,
 * since a page that listed every kind and a page that listed only its own look identical with one row.
 */
describe('MonsterpediaTypes', () =>
{
  let originalJ;
  let originalDataEnemies;

  beforeAll(() =>
  {
    originalJ = globalThis.J;
    originalDataEnemies = globalThis.$dataEnemies;

    // String.empty is a J-Base runtime augmentation, always present by the time this code runs in-game.
    String.empty = '';

    globalThis.J = {
      OMNI: {
        EXT: {
          MONSTER: {
            Metadata: {
              monsterTypes: [
                { key: 'enemy', name: 'Monsterpedia', iconIndex: 14, showsStats: true },
                { key: 'destructible', name: 'Destructapedia', iconIndex: 210, showsStats: false },
              ],
            },
          },
        },
      },
    };
  });

  afterAll(() =>
  {
    globalThis.J = originalJ;
    globalThis.$dataEnemies = originalDataEnemies;
  });

  /**
   * Builds a database row that belongs on the ordinary enemies' page unless the overrides say otherwise.
   * @param {object} overrides The fields to change.
   * @returns {object}
   */
  const buildRow = (overrides = {}) => ({
    name: 'Slime',
    hideFromMonsterpedia: false,
    monsterType: 'enemy',
    ...overrides,
  });

  describe('positions', () =>
  {
    it('hands back the configured pages, in the order they were authored', () =>
    {
      // Arrange & Act
      const positions = MonsterpediaTypes.positions();

      // Assert
      expect(positions.map(position => position.key)).toEqual([ 'enemy', 'destructible' ]);
    });
  });

  describe('isListed', () =>
  {
    it('never lists the empty slot the database array opens with', () =>
    {
      // Arrange & Act
      const listed = MonsterpediaTypes.isListed(null, 'enemy');

      // Assert
      expect(listed).toBe(false);
    });

    it('never lists a row with no name', () =>
    {
      // Arrange
      const row = buildRow({ name: '' });

      // Act
      const listed = MonsterpediaTypes.isListed(row, 'enemy');

      // Assert
      expect(listed).toBe(false);
    });

    it('never lists a hidden row, even on the page for its own kind', () =>
    {
      // Arrange
      const row = buildRow({ hideFromMonsterpedia: true });

      // Act
      const listed = MonsterpediaTypes.isListed(row, 'enemy');

      // Assert
      expect(listed).toBe(false);
    });

    it('never lists a "===" placeholder, even on the page for its own kind', () =>
    {
      // Arrange
      const row = buildRow({ name: '=== OPEN' });

      // Act
      const listed = MonsterpediaTypes.isListed(row, 'enemy');

      // Assert
      expect(listed).toBe(false);
    });

    it('lists a row on the page for its own kind', () =>
    {
      // Arrange
      const row = buildRow({ monsterType: 'destructible' });

      // Act
      const listed = MonsterpediaTypes.isListed(row, 'destructible');

      // Assert
      expect(listed).toBe(true);
    });

    it('leaves a row off the page for another kind', () =>
    {
      // Arrange
      const row = buildRow({ monsterType: 'destructible' });

      // Act
      const listed = MonsterpediaTypes.isListed(row, 'enemy');

      // Assert
      expect(listed).toBe(false);
    });
  });

  describe('entriesFor', () =>
  {
    it('lists only the rows of the given kind, in database order', () =>
    {
      // Arrange: an empty opening slot, two enemies around a destructible, and two rows that are never listed.
      const slime = buildRow({ name: 'Slime' });
      const crate = buildRow({ name: '*Crate', monsterType: 'destructible' });
      const hidden = buildRow({ name: 'Dummy', hideFromMonsterpedia: true });
      const placeholder = buildRow({ name: '=== TBD' });
      const wolf = buildRow({ name: 'Wolf' });
      globalThis.$dataEnemies = [ null, slime, crate, hidden, placeholder, wolf ];

      // Act
      const enemies = MonsterpediaTypes.entriesFor('enemy');
      const destructibles = MonsterpediaTypes.entriesFor('destructible');

      // Assert
      expect(enemies).toEqual([ slime, wolf ]);
      expect(destructibles).toEqual([ crate ]);
    });
  });

  describe('showsStatsFor', () =>
  {
    it('shows the stats of an entry whose page shows them', () =>
    {
      // Arrange: the first page shows stats, and the page after it does not.
      const row = buildRow({ monsterType: 'enemy' });

      // Act
      const showsStats = MonsterpediaTypes.showsStatsFor(row);

      // Assert
      expect(showsStats).toBe(true);
    });

    it('leaves out the stats of an entry whose page does not show them', () =>
    {
      // Arrange: the last page leaves stats out, and the page before it does not.
      const row = buildRow({ monsterType: 'destructible' });

      // Act
      const showsStats = MonsterpediaTypes.showsStatsFor(row);

      // Assert
      expect(showsStats).toBe(false);
    });
  });
});
//endregion plugins/omni/ext/monster/managers/monsterpedia-types.test.js
