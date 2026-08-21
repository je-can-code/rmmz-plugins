//region plugins/jafting/ext/create/managers/study-purchase-service.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Buying a recipe is not crafting one, and conflating the two is the failure this whole seam exists to
 * prevent. Crafting spends its ingredients every single time it runs; a study cost buys knowledge once,
 * for something that cannot be bought twice. So every refusal below is guarding a different way of
 * charging somebody for nothing- or of handing over something nobody paid for.
 */
describe('StudyPurchaseService', () =>
{
  let StudyPurchaseService;
  let unlocked;
  let consumed;

  beforeAll(async () =>
  {
    vi.resetModules();

    ({ default: StudyPurchaseService } =
      await import('../../../../../../src/plugins/jafting/ext/create/managers/StudyPurchaseService.js'));
  });

  beforeEach(() =>
  {
    unlocked = [];
    consumed = [];

    globalThis.$gameParty = {
      __trackings: new Map(),
      getRecipeTrackingByKey(key)
      {
        return this.__trackings.get(key);
      },
      unlockRecipe(key)
      {
        unlocked.push(key);
      },
    };
  });

  /**
   * Builds a recipe standing in for one the shop might sell.
   * @param {object} overrides Which of the defaults to replace.
   * @returns {object}
   */
  function recipeFor(overrides)
  {
    const recipe = {
      key: 'vitest_recipe',
      cost: [ { } ],
      isPurchasable()
      {
        return this.cost.length > 0;
      },
      canAffordStudy()
      {
        return true;
      },
      payStudyCost()
      {
        consumed.push(this.key);
      },
      ...overrides,
    };

    globalThis.$gameParty.__trackings.set(recipe.key, { isUnlocked: () => false });

    return recipe;
  }

  it('pays the cost and unlocks the recipe when everything permits it', () =>
  {
    // Arrange
    const recipe = recipeFor({});

    // Act
    const result = StudyPurchaseService.tryPurchase(recipe);

    // Assert
    expect(result.purchased).toBe(true);
    expect(result.reason).toBeNull();
    expect(consumed).toEqual([ 'vitest_recipe' ]);
    expect(unlocked).toEqual([ 'vitest_recipe' ]);
  });

  it('refuses when handed no recipe at all', () =>
  {
    // Arrange- a list with nothing selected answers with null.

    // Act
    const result = StudyPurchaseService.tryPurchase(null);

    // Assert
    expect(result.purchased).toBe(false);
    expect(result.reason).toBe('no_recipe');
    expect(unlocked.length).toBe(0);
  });

  it('refuses when handed nothing at all', () =>
  {
    // Arrange- the near-miss to null; an empty list index answers with undefined instead.

    // Act
    const result = StudyPurchaseService.tryPurchase(undefined);

    // Assert
    expect(result.purchased).toBe(false);
    expect(result.reason).toBe('no_recipe');
  });

  it('refuses a recipe carrying no cost, which is not for sale rather than free', () =>
  {
    // Arrange- every recipe authored before study existed looks like this.
    const recipe = recipeFor({ cost: [] });

    // Act
    const result = StudyPurchaseService.tryPurchase(recipe);

    // Assert
    expect(result.purchased).toBe(false);
    expect(result.reason).toBe('not_for_sale');
    expect(consumed.length).toBe(0);
  });

  it('refuses a recipe the party already knows, rather than charging for it twice', () =>
  {
    // Arrange
    const recipe = recipeFor({});
    globalThis.$gameParty.__trackings.set(recipe.key, { isUnlocked: () => true });

    // Act
    const result = StudyPurchaseService.tryPurchase(recipe);

    // Assert
    expect(result.purchased).toBe(false);
    expect(result.reason).toBe('already_known');
    expect(consumed.length).toBe(0);
  });

  it('refuses a recipe the party cannot pay for', () =>
  {
    // Arrange
    const recipe = recipeFor({ canAffordStudy: () => false });

    // Act
    const result = StudyPurchaseService.tryPurchase(recipe);

    // Assert
    expect(result.purchased).toBe(false);
    expect(result.reason).toBe('cannot_afford');
    expect(consumed.length).toBe(0);
    expect(unlocked.length).toBe(0);
  });

  it('refuses to be instantiated, being a static class', () =>
  {
    // Arrange- nothing; the constructor is the whole subject.

    // Act & Assert
    expect(() => new StudyPurchaseService())
      .toThrow('The StudyPurchaseService is a static class.');
  });
});
//endregion plugins/jafting/ext/create/managers/study-purchase-service.test.js