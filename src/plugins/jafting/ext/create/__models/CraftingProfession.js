//region CraftingProfession
/**
 * A family of crafting categories that share a currency and a price ladder.
 *
 * A profession answers the two questions a category cannot: which scrap buys its recipes, and what a
 * tier costs. Both used to be decided by matching category keys against hardcoded prefixes, which put
 * the answer in code, keyed it off a string that could be renamed at any time, and could not express a
 * line whose materials belong to a different craft than its prefix suggests.
 */
class CraftingProfession
{
  //region properties
  /**
   * The unique key of this profession, which categories name to join it.
   * @type {string}
   */
  key = String.empty;

  /**
   * The name of this profession as presented to the player.
   * @type {string}
   */
  name = String.empty;

  /**
   * The icon index of this profession.
   * @type {number}
   */
  iconIndex = -1;

  /**
   * The description of this profession.
   * @type {string}
   */
  description = String.empty;

  /**
   * The id of the item spent to learn any recipe belonging to this profession.<br/>
   * A zero means nothing in this profession is bought at all.
   * @type {number}
   */
  scrapItemId = 0;

  /**
   * The scrap each tier costs to learn, the first entry being tier 1.<br/>
   * The length of this table is how deep the profession goes.
   * @type {number[]}
   */
  tierPrices = [];

  //endregion properties

  /**
   * Constructor.
   * @param {string} key The unique key categories name to join this profession.
   * @param {string} name The name presented to the player.
   * @param {number} iconIndex The icon shown alongside the name.
   * @param {string} description The authoring note describing what this profession makes.
   * @param {number} scrapItemId The item spent to learn these recipes, or 0 when none are for sale.
   * @param {number[]} tierPrices What each tier costs, lowest first.
   */
  constructor(key, name, iconIndex, description, scrapItemId, tierPrices)
  {
    this.key = key;
    this.name = name;
    this.iconIndex = iconIndex;
    this.description = description;
    this.scrapItemId = scrapItemId;
    this.tierPrices = tierPrices;
  }

  /**
   * Gets the scrap a recipe of the given tier costs to learn.
   *
   * A tier past the end of the price table answers zero rather than the deepest price, which is what
   * lets a roster grow past its economy without quietly pricing the new rungs at the old maximum. An
   * untiered recipe answers zero for the same reason: it named no rung, so there is no rung to charge.
   * @param {number} tier The rung the recipe sits on, the first being 1.
   * @returns {number} The price, or 0 when this tier carries none.
   */
  priceForTier(tier)
  {
    // an untiered recipe has no rung to read, so there is nothing to charge for.
    if (tier <= 0) return 0;

    // a rung past the end of the table is unpriced rather than free, which reads the same downstream.
    const price = this.tierPrices.at(tier - 1) ?? 0;

    return price;
  }

  /**
   * Determines whether anything in this profession can be bought at all.
   *
   * A profession with no currency or no prices is not broken - it is one whose recipes are placed by
   * hand in the world rather than taught by a shop, which is exactly how alchemy is meant to work.
   * @returns {boolean} True if this profession sells anything, false otherwise.
   */
  isForSale()
  {
    // without a currency there is nothing to spend, whatever the table says.
    if (this.scrapItemId <= 0) return false;

    // without a single priced rung there is nothing to spend it on.
    if (this.tierPrices.length === 0) return false;

    return true;
  }
}

export default CraftingProfession;

//endregion CraftingProfession