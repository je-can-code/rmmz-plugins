//region RecipeSpendResolver
/**
 * Works out what a recipe will actually take from the party, once the player has said which entries fill its
 * categorical slots.
 *
 * A categorical component cannot answer this on its own. Asked its name it gives the category, and asked how many
 * are held it gives {@link CraftingComponent.bestEligibleEntry} - the eligible entry the party holds the most of.
 * That is a reasonable guess while nobody has chosen, and actively wrong the moment somebody has: pick three Big
 * Gelatin while holding twenty-six Small Gel and the component still reports Small Gel, twenty-six. Two separate
 * windows were each asking the component directly, and each getting that same wrong answer.
 *
 * So resolution lives here, once, and the windows render what they are handed.
 *
 * Every figure describes a single craft. Scaling to a batch is the caller's job, because the count changes on every
 * keypress and re-resolving a recipe per frame to multiply two numbers would be work for nothing.
 */
class RecipeSpendResolver
{
  /**
   * One entry's worth of a recipe's cost, for a single craft.
   * @typedef {Object} RecipeSpendLine
   * @property {string} name What to call it - the entry's name, or the category while nothing is chosen.
   * @property {number} iconIndex The icon to draw beside it.
   * @property {number} perCraft How many a single craft takes.
   * @property {number} held How many the party is holding right now.
   */

  /**
   * The entry the player named for a slot, if they named one.
   *
   * Deliberately not falling back to {@link CraftingComponent.getItem}. An absent selection means "nobody has
   * chosen", and the component describes itself better than a guessed entry would - a fixed slot names its row, and
   * a categorical one names its category, which is the honest thing to show while the choice is still open.
   * @param {Map<number, RPG_Item|RPG_Weapon|RPG_Armor>} selections The entries chosen, keyed by ingredient index.
   * @param {number} index Which ingredient is being resolved.
   * @returns {RPG_Item|RPG_Weapon|RPG_Armor|null} The chosen entry, or null when the slot is still open.
   */
  static chosenFor(selections, index)
  {
    if (!selections.has(index)) return null;

    return selections.get(index);
  }

  /**
   * Describes what one ingredient contributes to the bill.
   * @param {CraftingComponent} component The ingredient being described.
   * @param {RPG_Item|RPG_Weapon|RPG_Armor|null} chosen The entry the player named, or null if they have not.
   * @returns {RecipeSpendLine}
   */
  static lineFor(component, chosen)
  {
    const perCraft = component.quantity();

    // nothing chosen: the component is the best description of itself that exists.
    if (chosen === null)
    {
      return {
        name: component.getName(),
        iconIndex: component.getIconIndex(),
        perCraft,
        held: component.getHandledQuantity(),
      };
    }

    return {
      name: chosen.name,
      iconIndex: chosen.iconIndex,
      perCraft,
      held: $gameParty.numItems(chosen),
    };
  }

  /**
   * What two ingredients must share before they count as the same thing leaving the bag.
   *
   * Gold and SDP key on a string because {@link CraftingComponent.getItem} builds them a fresh object every call,
   * so two gold costs would never merge if they keyed on identity. Database rows are shared instances out of the
   * `$data*` tables and key on themselves.
   * @param {CraftingComponent} component The ingredient being keyed.
   * @param {RPG_Item|RPG_Weapon|RPG_Armor|null} chosen The entry the player named, or null if they have not.
   * @returns {RPG_Item|RPG_Weapon|RPG_Armor|string} The identity two ingredients must match on to merge.
   */
  static keyFor(component, chosen)
  {
    if (chosen !== null) return chosen;

    if (component.isGold()) return 'gold';

    if (component.isSdp()) return 'sdp';

    return component.getItem();
  }

  /**
   * One line per distinct entry, summed across every slot that spends it.
   *
   * Merged rather than per-slot because this describes the transaction: two slots both filled with Big Gelatin take
   * four of them per craft, and listing "Big Gelatin x2" twice invites the reader to think one of the two rows is a
   * duplicate rather than a second cost. It also matches how {@link CraftingRecipe.maxCraftableCount} works out the
   * ceiling, so the bill and the limit can never tell different stories.
   *
   * Takes components rather than the recipe that owns them, so the ingredient panel - which is handed a bare array
   * and never sees a recipe - can resolve through exactly the same path.
   * @param {CraftingComponent[]} components The ingredients being described.
   * @param {Map<number, RPG_Item|RPG_Weapon|RPG_Armor>} selections The entries chosen, keyed by ingredient index.
   * @returns {RecipeSpendLine[]}
   */
  static aggregated(components, selections)
  {
    /** @type {Map<RPG_Item|RPG_Weapon|RPG_Armor|string, RecipeSpendLine>} */
    const byEntry = new Map();

    components.forEach((component, index) =>
    {
      const chosen = RecipeSpendResolver.chosenFor(selections, index);
      const key = RecipeSpendResolver.keyFor(component, chosen);

      // first sighting of this entry establishes the row every later slot folds into.
      if (!byEntry.has(key))
      {
        byEntry.set(key, RecipeSpendResolver.lineFor(component, chosen));

        return;
      }

      const running = byEntry.get(key);

      running.perCraft += component.quantity();
    });

    return Array.from(byEntry.values());
  }
}

export default RecipeSpendResolver;
//endregion RecipeSpendResolver