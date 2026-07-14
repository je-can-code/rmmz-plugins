//region plugin metadata
class J_CriticalFactorsPluginMetadata extends PluginMetadata
{
  /**
   * The default critical damage multiplier factor applied to every battler that carries no
   * `<critMultiplierBase:NUM>` notetags. Parsed from the `critMultiplierBaseDefault` plugin
   * parameter, a percent-point value (e.g. `50` becomes the `0.5` factor).
   * @type {number}
   */
  baseCdmFactor = 0.5;

  /**
   * The default critical damage reduction factor applied to every battler that carries no
   * `<critReductionBase:NUM>` notetags. Parsed from the `critReductionBaseDefault` plugin
   * parameter, a percent-point value (e.g. `50` becomes the `0.5` factor).
   * @type {number}
   */
  baseCtrFactor = 0.5;

  /**
   * Constructor.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  /**
   *  Extends {@link #postInitialize}.<br>
   *  Includes translation of plugin parameters.
   */
  postInitialize()
  {
    // execute original logic.
    super.postInitialize();

    // initialize this plugin from configuration.
    this.initializeMetadata();
  }

  /**
   * Initializes the metadata associated with this plugin.
   */
  initializeMetadata()
  {
    const { parsedPluginParameters: p } = this;

    // convert the configured percent-point default into the factor consumed by battler math.
    this.baseCdmFactor = J_CriticalFactorsPluginMetadata.#parsePercentFactorOr(
      p['critMultiplierBaseDefault'],
      this.baseCdmFactor);

    // convert the configured percent-point default into the factor consumed by battler math.
    this.baseCtrFactor = J_CriticalFactorsPluginMetadata.#parsePercentFactorOr(
      p['critReductionBaseDefault'],
      this.baseCtrFactor);
  }

  /**
   * Parses a percent-point plugin parameter (e.g. `"50.00"`) into its `/100` factor.
   * @param {string|number|undefined|null} value The raw plugin parameter value.
   * @param {number} fallback The fallback factor to use when the value is absent or invalid.
   * @returns {number}
   */
  static #parsePercentFactorOr(value, fallback)
  {
    // treat a missing/blank parameter as "use the fallback".
    if (value === undefined || value === null || value === '')
    {
      return fallback;
    }

    // parse the raw percent-point value out of the plugin parameter string.
    const parsed = Number.parseFloat(value);

    // reject anything that didn't parse into a usable number.
    if (!Number.isFinite(parsed))
    {
      return fallback;
    }

    // convert the percent-point value into the factor consumed everywhere else.
    return parsed / 100;
  }
}

export default J_CriticalFactorsPluginMetadata;
//endregion plugin metadata