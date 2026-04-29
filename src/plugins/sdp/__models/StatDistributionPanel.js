//region StatDistributionPanel
/**
 * The class that governs the details of a single SDP.
 * Use the {@link StatDistributionPanelBuilder} to fluently build these.
 */
class StatDistributionPanel
{
  /**
   * A factory that generates builders for creating {@link StatDistributionPanel}s.
   * @returns {StatDistributionPanelBuilder}
   */
  static Builder = () => new StatDistributionPanelBuilder();

  constructor(
    name,
    key,
    iconIndex,
    rarity,
    unlockedByDefault,
    description,
    topFlavorText,
    maxRank,
    baseCost,
    flatGrowthCost,
    multGrowthCost,
    panelParameters,
    panelRewards)
  {
    /**
     * Gets the friendly name for this SDP.
     * @type {string}
     */
    this.name = name;

    /**
     * Gets the unique identifier key that represents this SDP.
     * @type {string}
     */
    this.key = key;

    /**
     * Gets the icon index for this SDP.
     * @type {number}
     */
    this.iconIndex = iconIndex;

    /**
     * Panel rarity (**0–5**, Common..Godlike).
     * @type {number}
     */
    this.rarity = rarity;

    /**
     * Gets whether or not this SDP is unlocked by default.
     * @type {boolean}
     */
    this.unlockedByDefault = unlockedByDefault;

    /**
     * Gets the description for this SDP.
     * @type {string}
     */
    this.description = description;

    /**
     * The description that shows up underneath the name in the details window.
     * @type {string}
     */
    this.topFlavorText = topFlavorText;

    /**
     * Gets the maximum rank for this SDP.
     * @type {number}
     */
    this.maxRank = maxRank;

    /**
     * Additive offset on top of the rarity default base SDP (see `config.sdp.json`; core curve lives in plugin params).
     * @type {number}
     */
    this.baseCost = baseCost;

    /**
     * Additive offset on the rarity default exponential coefficient (**flat** term before `mult ** step`).
     * @type {number}
     */
    this.flatGrowthCost = flatGrowthCost;

    /**
     * Multiplier applied to the rarity default **mult** (keep **1.0** for “use defaults only”).
     * @type {number}
     */
    this.multGrowthCost = multGrowthCost;

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
   * Retrieves all panel parameters associated with a provided `paramId`.
   * @param {number} paramId The `paramId` to find parameters for.
   * @returns {PanelParameter[]}
   */
  getPanelParameterById(paramId)
  {
    const { panelParameters } = this;
    return panelParameters.filter(panelParameter => panelParameter.parameterId === paramId);
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

  calculateBonusByRank(paramId, currentRank, baseParam = 0, fractional = false)
  {
    // determine all the applicable panel parameters.
    const panelParameters = this.panelParameters.filter(panelParameter => panelParameter.parameterId === paramId);

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

//endregion StatDistributionPanel