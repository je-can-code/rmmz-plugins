//region StatDistributionPanel
import PanelIdentity from './PanelIdentity.js';
import PanelMastery from './PanelMastery.js';
import PanelProgression from './PanelProgression.js';
import StatDistributionPanelBuilder from './StatDistributionPanelBuilder.js';
import PanelRankupReward from './PanelRankupReward.js';
import PanelParameter from './PanelParameter.js';
import PanelRarity from './PanelRarity.js';

/**
 * The class that governs the details of a single SDP.
 * Use the {@link StatDistributionPanelBuilder} to fluently build these.
 */
class StatDistributionPanel
{
  /**
   * @param {string} key The key driving this step.
   * @param {PanelIdentity} identity The identity driving this step.
   * @param {PanelProgression} progression The progression driving this step.
   * @param {PanelParameter[]} panelParameters The panel parameters driving this step.
   * @param {PanelRankupReward[]} panelRewards The panel rewards driving this step.
   * @param {PanelMastery} mastery The mastery driving this step.
   */
  constructor(
    key,
    identity,
    progression,
    panelParameters,
    panelRewards,
    mastery)
  {
    /**
     * Unique identifier key that represents this SDP (root-level in config.sdp.json).
     * @type {string}
     */
    this.key = key;

    /**
     * Presentation and unlock metadata for this panel.
     * @type {PanelIdentity}
     */
    this.identity = identity;

    /**
     * Rank cap, rarity tier, and rank-up cost offsets for this panel.
     * @type {PanelProgression}
     */
    this.progression = progression;

    /**
     * The collection of all parameters that this panel affects when ranking it up.
     * @returns {PanelParameter[]}
     */
    this.panelParameters = panelParameters;

    /**
     * The collection of all rewards this panel can grant by ranking it up.
     * @type {PanelRankupReward[]}
     */
    this.panelRewards = panelRewards;

    /**
     * Subgroup mastery enrollment for this panel.
     * @type {PanelMastery}
     */
    this.mastery = mastery;
  }

  /**
   * Friendly name for this SDP.
   * @returns {string}
   */
  get name()
  {
    return this.identity.name;
  }

  /**
   * Icon index for this SDP.
   * @returns {number}
   */
  get iconIndex()
  {
    return this.identity.iconIndex;
  }

  /**
   * Whether this SDP is unlocked by default.
   * @returns {boolean}
   */
  get unlockedByDefault()
  {
    return this.identity.unlockedByDefault;
  }

  /**
   * Long description for the details window.
   * @returns {string}
   */
  get description()
  {
    return this.identity.description;
  }

  /**
   * Short flavor line under the name in the details window.
   * @returns {string}
   */
  get topFlavorText()
  {
    return this.identity.topFlavorText;
  }

  /**
   * Maximum rank for this SDP.
   * @returns {number}
   */
  get maxRank()
  {
    return this.progression.maxRank;
  }

  /**
   * Panel rarity (**0–5**, Common..Godlike).
   * @returns {number}
   */
  get rarity()
  {
    return this.progression.rarity;
  }

  /**
   * Additive offset on top of the rarity default base SDP.
   * @returns {number}
   */
  get baseCost()
  {
    return this.progression.baseCost;
  }

  /**
   * Additive offset on the rarity default exponential flat coefficient.
   * @returns {number}
   */
  get flatGrowthCost()
  {
    return this.progression.flatGrowthCost;
  }

  /**
   * Multiplier applied to the rarity default mult.
   * @returns {number}
   */
  get multGrowthCost()
  {
    return this.progression.multGrowthCost;
  }

  /**
   * Whether this panel participates in the subgroup mastery program.
   * @returns {boolean}
   */
  participatesInMasteryProgram()
  {
    return this.mastery.participates();
  }

