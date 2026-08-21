//region KnowledgeExchange
/**
 * A standing offer to convert one kind of knowledge into something from the database.
 *
 * An exchange is named rather than derived from its tag, because a tag may have several things worth
 * spending it on. "Convert all of my offensive knowledge" stops meaning anything the moment a second
 * buyer exists, so the caller names the offer and the tag comes along with it.
 *
 * The rate lives here rather than in code so that a game can decide what knowledge is worth without
 * anybody rebuilding a plugin.
 */
class KnowledgeExchange
{
  /**
   * The datastore each output type is drawn from.
   *
   * This mirrors the shape crafting uses for its own components, but resolves independently: that model
   * belongs to another ship, and this one must work whether or not that ship is installed.
   * @type {Object<string, string>}
   */
  static Types = {
    Item: 'i',
    Weapon: 'w',
    Armor: 'a',
  };

  /**
   * The unique identifier for this exchange, named by whoever triggers it.
   * @type {string}
   */
  key = String.empty;

  /**
   * The key of the {@link KnowledgeTag} this exchange spends.
   * @type {string}
   */
  tagKey = String.empty;

  /**
   * How many points one unit of the output costs.
   * @type {number}
   */
  cost = 0;

  /**
   * The datastore the output is drawn from; one of {@link KnowledgeExchange.Types}.
   * @type {string}
   */
  outputType = String.empty;

  /**
   * The id of the output within its datastore.
   * @type {number}
   */
  outputId = 0;

  /**
   * How many of the output a single unit yields.
   * @type {number}
   */
  outputCount = 0;

  /**
   * Constructor.
   * @param {string} key The unique identifier for this exchange.
   * @param {string} tagKey The key of the knowledge tag this exchange spends.
   * @param {number} cost How many points one unit of the output costs.
   * @param {string} outputType The datastore the output is drawn from.
   * @param {number} outputId The id of the output within its datastore.
   * @param {number} outputCount How many of the output a single unit yields.
   */
  constructor(key, tagKey, cost, outputType, outputId, outputCount)
  {
    this.key = key;
    this.tagKey = tagKey;
    this.cost = cost;
    this.outputType = outputType;
    this.outputId = outputId;
    this.outputCount = outputCount;
  }

  /**
   * How many whole units a given pile of points can buy.<br/>
   * Whatever is left over is not lost- it simply stays banked until it is worth a unit.
   * @param {number} points The points currently held for this exchange's tag.
   * @returns {number}
   */
  unitsAvailable(points)
  {
    const affordable = points / this.cost;

    return Math.floor(affordable);
  }

  /**
   * How many points a given number of units costs in total.
   * @param {number} units The number of units being bought.
   * @returns {number}
   */
  priceOf(units)
  {
    return units * this.cost;
  }

  /**
   * How many of the output a given number of units yields.
   * @param {number} units The number of units being bought.
   * @returns {number}
   */
  yieldOf(units)
  {
    return units * this.outputCount;
  }

  /**
   * The database entry this exchange hands over.
   *
   * Resolved on demand rather than at boot, because the datastores do not exist while configuration is
   * being parsed.
   * @returns {RPG_Item|RPG_Weapon|RPG_Armor}
   */
  resolveOutput()
  {
    switch (this.outputType)
    {
      case KnowledgeExchange.Types.Item:
        return $dataItems.at(this.outputId);
      case KnowledgeExchange.Types.Weapon:
        return $dataWeapons.at(this.outputId);
      case KnowledgeExchange.Types.Armor:
        return $dataArmors.at(this.outputId);
      default:
        throw new Error(`exchange '${this.key}' names an unrecognized output type of '${this.outputType}'.`);
    }
  }
}

export default KnowledgeExchange;
//endregion KnowledgeExchange