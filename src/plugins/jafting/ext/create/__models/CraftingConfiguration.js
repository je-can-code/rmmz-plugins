//region crafting configuration
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
   * Constructor.
   */
  constructor(recipes, categories)
  {
    this.#recipes = recipes;
    this.#categories = categories;
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
     * Build the instance with the provided fluent parameters.
     * @return {CraftingConfiguration}
     */
    build()
    {
      const newConfig = new CraftingConfiguration(this.#recipes, this.#categories);

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
  }
}

//endregion