//region plugins/prof/ext/knowledge/__models/knowledge-exchange.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * An exchange is the rate at which knowledge becomes something real, and it resolves its own output
 * because the model that would otherwise do that job belongs to another ship entirely. That
 * independence is the point: this plugin has to work whether or not crafting is installed, so the
 * datastore lookup lives here and answers for itself when handed a type it does not recognise.
 */
describe('KnowledgeExchange', () =>
{
  let KnowledgeExchange;

  beforeAll(async () =>
  {
    vi.resetModules();

    ({ default: KnowledgeExchange } =
      await import('../../../../../../src/plugins/prof/ext/knowledge/__models/KnowledgeExchange.js'));
  });

  beforeEach(() =>
  {
    // each datastore carries a near-miss neighbour, so resolving by id cannot pass by grabbing the
    // only thing present.
    globalThis.$dataItems = [ null ];
    globalThis.$dataItems[501] = { id: 501 };
    globalThis.$dataItems[502] = { id: 502 };
    globalThis.$dataWeapons = [ null ];
    globalThis.$dataWeapons[601] = { id: 601 };
    globalThis.$dataWeapons[602] = { id: 602 };
    globalThis.$dataArmors = [ null ];
    globalThis.$dataArmors[701] = { id: 701 };
    globalThis.$dataArmors[702] = { id: 702 };
  });

  /**
   * Builds an exchange pointed at a given datastore entry.
   * @param {string} outputType The datastore the output is drawn from.
   * @param {number} outputId The id of the output within its datastore.
   * @returns {KnowledgeExchange}
   */
  function exchangeFor(outputType, outputId)
  {
    return new KnowledgeExchange('vitest_exchange', 'vitest_tag', 100, outputType, outputId, 1);
  }

  describe('arithmetic', () =>
  {
    it('counts only the whole units a balance affords', () =>
    {
      // Arrange
      const exchange = exchangeFor('i', 501);

      // Act
      const units = exchange.unitsAvailable(250);

      // Assert
      expect(units).toBe(2);
    });

    it('counts nothing when the balance is short of a single unit', () =>
    {
      // Arrange
      const exchange = exchangeFor('i', 501);

      // Act
      const units = exchange.unitsAvailable(99);

      // Assert
      expect(units).toBe(0);
    });

    it('prices a number of units at the configured rate', () =>
    {
      // Arrange
      const exchange = exchangeFor('i', 501);

      // Act
      const price = exchange.priceOf(3);

      // Assert
      expect(price).toBe(300);
    });

    it('yields the configured count for each unit bought', () =>
    {
      // Arrange- two of the output per unit.
      const exchange = new KnowledgeExchange('vitest_exchange', 'vitest_tag', 50, 'i', 502, 2);

      // Act
      const granted = exchange.yieldOf(3);

      // Assert
      expect(granted).toBe(6);
    });
  });

  describe('resolveOutput', () =>
  {
    it('draws an item from the item datastore', () =>
    {
      // Arrange
      const exchange = exchangeFor('i', 501);

      // Act
      const output = exchange.resolveOutput();

      // Assert
      expect(output.id).toBe(501);
    });

    it('draws a weapon from the weapon datastore', () =>
    {
      // Arrange
      const exchange = exchangeFor('w', 602);

      // Act
      const output = exchange.resolveOutput();

      // Assert
      expect(output.id).toBe(602);
    });

    it('draws an armor from the armor datastore', () =>
    {
      // Arrange
      const exchange = exchangeFor('a', 702);

      // Act
      const output = exchange.resolveOutput();

      // Assert
      expect(output.id).toBe(702);
    });

    it('refuses a datastore it does not recognise', () =>
    {
      // Arrange- 'g' is gold to the crafting model, and means nothing at all here.
      const exchange = exchangeFor('g', 1);

      // Act & Assert
      expect(() => exchange.resolveOutput())
        .toThrow(`exchange 'vitest_exchange' names an unrecognized output type of 'g'.`);
    });
  });
});
//endregion plugins/prof/ext/knowledge/__models/knowledge-exchange.test.js