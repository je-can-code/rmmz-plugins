//region plugins/_base/database/rpg-drop-item.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('RPG_DropItem (direct src import)', () =>
{
  let RPG_DropItem;

  beforeAll(async () =>
  {
    ({ default: RPG_DropItem } = await import('../../../../../src/plugins/_base/core/database/_data/RPG_DropItem.js'));
  });

  describe('constructor', () =>
  {
    it('maps dataId/denominator/kind from the source object', () =>
    {
      // Arrange & Act
      const drop = new RPG_DropItem({ dataId: 5, denominator: 10, kind: 1 });

      // Assert
      expect(drop.dataId).toBe(5);
      expect(drop.denominator).toBe(10);
      expect(drop.kind).toBe(1);
    });
  });

  describe('TypeFromLetter', () =>
  {
    it.each([
      [ 'i', 1 ], [ 'item', 1 ],
      [ 'w', 2 ], [ 'weapon', 2 ],
      [ 'a', 3 ], [ 'armor', 3 ],
    ])('maps "%s" to type %i', (letter, expected) =>
    {
      expect(RPG_DropItem.TypeFromLetter(letter)).toBe(expected);
    });

    it('is case-insensitive', () =>
    {
      expect(RPG_DropItem.TypeFromLetter('ITEM')).toBe(1);
    });

    it('throws for an unrecognized letter', () =>
    {
      // Arrange
      const attempt = () => RPG_DropItem.TypeFromLetter('z');

      // Act & Assert
      expect(attempt).toThrow('invalid item type letter provided: [z].');
    });
  });

  describe('TypeFromNumber', () =>
  {
    it.each([
      [ 1, 'i' ], [ 2, 'w' ], [ 3, 'a' ],
    ])('maps %i to "%s"', (number, expected) =>
    {
      expect(RPG_DropItem.TypeFromNumber(number)).toBe(expected);
    });

    it('throws for an unrecognized number', () =>
    {
      // Arrange
      const attempt = () => RPG_DropItem.TypeFromNumber(999);

      // Act & Assert
      expect(attempt).toThrow('invalid item type number provided: [999].');
    });
  });
});
//endregion plugins/_base/database/rpg-drop-item.test.js
