//region plugins/jafting/ext/create/managers/recipe-spend-resolver.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import RecipeSpendResolver
  from '../../../../../../src/plugins/jafting/ext/create/managers/RecipeSpendResolver.js';

/**
 * The one place that decides what a craft actually costs.
 *
 * Both the confirmation prompt and the ingredient panel resolve through this, which is the point - they used to ask
 * the component directly and both received the same wrong answer for a categorical slot. The cases below are
 * therefore about disagreement: a slot that has been chosen versus one that has not, and two slots that turn out to
 * be spending the same thing.
 */
describe('RecipeSpendResolver', () =>
{
  /**
   * Minimal fake mirroring the CraftingComponent surface the resolver actually calls.
   * @param {object} options The traits this component should report.
   * @returns {object} The stand-in component.
   */
  const fakeComponent = ({
    quantity = 1,
    name = 'Any Gel',
    iconIndex = 1,
    held = 26,
    gold = false,
    sdp = false,
    item = null,
  } = {}) => ({
    quantity: vi.fn(() => quantity),
    getName: vi.fn(() => name),
    getIconIndex: vi.fn(() => iconIndex),
    getHandledQuantity: vi.fn(() => held),
    isGold: vi.fn(() => gold),
    isSdp: vi.fn(() => sdp),
    getItem: vi.fn(() => item),
  });

  /**
   * A stand-in for a hydrated database row.
   * @param {string} name The row's name.
   * @param {number} iconIndex The row's icon.
   * @returns {object} The stand-in row.
   */
  const fakeEntry = (name, iconIndex) => ({
    name,
    iconIndex,
  });

  beforeEach(() =>
  {
    globalThis.$gameParty = {
      numItems: vi.fn(() => 7),
    };
  });

  afterEach(() =>
  {
    delete globalThis.$gameParty;
  });

  //region which entry a slot resolves to
  describe('chosenFor()', () =>
  {
    it('hands back the entry the player named for that slot', () =>
    {
      // Arrange
      const big = fakeEntry('Big Gelatin', 5);
      const selections = new Map([ [ 0, big ] ]);

      // Act
      const chosen = RecipeSpendResolver.chosenFor(selections, 0);

      // Assert
      expect(chosen)
        .toBe(big);
    });

    it('answers null for a slot nobody has chosen, rather than guessing an entry', () =>
    {
      // Arrange
      const selections = new Map();

      // Act
      const chosen = RecipeSpendResolver.chosenFor(selections, 0);

      // Assert
      expect(chosen)
        .toBeNull();
    });
  });
  //endregion which entry a slot resolves to

  //region describing one ingredient
  describe('lineFor()', () =>
  {
    it('lets the component describe itself while the choice is still open', () =>
    {
      // Arrange
      const component = fakeComponent({
        quantity: 2,
        name: 'Any Gel',
        iconIndex: 1,
        held: 26,
      });

      // Act
      const line = RecipeSpendResolver.lineFor(component, null);

      // Assert
      expect(line)
        .toEqual({
          name: 'Any Gel',
          iconIndex: 1,
          perCraft: 2,
          held: 26,
        });
    });

    it('describes the chosen entry instead, so a picked slot stops reporting the category', () =>
    {
      // Arrange
      const component = fakeComponent({
        quantity: 2,
        name: 'Any Gel',
        iconIndex: 1,
        held: 26,
      });
      const big = fakeEntry('Big Gelatin', 5);

      // Act
      const line = RecipeSpendResolver.lineFor(component, big);

      // Assert
      expect(line)
        .toEqual({
          name: 'Big Gelatin',
          iconIndex: 5,
          perCraft: 2,
          held: 7,
        });
    });

    it('reads the held count off the party for the chosen entry, not off the component', () =>
    {
      // Arrange
      const component = fakeComponent({ held: 26 });
      const big = fakeEntry('Big Gelatin', 5);

      // Act
      RecipeSpendResolver.lineFor(component, big);

      // Assert
      expect($gameParty.numItems)
        .toHaveBeenCalledWith(big);
    });
  });
  //endregion describing one ingredient

  //region what counts as the same thing
  describe('keyFor()', () =>
  {
    it('keys a chosen slot on the entry itself', () =>
    {
      // Arrange
      const component = fakeComponent();
      const big = fakeEntry('Big Gelatin', 5);

      // Act
      const key = RecipeSpendResolver.keyFor(component, big);

      // Assert
      expect(key)
        .toBe(big);
    });

    it('keys gold on a string, since its component is rebuilt fresh on every read', () =>
    {
      // Arrange
      const component = fakeComponent({ gold: true });

      // Act
      const key = RecipeSpendResolver.keyFor(component, null);

      // Assert
      expect(key)
        .toBe('gold');
    });

    it('keys sdp on a string, for the same reason gold does', () =>
    {
      // Arrange
      const component = fakeComponent({ sdp: true });

      // Act
      const key = RecipeSpendResolver.keyFor(component, null);

      // Assert
      expect(key)
        .toBe('sdp');
    });

    it('keys an unchosen database slot on the row it names', () =>
    {
      // Arrange
      const row = fakeEntry('Iron Ore', 9);
      const component = fakeComponent({ item: row });

      // Act
      const key = RecipeSpendResolver.keyFor(component, null);

      // Assert
      expect(key)
        .toBe(row);
    });
  });
  //endregion what counts as the same thing

  //region the bill
  describe('aggregated()', () =>
  {
    it('gives each distinct entry a row of its own', () =>
    {
      // Arrange
      const gel = fakeEntry('Big Gelatin', 5);
      const flank = fakeEntry('Flank Steak', 6);
      const components = [ fakeComponent(), fakeComponent() ];
      const selections = new Map([ [ 0, gel ], [ 1, flank ] ]);

      // Act
      const lines = RecipeSpendResolver.aggregated(components, selections);

      // Assert
      expect(lines.map(line => line.name))
        .toEqual([ 'Big Gelatin', 'Flank Steak' ]);
    });

    it('folds two slots spending the same entry into one row, summing what they take', () =>
    {
      // Arrange
      const gel = fakeEntry('Big Gelatin', 5);
      const components = [ fakeComponent({ quantity: 2 }), fakeComponent({ quantity: 3 }) ];
      const selections = new Map([ [ 0, gel ], [ 1, gel ] ]);

      // Act
      const lines = RecipeSpendResolver.aggregated(components, selections);

      // Assert
      expect(lines)
        .toEqual([ {
          name: 'Big Gelatin',
          iconIndex: 5,
          perCraft: 5,
          held: 7,
        } ]);
    });

    it('folds two gold costs together despite each rebuilding its own component object', () =>
    {
      // Arrange
      const components = [
        fakeComponent({ gold: true, quantity: 100, name: 'G', item: { name: 'G' } }),
        fakeComponent({ gold: true, quantity: 250, name: 'G', item: { name: 'G' } }),
      ];

      // Act
      const lines = RecipeSpendResolver.aggregated(components, new Map());

      // Assert
      expect(lines.length)
        .toBe(1);
      expect(lines[0].perCraft)
        .toBe(350);
    });

    it('keeps an unchosen slot separate from a chosen one that names a different entry', () =>
    {
      // Arrange
      const row = fakeEntry('Iron Ore', 9);
      const gel = fakeEntry('Big Gelatin', 5);
      const components = [ fakeComponent({ item: row, name: 'Iron Ore' }), fakeComponent() ];
      const selections = new Map([ [ 1, gel ] ]);

      // Act
      const lines = RecipeSpendResolver.aggregated(components, selections);

      // Assert
      expect(lines.length)
        .toBe(2);
    });
  });
  //endregion the bill
});
//endregion plugins/jafting/ext/create/managers/recipe-spend-resolver.test.js