//region StatDistributionPanelBuilder
import PanelIdentity from './PanelIdentity.js';
import PanelMastery from './PanelMastery.js';
import PanelProgression from './PanelProgression.js';
import PanelRarity from './PanelRarity.js';
import StatDistributionPanel from './StatDistributionPanel.js';

/**
 * A builder for creating {@link StatDistributionPanel}.
 */
class StatDistributionPanelBuilder
{
  #key = String.empty;
  #identity = PanelIdentity.empty();
  #progression = PanelProgression.defaults();
  #parameters = [];
  #rewards = [];
  #mastery = PanelMastery.none();

  /**
   * Builds the configured panel.
   * @returns {StatDistributionPanel}
   */
  build()
  {
    return new StatDistributionPanel(
      this.#key,
      this.#identity,
      // policy step inside build.
      this.#progression,
      this.#parameters,
      this.#rewards,
      this.#mastery);
  }

  //region setters
  name(name)
  {
    this.#identity.name = name;
    return this;
  }

  key(key)
  {
    this.#key = key;
    return this;
  }

  iconIndex(iconIndex)
  {
    this.#identity.iconIndex = iconIndex;
    return this;
  }

  unlockedByDefault(unlockedByDefault)
  {
    this.#identity.unlockedByDefault = unlockedByDefault;
    return this;
  }

  description(description)
  {
    this.#identity.description = description;
    return this;
  }

  flavorText(flavorText)
  {
    this.#identity.topFlavorText = flavorText;
    return this;
  }

  maxRank(maxRank)
  {
    this.#progression.maxRank = maxRank;
    return this;
  }

  baseCost(baseCost)
  {
    this.#progression.baseCost = baseCost;
    return this;
  }

  flatGrowth(flatGrowth)
  {
    this.#progression.flatGrowthCost = flatGrowth;
    return this;
  }

  multGrowth(multGrowth)
  {
    this.#progression.multGrowthCost = multGrowth;
    return this;
  }

  rarity(rarity)
  {
    this.#progression.rarity = PanelRarity.normalizeRarityFromJson(rarity);
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

  /**
   * Sets presentation and unlock metadata for this panel.
   * @param {PanelIdentity} identity The identity driving this step.
   * @returns {StatDistributionPanelBuilder}
   */
  identity(identity)
  {
    this.#identity = identity;
    return this;
  }

  /**
   * Sets rank cap, rarity tier, and rank-up cost offsets for this panel.
   * @param {PanelProgression} progression The progression driving this step.
   * @returns {StatDistributionPanelBuilder}
   */
  progression(progression)
  {
    this.#progression = progression;
    return this;
  }

  /**
   * Sets subgroup mastery enrollment for this panel.
   * @param {PanelMastery} mastery The mastery driving this step.
   * @returns {StatDistributionPanelBuilder}
   */
  mastery(mastery)
  {
    this.#mastery = mastery;
    return this;
  }

  //endregion setters
}

export default StatDistributionPanelBuilder;
//endregion StatDistributionPanelBuilder