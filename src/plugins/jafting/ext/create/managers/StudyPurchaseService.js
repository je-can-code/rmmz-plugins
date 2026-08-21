//region StudyPurchaseService
/**
 * A static service for buying the knowledge of a recipe from somebody who already has it.
 *
 * A purchase is three questions and two writes, and none of it belongs in the scene that triggers it -
 * a rule kept inside a window is a rule nothing can test. The scene asks for an outcome and decides
 * what noise to make about it; everything that decides whether the transaction happens lives here.
 *
 * Buying is not crafting, and the difference is the whole reason this is separate: crafting spends
 * ingredients against a shared tally every time it runs, while a cost is paid once for a thing that
 * cannot be bought twice.
 */
class StudyPurchaseService
{
  /**
   * Constructor.<br/>
   * This is a static class; it should not be instantiated.
   */
  constructor()
  {
    throw new Error('The StudyPurchaseService is a static class.');
  }

  /**
   * The reasons a purchase can fail to happen.
   * @type {Object<string, string>}
   */
  static Reasons = {
    NoRecipe: 'no_recipe',
    NotForSale: 'not_for_sale',
    AlreadyKnown: 'already_known',
    CannotAfford: 'cannot_afford',
  };

  /**
   * Buys a recipe, if everything about it permits being bought.
   * @param {CraftingRecipe|null|undefined} recipe The recipe being purchased.
   * @returns {{ purchased: boolean, reason: string|null }}
   */
  static tryPurchase(recipe)
  {
    if (recipe === null || recipe === undefined)
    {
      return StudyPurchaseService.#refusal(StudyPurchaseService.Reasons.NoRecipe);
    }

    // a recipe with no cost is not free, it is simply not merchandise.
    if (recipe.isPurchasable() === false)
    {
      return StudyPurchaseService.#refusal(StudyPurchaseService.Reasons.NotForSale);
    }

    // buying a second copy of knowledge would take payment for nothing.
    const tracking = $gameParty.getRecipeTrackingByKey(recipe.key);
    if (tracking.isUnlocked() === true)
    {
      return StudyPurchaseService.#refusal(StudyPurchaseService.Reasons.AlreadyKnown);
    }

    if (recipe.canAffordStudy() === false)
    {
      return StudyPurchaseService.#refusal(StudyPurchaseService.Reasons.CannotAfford);
    }

    // pay before unlocking, so a cost that somehow cannot be met never hands over the goods first.
    recipe.payStudyCost();

    $gameParty.unlockRecipe(recipe.key);

    return {
      purchased: true,
      reason: null,
    };
  }

  /**
   * Builds the outcome of a purchase that did not happen.
   * @param {string} reason Which of {@link StudyPurchaseService.Reasons} explains it.
   * @returns {{ purchased: boolean, reason: string }}
   */
  static #refusal(reason)
  {
    return {
      purchased: false,
      reason,
    };
  }
}

export default StudyPurchaseService;
//endregion StudyPurchaseService