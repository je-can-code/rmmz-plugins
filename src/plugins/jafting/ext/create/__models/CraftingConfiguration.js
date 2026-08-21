//region crafting configuration
import CraftingRecipe from './CraftingRecipe.js';
import CraftingCategory from './CraftingCategory.js';
import CraftingProfession from './CraftingProfession.js';
/**
 * The configuration model for crafting config data.
 */
class CraftingConfiguration
{
  /**
   * All recipes defined in configuration.
   * @type {CraftingRecipe[]}
   */
  #recipes = [];

  /**
   * All categories defined in configuration.
   * @type {CraftingCategory[]}
   */
  #categories = [];

  /**
   * All professions defined in configuration.
   * @type {CraftingProfession[]}
   */
  #professions = [];

  /**
   * Constructor.
   */
  constructor(recipes, categories, professions)
  {
    this.#recipes = recipes;
    this.#categories = categories;
    this.#professions = professions;
  }

  /**
   * Gets the crafting recipes that are currently defined in configuration.
   * @return {CraftingRecipe[]}
   */
  recipes()
  {
    return this.#recipes;
  }

  /**
   * Gets the crafting categories that are currently defined in configuration.
   * @return {CraftingCategory[]}
   */
  categories()
  {
    return this.#categories;
  }

  /**
   * Gets the crafting professions that are currently defined in configuration.
   * @return {CraftingProfession[]}
   */
  professions()
  {
    return this.#professions;
  }

  /**
   * A builder class for fluently constructing new {@link CraftingConfiguration}s.
   * @type {CraftingConfigurationBuilder}
   */
  static builder = new class CraftingConfigurationBuilder
  {
    /**
     * The crafting recipe state for this builder.
     * @type {CraftingRecipe[]}
     */
    #recipes = [];

    /**
     * The crafting category state for this builder.
     * @type {CraftingCategory[]}
     */
    #categories = [];

    /**
     * The crafting profession state for this builder.
     * @type {CraftingProfession[]}
     */
    #professions = [];

    /**
     * Build the instance with the provided fluent parameters.
     * @return {CraftingConfiguration}
     */
    build()
    {
      const newConfig = new CraftingConfiguration(this.#recipes, this.#categories, this.#professions);

      this.#clear();

      return newConfig;
    }

    /**
     * Reverts the state of the builder to an empty builder.
     */
    #clear()
    {
      this.#recipes = [];
      this.#categories = [];
      this.#professions = [];
    }

    /**
     * Sets the recipes for the builder.
     * @param {CraftingRecipe[]} recipes The recipes from configuration.
     * @return {CraftingConfigurationBuilder} This builder for fluent-chaining.
     */
    recipes(recipes)
    {
      this.#recipes = recipes;
      return this;
    }

    /**
     * Sets the categories for the builder.
     * @param {CraftingCategory[]} categories The categories from configuration.
     * @return {CraftingConfigurationBuilder} This builder for fluent-chaining.
     */
    categories(categories)
    {
      this.#categories = categories;
      return this;
    }

    /**
     * Sets the professions for the builder.
     * @param {CraftingProfession[]} professions The professions from configuration.
     * @return {CraftingConfigurationBuilder} This builder for fluent-chaining.
     */
    professions(professions)
    {
      this.#professions = professions;
      return this;
    }
  }
}

export default CraftingConfiguration;

//endregion