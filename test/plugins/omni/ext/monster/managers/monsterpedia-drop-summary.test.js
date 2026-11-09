//region plugins/omni/ext/monster/managers/monsterpedia-drop-summary.test.js
import { describe, expect, it } from 'vitest';
import MonsterpediaDropSummary from '../../../../../../src/plugins/omni/ext/monster/managers/MonsterpediaDropSummary.js';

/**
 * Folding an enemy's drop rolls into one line per item.
 *
 * An item's identity is its kind and its id together, so the fold is tested against an item and an
 * armor sharing an id, which must stay apart; and the best chance is tested with the likelier roll
 * arriving second, so keeping the first roll's chance cannot pass for keeping the best.
 */
describe('MonsterpediaDropSummary', () =>
{
  /**
   * Builds one roll of an enemy's drop list.
   * @param {number} kind The kind of item rolled: 1 for items, 2 for weapons, 3 for armors.
   * @param {number} dataId The id of the item rolled.
   * @param {number} denominator The roll's chance, as a percent.
   * @returns {{kind: number, dataId: number, denominator: number}}
   */
  const buildRoll = (kind, dataId, denominator) => ({ kind, dataId, denominator });

  describe('summarize', () =>
  {
    it('folds every roll of one item into one line, keeping its best chance and counting its rolls', () =>
    {
      // Arrange: a tree's five logs.
      const firstRoll = buildRoll(1, 49, 100);
      const rolls = [ firstRoll, buildRoll(1, 49, 80), buildRoll(1, 49, 50), buildRoll(1, 49, 25), buildRoll(1, 49, 10) ];

      // Act
      const lines = MonsterpediaDropSummary.summarize(rolls);

      // Assert
      expect(lines).toEqual([ { drop: firstRoll, bestChance: 100, rolls: 5 } ]);
    });

    it('raises the best chance when a later roll is the likelier one', () =>
    {
      // Arrange
      const rolls = [ buildRoll(1, 5, 20), buildRoll(1, 5, 70) ];

      // Act
      const [ line ] = MonsterpediaDropSummary.summarize(rolls);

      // Assert
      expect(line.bestChance).toBe(70);
      expect(line.rolls).toBe(2);
    });

    it('keeps an item and an armor that share an id on lines of their own', () =>
    {
      // Arrange
      const item = buildRoll(1, 401, 25);
      const armor = buildRoll(3, 401, 15);

      // Act
      const lines = MonsterpediaDropSummary.summarize([ item, armor ]);

      // Assert
      expect(lines).toEqual([
        { drop: item, bestChance: 25, rolls: 1 },
        { drop: armor, bestChance: 15, rolls: 1 },
      ]);
    });

    it('keeps each item\'s line where that item first appeared', () =>
    {
      // Arrange: the scales come back around after the wings.
      const scales = buildRoll(3, 332, 70);
      const wings = buildRoll(3, 352, 70);
      const fangs = buildRoll(3, 357, 70);
      const rolls = [ scales, wings, buildRoll(3, 332, 65), fangs ];

      // Act
      const lines = MonsterpediaDropSummary.summarize(rolls);

      // Assert
      expect(lines.map(line => line.drop)).toEqual([ scales, wings, fangs ]);
      expect(lines.map(line => line.rolls)).toEqual([ 2, 1, 1 ]);
    });
  });

  describe('lineText', () =>
  {
    it('shows only the chance for an item rolled once', () =>
    {
      // Arrange & Act
      const text = MonsterpediaDropSummary.lineText(25, 1);

      // Assert
      expect(text).toBe('25%');
    });

    it('shows how many times an item rolled several times can drop', () =>
    {
      // Arrange & Act
      const text = MonsterpediaDropSummary.lineText(70, 3);

      // Assert
      expect(text).toBe('70% ×3');
    });
  });
});
//endregion plugins/omni/ext/monster/managers/monsterpedia-drop-summary.test.js
