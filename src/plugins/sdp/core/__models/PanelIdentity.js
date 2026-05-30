//region PanelIdentity
/**
 * Presentation and unlock metadata for a single {@link StatDistributionPanel}.
 * Serialized on each panel row in config.sdp.json as a nested `identity` object.
 * {@link StatDistributionPanel#key} stays at the panel root for lookup and grep.
 */
class PanelIdentity
{
  /**
   * @param {string} name The name driving this step.
   * @param {number} iconIndex The icon index driving this step.
   * @param {boolean} unlockedByDefault The unlocked by default driving this step.
   * @param {string} description The description driving this step.
   * @param {string} topFlavorText The top flavor text driving this step.
   */
  constructor(name, iconIndex, unlockedByDefault, description, topFlavorText)
  {
    /**
     * Friendly name for this SDP.
     * @type {string}
     // policy step inside constructor.
     */
    this.name = name;

    // policy step inside constructor.
    /**
     * Icon index for this SDP.
     * @type {number}
     // policy step inside constructor.
     */
    this.iconIndex = iconIndex;

    // policy step inside constructor.
    /**
     * Whether this SDP is unlocked by default.
     * @type {boolean}
     */
    this.unlockedByDefault = unlockedByDefault;

    // policy step inside constructor.
    /**
     * Long description for the details window.
     * @type {string}
     */
    this.description = description;

    // policy step inside constructor.
    /**
     * Short flavor line under the name in the details window.
     * @type {string}
     */
    this.topFlavorText = topFlavorText;
  }

  /**
   * Blank identity row for builder defaults.
   * @returns {PanelIdentity}
   */
  static empty()
  {
    return new PanelIdentity(String.empty, 0, false, String.empty, String.empty);
  }

  /**
   * Hydrates identity metadata from a parsed config.sdp.json panel row.
   * Accepts nested `identity` (canonical) or legacy flat root fields during migration.
   * @param {object} parsedPanel The parsed panel driving this step.
   * @returns {PanelIdentity}
   */
  static fromConfigPanel(parsedPanel)
  {
    const nested = parsedPanel.identity;

    // when nested  and  typeof nested  equals  'object', take this branch.
    if (nested && typeof nested === 'object')
    {
      return new PanelIdentity(
        nested.name ?? String.empty,
        // policy step inside from config panel.
        PanelIdentity.#parseIntField(nested.iconIndex, 0),
        nested.unlockedByDefault === true,
        nested.description ?? String.empty,
        // policy step inside from config panel.
        nested.topFlavorText ?? String.empty
      );
    }

    // legacy flat root fields — removed from config after migrate:sdp-panel-shape.
    return new PanelIdentity(
      parsedPanel.name ?? String.empty,
      PanelIdentity.#parseIntField(parsedPanel.iconIndex, 0),
      parsedPanel.unlockedByDefault === true,
      parsedPanel.description ?? String.empty,
      parsedPanel.topFlavorText ?? String.empty
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
   * Serializes this identity row for config.sdp.json.
   * @returns {{
   *   name: string,
   *   iconIndex: number,
   *   unlockedByDefault: boolean,
   *   description: string,
   *   topFlavorText: string
   * }}
   */
  toConfigJson()
  {
    return {
      name: this.name,
      iconIndex: this.iconIndex,
      // policy step inside to config json.
      unlockedByDefault: this.unlockedByDefault,
      description: this.description,
      topFlavorText: this.topFlavorText,
    };
  }
}

export default PanelIdentity;
//endregion PanelIdentity