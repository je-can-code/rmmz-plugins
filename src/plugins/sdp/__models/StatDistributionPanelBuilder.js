//region StatDistributionPanelBuilder
/**
 * A builder for creating {@link StatDistributionPanel}.
 */
class StatDistributionPanelBuilder
{
  #name = String.empty;
  #key = String.empty;
  #iconIndex = 0;
  #rarity = 0;
  #unlockedByDefault = false;
  #description = String.empty;
  #flavorText = String.empty;
  #maxRank = 1;
  #baseCost = 0;
  #flatGrowth = 0;
  #multGrowth = 1.0;
  #parameters = [];
  #rewards = [];

  /**
   * Builds the configured panel.
   * @returns {StatDistributionPanel}
   */
  build()
  {
    return new StatDistributionPanel(
      this.#name,
      this.#key,
      this.#iconIndex,
      this.#rarity,
      this.#unlockedByDefault,
      this.#description,
      this.#flavorText,
      this.#maxRank,
      this.#baseCost,
      this.#flatGrowth,
      this.#multGrowth,
      this.#parameters,
      this.#rewards);
  }

  //region setters
  name(name)
  {
    this.#name = name;
    return this;
  }

  key(key)
  {
    this.#key = key;
    return this;
  }

  iconIndex(iconIndex)
  {
    this.#iconIndex = iconIndex;
    return this;
  }

  unlockedByDefault(unlockedByDefault)
  {
    this.#unlockedByDefault = unlockedByDefault;
    return this;
  }

  description(description)
  {
    this.#description = description;
    return this;
  }

  flavorText(flavorText)
  {
    this.#flavorText = flavorText;
    return this;
  }

  maxRank(maxRank)
  {
    this.#maxRank = maxRank;
    return this;
  }

  baseCost(baseCost)
  {
    this.#baseCost = baseCost;
    return this;
  }

  flatGrowth(flatGrowth)
  {
    this.#flatGrowth = flatGrowth;
    return this;
  }

  multGrowth(multGrowth)
  {
    this.#multGrowth = multGrowth;
    return this;
  }

  rarity(rarity)
  {
    this.#rarity = rarity;
    return this;
  }

  parameters(parameters)
  {
    this.#parameters = parameters;
    return this;
  }

  rewards(rewards)
  {
    this.#rewards = rewards;
    return this;
  }

  //endregion setters
}
//endregion StatDistributionPanelBuilder