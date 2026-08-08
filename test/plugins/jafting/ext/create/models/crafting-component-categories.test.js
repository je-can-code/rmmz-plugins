//region plugins/jafting/ext/create/models/crafting-component-categories.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import CraftingComponent from '../../../../../../src/plugins/jafting/ext/create/__models/CraftingComponent.js';

/**
 * A categorical component names the kind of thing a recipe slot wants rather than one database row,
 * so every operation that used to resolve an id has to resolve against inventory instead. The two
 * rules that shape all of it: a slot is filled by exactly one entry, and two slots must never both
 * believe they can spend the same stack.
 */
describe('CraftingComponent categories (direct src import)', () =>
{
  /**
   * Builds a categorical component wanting the given types.
   * @param {string[]} categories The ingredient types the slot requires.
   * @param {number} [count] The quantity required.
   * @returns {CraftingComponent}
   */
  function categorical(categories, count = 1)
  {
    return CraftingComponent.builder
      .count(count)
      .categories(categories)
      .build();
  }

  /**
   * Builds a database row carrying the given ingredient types.
   * @param {number} id The row id.
   * @param {string} name The row name.
   * @param {string[]} types The ingredient types the row declares.
   * @param {number} held How many the party is carrying.
   * @returns {object}
   */
  function entry(id, name, types, held)
  {
    return {
      id,
      name,
      iconIndex: id + 100,
      held,
      ingredientTypes: () => types,
      isWeapon: () => false,
      isArmor: () => false,
    };
  }

  let inventory;

  beforeEach(() =>
  {
    inventory = [];

    globalThis.$gameParty = {
      allItems: () => inventory,
      numItems: datum => datum.held,
      loseItem: vi.fn(),
    };
  });

  afterEach(() =>
  {
    delete globalThis.$gameParty;
    vi.restoreAllMocks();
  });

  describe('isCategorical', () =>
  {
    it('is true when types were supplied', () =>
    {
      // Arrange
      const component = categorical([ 'meat' ]);

      // Act
      const result = component.isCategorical();

      // Assert
      expect(result).toBe(true);
    });

    it('is false when the types array is empty', () =>
    {
      // Arrange
      const component = categorical([]);

      // Act
      const result = component.isCategorical();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('eligibleEntries', () =>
  {
    it('accepts an entry carrying every wanted type', () =>
    {
      // Arrange
      inventory = [ entry(1, 'Bearcat Flank', [ 'protein', 'meat' ], 3) ];
      const component = categorical([ 'protein', 'meat' ]);

      // Act
      const result = component.eligibleEntries();

      // Assert
      expect(result).toHaveLength(1);
    });

    it('accepts an entry carrying extra types beyond those wanted', () =>
    {
      // Arrange - extra tags describe more slots the entry can fill, never fewer.
      inventory = [ entry(1, 'Cod', [ 'protein', 'fish', 'aquatic' ], 2) ];
      const component = categorical([ 'protein' ]);

      // Act
      const result = component.eligibleEntries();

      // Assert
      expect(result).toHaveLength(1);
    });

    it('rejects an entry missing one wanted type', () =>
    {
      // Arrange
      inventory = [ entry(1, 'Bearcat Flank', [ 'protein', 'meat' ], 3) ];
      const component = categorical([ 'protein', 'fish' ]);

      // Act
      const result = component.eligibleEntries();

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('getHandledQuantity', () =>
  {
    it('reports the largest single eligible stack rather than the sum', () =>
    {
      // Arrange - a slot spends one entry, so a total across entries would advertise an unusable count.
      inventory = [
        entry(1, 'Bearcat Flank', [ 'meat' ], 2),
        entry(2, 'Grim Flank', [ 'meat' ], 2),
      ];
      const component = categorical([ 'meat' ], 3);

      // Act
      const result = component.getHandledQuantity();

      // Assert
      expect(result).toBe(2);
    });

    it('prefers a larger stack that appears later in inventory', () =>
    {
      // Arrange - the reduce has to keep looking rather than settling on the first candidate.
      inventory = [
        entry(1, 'Boney Ribs', [ 'meat' ], 1),
        entry(2, 'Grim Flank', [ 'meat' ], 7),
      ];
      const component = categorical([ 'meat' ]);

      // Act
      const result = component.getHandledQuantity();

      // Assert
      expect(result).toBe(7);
    });

    it('reports zero when nothing eligible is held', () =>
    {
      // Arrange
      inventory = [ entry(1, 'Rice', [ 'carb' ], 9) ];
      const component = categorical([ 'meat' ]);

      // Act
      const result = component.getHandledQuantity();

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('hasEnough', () =>
  {
    it('is true when one eligible stack covers the requirement', () =>
    {
      // Arrange
      inventory = [ entry(1, 'Bearcat Flank', [ 'meat' ], 3) ];
      const component = categorical([ 'meat' ], 3);

      // Act
      const result = component.hasEnough();

      // Assert
      expect(result).toBe(true);
    });

    it('is false when the requirement is only met by summing two stacks', () =>
    {
      // Arrange
      inventory = [
        entry(1, 'Bearcat Flank', [ 'meat' ], 2),
        entry(2, 'Grim Flank', [ 'meat' ], 2),
      ];
      const component = categorical([ 'meat' ], 3);

      // Act
      const result = component.hasEnough();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getItem', () =>
  {
    it('resolves to the best eligible entry rather than a fixed row', () =>
    {
      // Arrange
      const ribs = entry(1, 'Boney Ribs', [ 'meat' ], 1);
      const flank = entry(2, 'Grim Flank', [ 'meat' ], 6);
      inventory = [ ribs, flank ];
      const component = categorical([ 'meat' ]);

      // Act
      const result = component.getItem();

      // Assert
      expect(result).toBe(flank);
    });

    it('picks the largest stack even when it is not the last one held', () =>
    {
      // Arrange- inventory order must not decide this. With the biggest stack listed last, "keep the
      // largest" and "keep whichever came last" agree, and the comparison could be doing nothing at
      // all without any test noticing. Listing it first is what separates the two.
      const flank = entry(1, 'Grim Flank', [ 'meat' ], 6);
      const ribs = entry(2, 'Boney Ribs', [ 'meat' ], 1);
      inventory = [ flank, ribs ];
      const component = categorical([ 'meat' ]);

      // Act
      const result = component.getItem();

      // Assert
      expect(result).toBe(flank);
    });

    it('returns null when nothing eligible is held', () =>
    {
      // Arrange - this is the one accessor on the class that can answer null, and an empty slot is an
      // ordinary state rather than a broken one.
      inventory = [ entry(1, 'Rice', [ 'carb' ], 4) ];
      const component = categorical([ 'meat' ]);

      // Act
      const result = component.getItem();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getCategoryLabel', () =>
  {
    it('titles the most specific category', () =>
    {
      // Arrange - categories are authored broad-to-specific.
      const component = categorical([ 'protein', 'meat' ]);

      // Act
      const result = component.getName();

      // Assert
      expect(result).toBe('Any Meat');
    });

    it('handles a single-category slot', () =>
    {
      // Arrange
      const component = categorical([ 'oil' ]);

      // Act
      const result = component.getName();

      // Assert
      expect(result).toBe('Any Oil');
    });
  });

  describe('getIconIndex', () =>
  {
    it('borrows the icon of the best eligible entry', () =>
    {
      // Arrange
      inventory = [ entry(1, 'Bearcat Flank', [ 'meat' ], 3) ];
      const component = categorical([ 'meat' ]);

      // Act
      const result = component.getIconIndex();

      // Assert
      expect(result).toBe(101);
    });

    it('falls back to the slot icon when nothing is eligible', () =>
    {
      // Arrange
      const component = categorical([ 'meat' ]);

      // Act
      const result = component.getIconIndex();

      // Assert
      expect(result).toBe(CraftingComponent.CategorySlotIconIndex);
    });
  });

  describe('consume', () =>
  {
    it('spends the selected entry rather than resolving one itself', () =>
    {
      // Arrange
      const bearcat = entry(1, 'Bearcat Flank', [ 'meat' ], 5);
      const grim = entry(2, 'Grim Flank', [ 'meat' ], 1);
      inventory = [ bearcat, grim ];
      const component = categorical([ 'meat' ], 1);

      // Act
      component.consume(grim);

      // Assert - bearcat is the bigger stack, so a self-resolving component would have picked it.
      expect($gameParty.loseItem).toHaveBeenCalledWith(grim, 1);
    });
  });

  describe('allocateFrom', () =>
  {
    it('deducts what it claims from the tally', () =>
    {
      // Arrange
      const flank = entry(1, 'Bearcat Flank', [ 'meat' ], 5);
      inventory = [ flank ];
      const component = categorical([ 'meat' ], 2);
      const tally = new Map();

      // Act
      const result = component.allocateFrom(tally);

      // Assert
      expect(result).toBe(true);
      expect(tally.get(flank)).toBe(3);
    });

    it('refuses a slot the remaining tally can no longer cover', () =>
    {
      // Arrange - the single flank has already been claimed by an earlier slot.
      const flank = entry(1, 'Bearcat Flank', [ 'protein', 'meat' ], 1);
      inventory = [ flank ];
      const first = categorical([ 'meat' ], 1);
      const second = categorical([ 'protein' ], 1);
      const tally = new Map();

      // Act
      const firstResult = first.allocateFrom(tally);
      const secondResult = second.allocateFrom(tally);

      // Assert - without a shared tally both would pass and the player would pay once for two slots.
      expect(firstResult).toBe(true);
      expect(secondResult).toBe(false);
    });

    it('keeps a currency component out of the tally entirely', () =>
    {
      // Arrange - gold is not drawn from inventory, so it can never compete for a stack.
      globalThis.$gameParty.gold = () => 500;
      const gold = CraftingComponent.builder
        .count(100)
        .type(CraftingComponent.Types.Gold)
        .build();
      const tally = new Map();

      // Act
      const result = gold.allocateFrom(tally);

      // Assert
      expect(result).toBe(true);
      expect(tally.size).toBe(0);
    });

    it('keeps the first candidate when it is already the tightest fit', () =>
    {
      // Arrange - the reduce must not swap to a roomier stack just because it comes later.
      const small = entry(1, 'Boney Ribs', [ 'meat' ], 1);
      const large = entry(2, 'Grim Flank', [ 'meat' ], 9);
      inventory = [ small, large ];
      const component = categorical([ 'meat' ], 1);
      const tally = new Map();

      // Act
      component.allocateFrom(tally);

      // Assert
      expect(tally.get(small)).toBe(0);
      expect(tally.has(large)).toBe(false);
    });

    it('spends the tightest sufficient stack so roomier ones survive', () =>
    {
      // Arrange - the tighter stack appears second, so the reduce has to swap onto it. Ribs alone can
      // fill the meat slot, leaving both flanks for the flank slot.
      const flank = entry(2, 'Grim Flank', [ 'meat', 'flank' ], 2);
      const ribs = entry(1, 'Boney Ribs', [ 'meat' ], 1);
      inventory = [ flank, ribs ];
      const meatSlot = categorical([ 'meat' ], 1);
      const flankSlot = categorical([ 'flank' ], 2);
      const tally = new Map();

      // Act
      const meatResult = meatSlot.allocateFrom(tally);
      const flankResult = flankSlot.allocateFrom(tally);

      // Assert
      expect(meatResult).toBe(true);
      expect(flankResult).toBe(true);
      expect(tally.get(ribs)).toBe(0);
    });
  });
});
//endregion plugins/jafting/ext/create/models/crafting-component-categories.test.js
