//region CraftingRecipe
/**
 * A data model for a single recipe in crafting.
 */
class CraftingRecipe
{
  //region properties
  /**
   * The name of this crafting recipe.
   * @type {string}
   */
  name = String.empty;

  /**
   * The unique key associated with this crafting recipe.
   * @type {string}
   */
  key = String.empty;

  /**
   * The category keys that this crafting recipe belongs to.
   * @type {string[]}
   */
  categoryKeys = [];

  /**
   * The icon that will display in the type selection window next to this category.
   * @type {number}
   */
  iconIndex = -1;

  /**
   * The description of this crafting recipe.
   * @type {string}
   */
  description = String.empty;

  /**
   * The list of required tools not consumed but required to execute the recipe.
   * @type {CraftingComponent[]}
   */
  unlockedByDefault = false;

  /**
   * If true, then the textual details will be masked in the recipe regarding this recipe
   * until it is crafted.
   * @type {boolean}
   */
  maskedUntilCrafted = true;

  /**
   * The components that will be consumed when this recipe is crafted.
   * @type {CraftingComponent[]}
   */
  ingredients = [];

  /**
   * The components that are required to execute this recipe, but are not consumed when crafted.
   * @type {CraftingComponent[]}
   */
  tools = [];

  /**
   * The components that are created upon successful crafting execution of this recipe.
   * @type {CraftingComponent[]}
   */
  outputs = [];
  //endregion

  constructor(
    name,
    key,
    categoryKeys,
    iconIndex,
    description,
    unlockedByDefault,
    maskedUntilCrafted,
    ingredients,
    tools,
    outputs)
  {
    this.name = name;
    this.key = key;
    this.categoryKeys = categoryKeys;
    this.iconIndex = iconIndex;
    this.description = description;
    this.unlockedByDefault = unlockedByDefault;
    this.maskedUntilCrafted = maskedUntilCrafted;
    this.ingredients = ingredients;
    this.tools = tools;
    this.outputs = outputs;
  }

  /**
   * Checks if the party has the required materials to perform the crafting.
   */
  canCraft()
  {
    // check over all ingredients to see if we have enough to craft recipe.
    const hasIngredients = this.ingredients.every(component => component.hasEnough());

    // check over all tools to see if we have them on-hand to craft this recipe.
    const hasTools = this.tools.every(component => component.hasEnough());

    // we can only craft if we have the required ingredients AND tools.
    const canCraft = hasIngredients && hasTools;
    return canCraft;
  }

  /**
   * Executes the crafting of the recipe.<br>
   * This includes consuming the ingredients, generating the outputs, and improving proficiency.
   */
  craft()
  {
    // consume all the inputs.
    this.ingredients.forEach(component => component.consume());

    // generate all the outputs.
    this.outputs.forEach(component => component.generate());

    // improve the proficiency for the recipe.
    $gameParty
      .getRecipeTrackingByKey(this.key)
      .improveProficiency();
  }

  /**
   * Checks if this recipe should have its details masked.
   * @return {boolean}
   */
  needsMasking()
  {
    // if we aren't masked to begin with, then don't mask.
    if (!this.maskedUntilCrafted) return false;

    // check if we've crafted this recipe before.
    const hasCraftedBefore = $gameParty
      .getRecipeTrackingByKey(this.key)
      .hasBeenCrafted();

    // we don't mask after we craft it.
    if (hasCraftedBefore) return false;

    // it should be masked!
    return true;
  }

  /**
   * Gets the crafting proficiency for this recipe.
   * @return {number}
   */
  getProficiency()
  {
    return $gameParty
      .getRecipeTrackingByKey(this.key)
      .craftingProficiency();
  }

  /**
   * Gets the recipe's name.<br>
   * If the name is empty or empty-like, it will use the primary output's instead.
   * @return {string}
   */
  getRecipeName()
  {
    // initialize the name.
    let name = (!this.name.trim().length)
      // use the primary output's name if we didn't define one.
      ? this.getPrimaryOutput().name
      // we defined a name to use.
      : this.name;

    // check if we need masking.
    if (this.needsMasking())
    {
      // mask the name.
      name = name.replace(/[A-Za-z\-!?',.]/ig, "?");
    }

    // return our determination.
    return name;
  }

  /**
   * Gets the recipe's description.<br>
   * If the description is empty or empty-like, it will use the primary output's instead.
   * @return {string}
   */
  getRecipeDescription()
  {
    // initialize the description.
    let description = (!this.description.trim().length)
      // use the primary output's description if we didn't define one.
      ? this.getPrimaryOutput().description
      // we defined a description to use.
      : this.description;

    // check if we need masking.
    if (this.needsMasking())
    {
      // mask the description.
      description = description.replace(/[A-Za-z\-!?',.]/ig, "?");
    }

    // return our determination.
    return description;
  }

  /**
   * Gets the recipe's icon index.<br>
   * If the icon index is set to -1, it will use the primary output's instead.
   * @return {number}
   */
  getRecipeIcon()
  {
    // initialize the icon.
    let iconIndex = (this.iconIndex <= -1)
      // use the primary output's icon if we didn't define one.
      ? this.getPrimaryOutput().iconIndex
      // we defined an icon to use.
      : this.iconIndex;

    // check if we need masking.
    if (this.needsMasking())
    {
      // mask the icon with a question mark icon.
      iconIndex = 93;
    }

    // return our determination.
    return iconIndex;
  }

  /**
   * Gets the underlying item for the primary output of this recipe.
   * @return {RPG_Item|RPG_Weapon|RPG_Armor}
   */
  getPrimaryOutput()
  {
    return this.outputs.at(0)?.getItem();
  }

  /**
   * A debug function for receiving all materials required to craft this recipe.
   */
  getAllComponents()
  {
    this.ingredients.forEach(ingredient => ingredient.generate());
    this.tools.forEach(tool => tool.generate());
  }
}
//endregion CraftingRecipe