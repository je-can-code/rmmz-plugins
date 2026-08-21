//region plugins/jafting/ext/create/models/crafting-profession.test.js
import { beforeAll, describe, expect, it } from 'vitest';

import CraftingProfession from '../../../../../../src/plugins/jafting/ext/create/__models/CraftingProfession.js';

/**
 * A profession decides two things a category cannot: which scrap buys its recipes, and what a tier
 * costs. Both answers have a deliberate "no" - a craft whose recipes are found in the world rather
 * than taught by a shop is not misconfigured, so every path out of this class has to distinguish
 * "unpriced" from "free" without either one throwing.
 */
describe('CraftingProfession (direct src import)', () =>
{
  beforeAll(() =>
  {
    // the class seeds string fields from String.empty, which J-Base installs onto the String constructor.
    if (String.empty === undefined)
    {
      Object.defineProperty(String, 'empty', {
        value: '',
        writable: false,
        configurable: true,
      });
    }
  });

  /**
   * Builds a profession with a price ladder, defaulting to one that genuinely sells things.
   * @param {number[]} tierPrices What each tier costs, lowest first.
   * @param {number} [scrapItemId] The currency spent, or 0 for a profession that sells nothing.
   * @returns {CraftingProfession}
   */
  function profession(tierPrices, scrapItemId = 152)
  {
    return new CraftingProfession(
      'smithing',
      'Smithing',
      42,
      'makes the pointy things',
      scrapItemId,
      tierPrices);
  }

  describe('construction', () =>
  {
    it('keeps every authored field on the instance', () =>
    {
      // Arrange & Act
      const built = new CraftingProfession('cooking', 'Cooking', 7, 'makes the edible things', 151, [ 3, 8 ]);

      // Assert
      expect(built.key).toBe('cooking');
      expect(built.name).toBe('Cooking');
      expect(built.iconIndex).toBe(7);
      expect(built.description).toBe('makes the edible things');
      expect(built.scrapItemId).toBe(151);
      expect(built.tierPrices).toEqual([ 3, 8 ]);
    });
  });

  describe('priceForTier', () =>
  {
    it('answers the price sitting at the requested rung', () =>
    {
      // Arrange
      const subject = profession([ 10, 20, 40, 70 ]);

      // Act
      const price = subject.priceForTier(3);

      // Assert
      expect(price).toBe(40);
    });

    it('reads tier one from the front of the table rather than one place in', () =>
    {
      // Arrange
      const subject = profession([ 10, 20, 40, 70 ]);

      // Act
      const price = subject.priceForTier(1);

      // Assert
      expect(price).toBe(10);
    });

    it('answers the deepest rung when asked for the last tier', () =>
    {
      // Arrange
      const subject = profession([ 10, 20, 40, 70 ]);

      // Act
      const price = subject.priceForTier(4);

      // Assert
      expect(price).toBe(70);
    });

    it('answers zero for an untiered recipe', () =>
    {
      // Arrange
      const subject = profession([ 10, 20, 40, 70 ]);

      // Act
      const price = subject.priceForTier(0);

      // Assert
      expect(price).toBe(0);
    });

    it('answers zero for a negative tier', () =>
    {
      // Arrange
      const subject = profession([ 10, 20, 40, 70 ]);

      // Act
      const price = subject.priceForTier(-2);

      // Assert
      expect(price).toBe(0);
    });

    it('answers zero rather than the deepest price for a tier past the end of the table', () =>
    {
      // Arrange - a four rung ladder asked for a fifth rung, which is how a roster outgrows its economy.
      const subject = profession([ 10, 20, 40, 70 ]);

      // Act
      const price = subject.priceForTier(5);

      // Assert
      expect(price).toBe(0);
    });

    it('answers zero for every tier when the table is empty', () =>
    {
      // Arrange
      const subject = profession([]);

      // Act
      const price = subject.priceForTier(1);

      // Assert
      expect(price).toBe(0);
    });
  });

  describe('isForSale', () =>
  {
    it('sells when it has both a currency and a priced rung', () =>
    {
      // Arrange
      const subject = profession([ 10 ], 152);

      // Act
      const forSale = subject.isForSale();

      // Assert
      expect(forSale).toBe(true);
    });

    it('sells nothing when it names no currency, even with a full price table', () =>
    {
      // Arrange - the table is deliberately generous, so only the missing currency can fail this.
      const subject = profession([ 10, 20, 40, 70 ], 0);

      // Act
      const forSale = subject.isForSale();

      // Assert
      expect(forSale).toBe(false);
    });

    it('sells nothing when it names a currency but prices no rungs', () =>
    {
      // Arrange - alchemy's shape: a scrap exists, but its recipes are placed by hand in the world.
      const subject = profession([], 154);

      // Act
      const forSale = subject.isForSale();

      // Assert
      expect(forSale).toBe(false);
    });

    it('does not change what it reports when asked twice', () =>
    {
      // Arrange
      const subject = profession([ 10, 20 ], 152);

      // Act
      const first = subject.isForSale();
      const second = subject.isForSale();

      // Assert
      expect(first).toBe(true);
      expect(second).toBe(true);
      expect(subject.tierPrices).toEqual([ 10, 20 ]);
      expect(subject.scrapItemId).toBe(152);
    });
  });
});

//endregion plugins/jafting/ext/create/models/crafting-profession.test.js