  /**
   * Calculates the cost of SDP points to rank this panel up.
   *
   * Combines plugin-parameter rarity defaults with per-panel offsets from
   * **J.SDP.Metadata.resolveEffectiveRankUpCostParts** — effective cost is
   * `base + floor(flat * mult^(currentRank + 1))` with resolved **base**, **flat**, and **mult**.
   *
   * @param {number} currentRank The current ranking of this panel for a given actor.
   * @returns {number}
   */
  rankUpCost(currentRank)
  {
    if (currentRank === this.maxRank)
    {
      return 0;
    }
    else
    {
      const rankExponent = currentRank + 1;

      const parts = J.SDP.Metadata.resolveEffectiveRankUpCostParts(this);

      // Use ** here; Vitest stubs global Math (Math.pow may be missing) while ** stays native.
      const growth = Math.floor(parts.flatGrowthCost * (parts.multGrowthCost ** rankExponent));

      return parts.baseCost + growth;
    }
  }

  /**
   * Retrieves all panel parameters associated with a provided registry key.
   * @param {string} parameterKey The registry key to find parameters for.
   * @returns {PanelParameter[]}
   */
  getPanelParameterByKey(parameterKey)
  {
    const { panelParameters } = this;
    return panelParameters.filter(panelParameter => panelParameter.parameterKey === parameterKey);
  }

  /**
   * Gets the panel rewards attached to the provided `rank`.
   * @param {number} rank The rank to check and see if there are any rewards for.
   * @returns {PanelRankupReward[]}
   */
  getPanelRewardsByRank(rank)
  {
    const { panelRewards } = this;
    return panelRewards.filter(reward => reward.rankRequired === rank);
  }

  /**
   * Gets whether or not this SDP is unlocked.
   * @returns {boolean} True if this SDP is unlocked, false otherwise.
   */
  isUnlocked()
  {
    return $gameParty.isSdpUnlocked(this.key);
  }

  /**
   * Sets this SDP to be unlocked.
   */
  unlock()
  {
    $gameParty.unlockSdp(this.key);
  }

  /**
   * Sets this SDP to be locked.
   */
  lock()
  {
    $gameParty.lockSdp(this.key);
  }

  calculateBonusByRank(parameterKey, currentRank, baseParam = 0, fractional = false)
  {
    // determine all the applicable panel parameters.
    const panelParameters = this.panelParameters.filter(
      panelParameter => panelParameter.parameterKey === parameterKey
    );

    // short circuit if we have no applicable parameters.
    if (!panelParameters.length) return 0;

    // initialize the running value.
    let val = 0;

    // iterate over each matching panel parameter.
    panelParameters.forEach(panelParameter =>
    {
      // grab the per-rank bonus on this panel.
      const {
        perRank,
        isFlat
      } = panelParameter;

      // check if the panel should use the percent or flat formula.
      if (!isFlat)
      {
        // calculate the factor per panel rank.
        const factor = (currentRank * perRank) / 100;

        // add the product to the running total.
        val += (baseParam * factor);
      }
      // it is flat.
      else
      {
        // the flat formula.
        val += (currentRank * perRank);
      }
    });

    // check if this is a non-base parameter like CRI or HRG.
    if (fractional)
    {
      // divide by 100 to create a factor out of it.
      val /= 100;
    }

    // return the total.
    return val;
  }

  /**
   * Window text color index for SDP chrome for this panel's rarity.
   *
   * @returns {number}
   */
  getPanelRarityColorIndex()
  {
    return PanelRarity.rarityIndexToColorIndex(this.rarity);
  }

  /**
   * Gets the text associated with the rarity of this panel.
   *
   * @returns {string}
   */
  getPanelRarityText()
  {
    switch (this.rarity)
    {
      case PanelRarity.RARITY_COMMON:
        return PanelRarity.Common;
      case PanelRarity.RARITY_MAGICAL:
        return PanelRarity.Magical;
      case PanelRarity.RARITY_RARE:
        return PanelRarity.Rare;
      case PanelRarity.RARITY_EPIC:
        return PanelRarity.Epic;
      case PanelRarity.RARITY_LEGENDARY:
        return PanelRarity.Legendary;
      case PanelRarity.RARITY_GODLIKE:
        return PanelRarity.Godlike;
      default:
        return `unknown rarity: [ ${this.rarity} ]`;
    }
  }
}

StatDistributionPanel.Builder = () => new StatDistributionPanelBuilder();

export default StatDistributionPanel;
//endregion StatDistributionPanel