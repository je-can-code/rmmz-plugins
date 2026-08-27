//region plugin metadata
class J_CriticalFactorsPluginMetadata extends PluginMetadata
{
  /**
   * The factor used for critical damage multiplication when the plugin parameter is absent or
   * unreadable. This is a static rather than a field initializer on purpose: the parent
   * constructor reaches `initializeMetadata` before any subclass field initializer has run, so a
   * field would still be `undefined` at the moment the fallback is needed - and would then
   * overwrite the parsed result on its way in.
   * @type {number}
   */
  static #DEFAULT_CDM_FACTOR = 0.5;

  /**
   * The factor used for critical damage reduction when the plugin parameter is absent or
   * unreadable. Static for the same reason as {@link #DEFAULT_CDM_FACTOR}.
   * @type {number}
   */
  static #DEFAULT_CTR_FACTOR = 0.5;

  // `baseCdmFactor` and `baseCtrFactor` are deliberately not declared as fields here, and this is
  // the one place in the codebase where that is correct. Field initializers - including valueless
  // ones, which initialize to `undefined` - run only after `super()` returns, and the parent
  // constructor reaches `initializeMetadata` before that. A declaration would therefore overwrite
  // the parsed configuration with its own value on the way in, silently discarding both plugin
  // parameters. `initializeMetadata` is their sole assigner; see the statics above for defaults.

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

    /**
     * The default critical damage multiplier factor applied to every battler that carries no
     * `<critMultiplierBase:NUM>` notetags. A percent-point value (e.g. `50` becomes `0.5`).
     * @type {number}
     */
    this.baseCdmFactor = J_CriticalFactorsPluginMetadata.#parsePercentFactorOr(
      p['critMultiplierBaseDefault'],
      J_CriticalFactorsPluginMetadata.#DEFAULT_CDM_FACTOR);

    /**
     * The default critical damage reduction factor applied to every battler that carries no
     * `<critReductionBase:NUM>` notetags. A percent-point value (e.g. `50` becomes `0.5`).
     * @type {number}
     */
    this.baseCtrFactor = J_CriticalFactorsPluginMetadata.#parsePercentFactorOr(
      p['critReductionBaseDefault'],
      J_CriticalFactorsPluginMetadata.#DEFAULT_CTR_FACTOR);
  }

  /**
   * Parses a percent-point plugin parameter (e.g. `"50.00"`) into its `/100` factor.
   * @param {string|number|undefined|null} value The raw plugin parameter value.
   * @param {number} fallback The fallback factor to use when the value is absent or invalid.
   * @returns {number}
   */
  static #parsePercentFactorOr(value, fallback)
  {
    // parse the raw percent-point value out of the plugin parameter string. a missing or blank
    // parameter stringifies into something unparseable, which the finite check below rejects.
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