//region CraftingRecipe
import CraftingComponent from './CraftingComponent.js';
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
   * The icon index shown for this recipe in the JAFTING Creation UI.
   * @type {number}
   */
  iconIndex = -1;

  /**
   * The description of this crafting recipe.
   * @type {string}
   */
  description = String.empty;

  /**
   * When true, this recipe is available without an explicit unlock step.
   * @type {boolean}
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

  /**
   * The components that must be paid once, to learn this recipe from somebody who knows it.
   *
   * **This is not part of crafting, and must never be iterated alongside the three arrays above it.**
   * Rolling all four together is the obvious tidy-up and it is wrong: the cost buys the knowledge a
   * single time, so a recipe swept into `canCraft` or the consume loop would charge its tuition again
   * on every single craft forever after.
   *
   * An empty cost means the recipe is not for sale, which is what every recipe authored before this
   * existed says by saying nothing.
   * @type {CraftingComponent[]}
   */
  cost = [];

  /**
   * How far up its family this recipe sits, which prices it when it names no cost of its own.
   * Zero means untiered, and an untiered recipe with no cost is simply not for sale.
   * @type {number}
   */
  tier = 0;

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
    outputs,
    cost = [],
    tier = 0)
  {
    this.name = name;
    this.key = key;
    this.categoryKeys = categoryKeys;
    // assign icon index on this instance for callers.
    this.iconIndex = iconIndex;
    this.description = description;
    this.unlockedByDefault = unlockedByDefault;
    // assign masked until crafted on this instance for callers.
    this.maskedUntilCrafted = maskedUntilCrafted;
    this.ingredients = ingredients;
    this.tools = tools;
    this.outputs = outputs;
    this.cost = cost;
    this.tier = tier;
  }

  /**
   * Sets what this recipe charges to be taught.
   *
   * Used once at boot, when a recipe that named no cost of its own is priced from its tier. A recipe
   * that named a cost keeps it- the tier is the rule and the cost is the exception.
   * @param {CraftingComponent[]} cost The tuition this recipe now charges.
   */
  setCost(cost)
  {
    this.cost = cost;
  }

  /**
   * Whether this recipe is something a shop could sell.
   *
   * A recipe with nothing to pay is not free, it is simply not for sale- every recipe authored before
   * study existed says exactly that by having no cost at all.
   * @returns {boolean}
   */
  isPurchasable()
  {
    return this.cost.length > 0;
  }

  /**
   * Whether the party is currently carrying everything this recipe's tuition asks for.
   * @returns {boolean}
   */
  canAffordStudy()
  {
    return this.cost.every(component => component.hasEnough());
  }

  /**
   * Hands over everything this recipe's tuition asks for.
   *
   * Unlike crafting, there is no shared tally to allocate against, because a cost is paid once and the
   * thing it buys cannot be bought twice.
   */
  payStudyCost()
  {
    this.cost.forEach(component => component.consume());
  }

  /**
   * Checks if the party has the required materials to perform the crafting.
   *
   * Ingredients are allocated against a single shared tally rather than checked independently. Two
   * slots that can both be filled by the same stack would each see the party's full count and both
   * report satisfied - and since `Game_Party.gainItem` clamps at zero, the second `loseItem` would
   * quietly do nothing and the player would pay once for two ingredients. Overlapping eligibility is
   * the normal case once slots are categorical, so the tally is what keeps the answer honest.
   *
   * Tools are checked against raw inventory because they are never consumed and therefore never
   * compete for a stack.
   * @returns {boolean}
   */
  canCraft()
  {
    /** @type {Map<RPG_Item|RPG_Weapon|RPG_Armor, number>} */
    const tally = new Map();

    // allocate in authored order, deducting as each slot claims what it needs.
    const hasIngredients = this.ingredients.every(component => component.allocateFrom(tally));

    // check over all tools to see if we have them on-hand to craft this recipe.
    const hasTools = this.tools.every(component => component.hasEnough());

    // we can only craft if we have the required ingredients AND tools.
    const canCraft = hasIngredients && hasTools;
    return canCraft;
  }

  /**
   * How many times in a row this recipe could be crafted with what the party is holding.
   *
   * **Crafting a batch is a shortcut for pressing craft that many times, and nothing more.** So the ceiling is
   * simply how many repetitions the stock survives - no substituting a Colossal Gelatin once the Big ones run out,
   * because the player named the entry they wanted spent and a batch must not quietly decide otherwise.
   *
   * Demand is summed per entry rather than per slot: a recipe wanting two gels, both filled by Big Gelatin, spends
   * two of them per craft, so twenty-four in stock is twelve crafts and not twenty-four.
   *
   * Tools never bound this. They are checked before crafting and never consumed, so holding one is holding enough
   * for any number of repetitions.
   * @param {Map<number, RPG_Item|RPG_Weapon|RPG_Armor>} selections The entry chosen for each categorical slot.
   * @returns {number} The most repetitions the stock allows, or zero when even one is out of reach.
   */
  maxCraftableCount(selections = new Map())
  {
    if (!this.canCraft()) return 0;

    /** @type {Map<RPG_Item|RPG_Weapon|RPG_Armor, number>} */
    const demandPerEntry = new Map();

    this.ingredients.forEach((component, index) =>
    {
      const chosen = selections.has(index)
        ? selections.get(index)
        : component.getItem();

      // a currency slot answers with no entry; those are tallied by their own accounting below.
      if (chosen === null) return;

      const alreadyWanted = demandPerEntry.get(chosen) ?? 0;

      demandPerEntry.set(chosen, alreadyWanted + component.quantity());
    });

    let ceiling = Number.MAX_SAFE_INTEGER;

    demandPerEntry.forEach((wantedPerCraft, entry) =>
    {
      const held = $gameParty.numItems(entry);

      ceiling = Math.min(ceiling, Math.floor(held / wantedPerCraft));
    });

    // gold and panel points hold no entry, so they are measured against what the component itself can see.
    this.ingredients
      .filter(component => !component.isDatabaseEntry())
      .forEach(component =>
      {
        const affordable = Math.floor(component.getHandledQuantity() / component.quantity());

        ceiling = Math.min(ceiling, affordable);
      });

    return Math.max(0, ceiling);
  }

  /**
   * The indices of every ingredient that needs the player to choose which entry fills it.
   *
   * Only ingredients are listed. Tools may be categorical too, but they are never consumed, so which
   * eligible tool the party happens to hold cannot change anything and asking would be noise.
   * @returns {number[]}
   */
  categoricalIngredientIndices()
  {
    const indices = [];

    this.ingredients.forEach((component, index) =>
    {
      // a slot naming a specific row has nothing to choose between.
      if (component.isCategorical()) indices.push(index);
    });

    return indices;
  }

  /**
   * Whether crafting this recipe requires the player to pick entries before it can execute.
   * @returns {boolean}
   */
  needsIngredientSelection()
  {
    return this.categoricalIngredientIndices().length > 0;
  }

  /**
   * Executes the crafting of the recipe.<br>
   * This includes consuming the ingredients, generating the outputs, and improving proficiency.
   * @param {Map<number, RPG_Item|RPG_Weapon|RPG_Armor>} selections The entry chosen for each
   * categorical ingredient, keyed by its index in {@link ingredients}.
   */
  craft(selections = new Map())
  {
    // consume all the inputs, spending whichever entry was chosen for each categorical slot.
    this.ingredients.forEach((component, index) => component.consume(selections.get(index)));

    // generate all the outputs.
    this.outputs.forEach(component => component.generate());

    // stamp ingredient ancestry onto outputs so later refinement stacks still carry salvage lineage for core.
    JaftingSalvageManager.applyCraftRecipeOutputs(this, selections);

    // improve the proficiency for the recipe.
    $gameParty
      .getRecipeTrackingByKey(this.key)
      .improveProficiency();
  }

  /**
   * Crafts this recipe a number of times over.
   *
   * Deliberately a loop around the single craft rather than a multiplier threaded through it. Batching is a
   * shortcut for pressing craft repeatedly, so it has to be indistinguishable from having done exactly that -
   * every repetition earns its own proficiency, and every output carries its own dismantle stamp rather than one
   * merged record covering the batch.
   * @param {number} count How many times to craft.
   * @param {Map<number, RPG_Item|RPG_Weapon|RPG_Armor>} selections The entry chosen for each categorical slot.
   */
  craftMany(count, selections = new Map())
  {
    for (let repetition = 0; repetition < count; repetition++)
    {
      this.craft(selections);
    }
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
    let name = this.getUnmaskedRecipeName();

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
    let iconIndex = this.getUnmaskedRecipeIcon();

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
   * Gets the recipe's name without ever masking it.
   *
   * A shop needs this. Every recipe it has to sell is by definition one nobody has crafted, so asking
   * for the masked name would price a row of question marks and leave the player buying a mystery -
   * which is a different offer from the one being made. What stays hidden until it is crafted is the
   * description and what goes into it; the name on the price tag is the point of the price tag.
   * @return {string}
   */
  getUnmaskedRecipeName()
  {
    return (!this.name.trim().length)
      // use the primary output's name if we didn't define one.
      ? this.getPrimaryOutput().name
      // we defined a name to use.
      : this.name;
  }

  /**
   * Gets the recipe's icon index without ever masking it.<br/>
   * Wanted for the same reason as {@link #getUnmaskedRecipeName}.
   * @return {number}
   */
  getUnmaskedRecipeIcon()
  {
    return (this.iconIndex <= -1)
      // use the primary output's icon if we didn't define one.
      ? this.getPrimaryOutput().iconIndex
      // we defined an icon to use.
      : this.iconIndex;
  }

  /**
   * Gets the underlying item for the primary output of this recipe.
   * @return {RPG_Item|RPG_Weapon|RPG_Armor}
   */
  getPrimaryOutput()
  {
    return this.outputs.at(0)
      .getItem();
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

export default CraftingRecipe;

//endregion CraftingRecipe