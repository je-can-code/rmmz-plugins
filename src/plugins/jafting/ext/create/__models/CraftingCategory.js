//region CraftingCategory
/**
 * Represents the category details for this recipe.
 * A single recipe can live in multiple categories.
 */
class CraftingCategory
{
  //region properties
  /**
   * The name of this crafting category.
   * @type {string}
   */
  name = String.empty;

  /**
   * The unique key of this crafting category.
   * @type {string}
   */
  key = String.empty;

  /**
   * The icon index of this crafting category.
   * @type {number}
   */
  iconIndex = -1;

  /**
   * The description of this crafting category.
   * @type {string}
   */
  description = String.empty;

  /**
   * True this crafting category is unlocked by default, false otherwise.
   */
  unlockedByDefault = false;
  //endregion properties

  /**
   * Constructor.
   */
  constructor(name, key, iconIndex, description, unlockedByDefault)
  {
    this.name = name;
    this.key = key;
    this.iconIndex = iconIndex;
    this.description = description;
    this.unlockedByDefault = unlockedByDefault;
  }

  /**
   * Locks this crafting category.
   */
  lock()
  {
    $gameParty.lockCategory(this.key);
  }

  /**
   * Unlocks this crafting category.
   */
  unlock()
  {
    $gameParty.unlockCategory(this.key);
  }

  /**
   * Checks if the party knows any recipes for this crafting category.
   * @return {boolean}
   */
  hasAnyRecipes()
  {
    return $gameParty.getUnlockedRecipes()
      .some(unlockedRecipe => unlockedRecipe.categoryKeys.includes(this.key), this);
  }
}
//endregion CraftingCategory