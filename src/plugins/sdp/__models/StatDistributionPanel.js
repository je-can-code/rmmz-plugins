//region StatDistributionPanel
/**
 * The class that governs the details of a single SDP.
 */
class StatDistributionPanel
{
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
     * Gets the color index representing this SDP's rarity.
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
     * The base cost to rank up this panel.
     * @type {number}
     */
    this.baseCost = baseCost;

    /**
     * The flat amount per rank that the cost will grow.
     * @type {number}
     */
    this.flatGrowthCost = flatGrowthCost;

    /**
     * The multiplicative amount per rank that the cost will grow.
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
      const growth = Math.floor(this.multGrowthCost * (this.flatGrowthCost * (currentRank + 1)));
      return this.baseCost + growth;
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
   * Gets the rarity, aka the color index of the rarity of this panel.
   * @returns {number}
   */
  getPanelRarityColorIndex()
  {
    return this.rarity;
  }

  /**
   * Gets the text associated with the rarity of this panel.
   * @returns {string}
   */
  getPanelRarityText()
  {
    switch (this.rarity)
    {
      case 0:
        return "Common";
      case 3:
        return "Magical";
      case 23:
        return "Rare";
      case 31:
        return "Epic";
      case 20:
        return "Legendary";
      case 25:
        return "Godlike";
      default:
        return `unknown rarity: [ ${this.rarity} ]`;
    }
  }

  static Builder = class SDPBuilder
  {
    //region properties
    static #name = String.empty;
    static #key = String.empty;
    static #iconIndex = 0;
    static #rarity = 0;
    static #unlockedByDefault = false;
    static #description = String.empty;
    static #flavorText = String.empty;
    static #maxRank = 1;
    static #baseCost = 0;
    static #flatGrowth = 0;
    static #multGrowth = 1.0;
    static #parameters = [];
    static #rewards = [];

    //endregion properties

    /**
     * Builds the WIP SDP.
     * @return {StatDistributionPanel}
     */
    static build()
    {
      // build the panel based off current parameters.
      const sdp = new StatDistributionPanel(
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

      // wipe all the existing parameters.
      this.#clear();

      // return the built object.
      return sdp;
    }

    //region setters
    static #clear()
    {
      this.#name = String.empty;
      this.#key = String.empty;
      this.#iconIndex = 0;
      this.#unlockedByDefault = false;
      this.#description = String.empty;
      this.#flavorText = String.empty;
      this.#maxRank = 1;
      this.#baseCost = 0;
      this.#flatGrowth = 0;
      this.#multGrowth = 1.0;
      this.#rarity = 0;
      this.#parameters = [];
      this.#rewards = [];
    }

    static name(name)
    {
      this.#name = name;
      return this;
    }

    static key(key)
    {
      this.#key = key;
      return this;
    }

    static iconIndex(iconIndex)
    {
      this.#iconIndex = iconIndex;
      return this;
    }

    static unlockedByDefault(unlockedByDefault)
    {
      this.#unlockedByDefault = unlockedByDefault;
      return this;
    }

    static description(description)
    {
      this.#description = description;
      return this;
    }

    static flavorText(flavorText)
    {
      this.#flavorText = flavorText;
      return this;
    }

    static maxRank(maxRank)
    {
      this.#maxRank = maxRank;
      return this;
    }

    static baseCost(baseCost)
    {
      this.#baseCost = baseCost;
      return this;
    }

    static flatGrowth(flatGrowth)
    {
      this.#flatGrowth = flatGrowth;
      return this;
    }

    static multGrowth(multGrowth)
    {
      this.#multGrowth = multGrowth;
      return this;
    }

    static rarity(rarity)
    {
      this.#rarity = rarity;
      return this;
    }

    static parameters(parameters)
    {
      this.#parameters = parameters;
      return this;
    }

    static rewards(rewards)
    {
      this.#rewards = rewards;
      return this;
    }

    //endregion setters
  }
}

//endregion StatDistributionPanel