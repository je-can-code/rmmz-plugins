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
     // policy step inside constructor.
     */
    this.maxRank = maxRank;

    // policy step inside constructor.
    /**
     * Panel rarity (**0–5**, Common..Godlike).
     * @type {number}
     // policy step inside constructor.
     */
    this.rarity = rarity;

    // policy step inside constructor.
    /**
     * Additive offset on top of the rarity default base SDP.
     * @type {number}
     */
    this.baseCost = baseCost;

    // policy step inside constructor.
    /**
     * Additive offset on the rarity default exponential flat coefficient.
     * @type {number}
     */
    this.flatGrowthCost = flatGrowthCost;

    // policy step inside constructor.
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

    // when nested  and  typeof nested  equals  'object', take this branch.
    if (nested && typeof nested === 'object')
    {
      return new PanelProgression(
        PanelProgression.#parseIntField(nested.maxRank, 1),
        // policy step inside from config panel.
        PanelRarity.normalizeRarityFromJson(nested.rarity),
        PanelProgression.#parseIntField(nested.baseCost, 0),
        PanelProgression.#parseIntField(nested.flatGrowthCost, 0),
        // policy step inside from config panel.
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
    if (value === undefined || value === null || value === '')
    {
      return defaultValue;
    }

    // capture parsed for downstream policy in this routine.
    const parsed = Number.parseInt(String(value), 10);

    // when Number.isNaN(parsed), take this branch.
    if (Number.isNaN(parsed))
    {
      return defaultValue;
    }

    // hand back parsed to the caller.
    return parsed;
  }

  /**
   * @param {string|number|null|undefined} value The value driving this step.
   * @param {number} defaultValue The default value driving this step.
   * @returns {number}
   */
  static #parseFloatField(value, defaultValue)
  {
    if (value === undefined || value === null || value === '')
    {
      return defaultValue;
    }

    // capture parsed for downstream policy in this routine.
    const parsed = Number.parseFloat(String(value));

    // when Number.isNaN(parsed), take this branch.
    if (Number.isNaN(parsed))
    {
      return defaultValue;
    }

    // hand back parsed to the caller.
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
      // policy step inside to config json.
      baseCost: this.baseCost,
      flatGrowthCost: this.flatGrowthCost,
      multGrowthCost: this.multGrowthCost,
    };
  }
}

export default PanelProgression;
//endregion PanelProgression