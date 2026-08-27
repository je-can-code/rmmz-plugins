//region PanelProgression
import PanelRarity from './PanelRarity.js';

/**
 * Rank cap, rarity tier, and rank-up cost offsets for a single {@link StatDistributionPanel}.
 * Serialized on each panel row in config.sdp.json as a nested `progression` object.
 */
class PanelProgression
{
  /**
   * @param {number} maxRank The max rank driving this step.
   * @param {number} rarity The rarity driving this step.
   * @param {number} baseCost The base cost driving this step.
   * @param {number} flatGrowthCost The flat growth cost driving this step.
   * @param {number} multGrowthCost The mult growth cost driving this step.
   */
  constructor(maxRank, rarity, baseCost, flatGrowthCost, multGrowthCost)
  {
    /**
     * Maximum rank for this SDP.
     * @type {number}
     */
    this.maxRank = maxRank;

    /**
     * Panel rarity (**0–5**, Common..Godlike).
     * @type {number}
     */
    this.rarity = rarity;

    /**
     * Additive offset on top of the rarity default base SDP.
     * @type {number}
     */
    this.baseCost = baseCost;

    /**
     * Additive offset on the rarity default exponential flat coefficient.
     * @type {number}
     */
    this.flatGrowthCost = flatGrowthCost;

    /**
     * Multiplier applied to the rarity default mult (**1.0** = defaults only).
     * @type {number}
     */
    this.multGrowthCost = multGrowthCost;
  }

  /**
   * Default progression row for builder defaults.
   * @returns {PanelProgression}
   */
  static defaults()
  {
    return new PanelProgression(1, PanelRarity.RARITY_COMMON, 0, 0, 1.0);
  }

  /**
   * Hydrates progression metadata from a parsed config.sdp.json panel row.
   * Accepts nested `progression` (canonical) or legacy flat root fields during migration.
   * @param {object} parsedPanel The parsed panel driving this step.
   * @returns {PanelProgression}
   */
  static fromConfigPanel(parsedPanel)
  {
    const nested = parsedPanel.progression;

    if (nested)
    {
      return new PanelProgression(
        PanelProgression.#parseIntField(nested.maxRank, 1),
        PanelRarity.normalizeRarityFromJson(nested.rarity),
        PanelProgression.#parseIntField(nested.baseCost, 0),
        PanelProgression.#parseIntField(nested.flatGrowthCost, 0),
        PanelProgression.#parseFloatField(nested.multGrowthCost, 1.0)
      );
    }

    // legacy flat root fields — removed from config after migrate:sdp-panel-shape.
    return new PanelProgression(
      PanelProgression.#parseIntField(parsedPanel.maxRank, 1),
      PanelRarity.normalizeRarityFromJson(parsedPanel.rarity),
      PanelProgression.#parseIntField(parsedPanel.baseCost, 0),
      PanelProgression.#parseIntField(parsedPanel.flatGrowthCost, 0),
      PanelProgression.#parseFloatField(parsedPanel.multGrowthCost, 1.0)
    );
  }

  /**
   * @param {string|number|null|undefined} value The value driving this step.
   * @param {number} defaultValue The default value driving this step.
   * @returns {number}
   */
  static #parseIntField(value, defaultValue)
  {
    const parsed = Number.parseInt(String(value), 10);

    if (Number.isNaN(parsed))
    {
      return defaultValue;
    }

    return parsed;
  }

  /**
   * @param {string|number|null|undefined} value The value driving this step.
   * @param {number} defaultValue The default value driving this step.
   * @returns {number}
   */
  static #parseFloatField(value, defaultValue)
  {
    const parsed = Number.parseFloat(String(value));

    if (Number.isNaN(parsed))
    {
      return defaultValue;
    }

    return parsed;
  }

  /**
   * Serializes this progression row for config.sdp.json.
   * @returns {{
   *   maxRank: number,
   *   rarity: number,
   *   baseCost: number,
   *   flatGrowthCost: number,
   *   multGrowthCost: number
   * }}
   */
  toConfigJson()
  {
    return {
      maxRank: this.maxRank,
      rarity: this.rarity,
      baseCost: this.baseCost,
      flatGrowthCost: this.flatGrowthCost,
      multGrowthCost: this.multGrowthCost,
    };
  }
}

export default PanelProgression;
//endregion PanelProgression