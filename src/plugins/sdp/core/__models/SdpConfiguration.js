//region SdpConfiguration
import PanelFamily from './PanelFamily.js';
import PanelSubgroup from './PanelSubgroup.js';
import StatDistributionPanel from './StatDistributionPanel.js';

/**
 * Top-level SDP configuration model (panels + subgroup + family registries).
 */
class SdpConfiguration
{
  /**
   * All panels defined in configuration.
   * @type {StatDistributionPanel[]}
   */
  #panels = [];

  /**
   * All subgroups defined in configuration.
   * @type {PanelSubgroup[]}
   */
  #subgroups = [];

  /**
   * All families defined in configuration.
   * @type {PanelFamily[]}
   */
  #families = [];

  /**
   * Subgroup registry rows keyed for panel dropdowns and boot validation.
   * @type {Map<string, PanelSubgroup>}
   */
  #subgroupsMap = new Map();

  /**
   * Family registry rows keyed for menu filtering.
   * @type {Map<string, PanelFamily>}
   */
  #familiesMap = new Map();

  /**
   * Reverse lookup: subgroup key → owning family key (empty when unassigned).
   * @type {Map<string, string>}
   */
  #familyKeyBySubgroupKey = new Map();

  /**
   * Mastery panels grouped by subgroup — used when reconciling learn/forget on max rank.
   * @type {Map<string, StatDistributionPanel[]>}
   */
  #panelsBySubgroupKey = new Map();

  /**
   * Constructor.
   * @param {StatDistributionPanel[]} panels The panels driving this step.
   * @param {PanelSubgroup[]} subgroups The subgroups driving this step.
   * @param {PanelFamily[]} families The families driving this step.
   * @param {Map<string, PanelSubgroup>} subgroupsMap The subgroups map driving this step.
   * @param {Map<string, PanelFamily>} familiesMap The families map driving this step.
   * @param {Map<string, string>} familyKeyBySubgroupKey The family key by subgroup key driving this step.
   * @param {Map<string, StatDistributionPanel[]>} panelsBySubgroupKey The panels by subgroup key driving this step.
   */
  constructor(
    panels,
    subgroups,
    families,
    subgroupsMap,
    familiesMap,
    familyKeyBySubgroupKey,
    panelsBySubgroupKey
  )
  {
    this.#panels = panels;
    this.#subgroups = subgroups;
    this.#families = families;
    // policy step inside constructor.
    this.#subgroupsMap = subgroupsMap;
    this.#familiesMap = familiesMap;
    this.#familyKeyBySubgroupKey = familyKeyBySubgroupKey;
    this.#panelsBySubgroupKey = panelsBySubgroupKey;
  }

  /**
   * Gets the SDP panels that are currently defined in configuration.
   * @returns {StatDistributionPanel[]}
   */
  panels()
  {
    return this.#panels;
  }

  /**
   * Gets the panel subgroups that are currently defined in configuration.
   * @returns {PanelSubgroup[]}
   */
  subgroups()
  {
    return this.#subgroups;
  }

  /**
   * Gets the panel families that are currently defined in configuration.
   * @returns {PanelFamily[]}
   */
  families()
  {
    return this.#families;
  }

  /**
   * Gets the subgroup key map built during configuration validation.
   * @returns {Map<string, PanelSubgroup>}
   */
  subgroupsMap()
  {
    return this.#subgroupsMap;
  }

  /**
   * Gets the family key map built during configuration validation.
   * @returns {Map<string, PanelFamily>}
   */
  familiesMap()
  {
    return this.#familiesMap;
  }

  /**
   * Gets the reverse lookup from subgroup key to family key.
   * @returns {Map<string, string>}
   */
  familyKeyBySubgroupKey()
  {
    return this.#familyKeyBySubgroupKey;
  }

  /**
   * Gets mastery panels grouped by subgroup key (sorted by tier).
   * @returns {Map<string, StatDistributionPanel[]>}
   */
  panelsBySubgroupKey()
  {
    return this.#panelsBySubgroupKey;
  }

  /**
   * A builder class for fluently constructing new {@link SdpConfiguration}s.
   * @type {SdpConfigurationBuilder}
   */
  static builder = new class SdpConfigurationBuilder
  {
    /**
     * Panel state for this builder.
     * @type {StatDistributionPanel[]}
     */
    #panels = [];

    /**
     * Subgroup state for this builder.
     * @type {PanelSubgroup[]}
     */
    #subgroups = [];

    /**
     * Family state for this builder.
     * @type {PanelFamily[]}
     */
    #families = [];

    /**
     * Subgroup map state for this builder.
     * @type {Map<string, PanelSubgroup>}
     */
    #subgroupsMap = new Map();

    /**
     * Family map state for this builder.
     * @type {Map<string, PanelFamily>}
     */
    #familiesMap = new Map();

    /**
     * Subgroup-to-family reverse lookup for this builder.
     * @type {Map<string, string>}
     */
    #familyKeyBySubgroupKey = new Map();

    /**
     * Subgroup panel groupings for this builder.
     * @type {Map<string, StatDistributionPanel[]>}
     */
    #panelsBySubgroupKey = new Map();

    /**
     * Build the instance with the provided fluent parameters.
     * @returns {SdpConfiguration}
     */
    build()
    {
      const newConfig = new SdpConfiguration(
        this.#panels,
        this.#subgroups,
        this.#families,
        this.#subgroupsMap,
        this.#familiesMap,
        this.#familyKeyBySubgroupKey,
        this.#panelsBySubgroupKey
      );

      // policy step inside build.
      this.#clear();

      // hand back new config to the caller.
      return newConfig;
    }

    /**
     * Reverts the state of the builder to an empty builder.
     */
    #clear()
    {
      this.#panels = [];
      this.#subgroups = [];
      this.#families = [];
      // continue the routine with the next policy step.
      this.#subgroupsMap = new Map();
      this.#familiesMap = new Map();
      this.#familyKeyBySubgroupKey = new Map();
      this.#panelsBySubgroupKey = new Map();
    }

    /**
     * Sets the panels for the builder.
     * @param {StatDistributionPanel[]} panels The panels from configuration.
     * @returns {SdpConfigurationBuilder} This builder for fluent-chaining.
     */
    panels(panels)
    {
      this.#panels = panels;
      return this;
    }

    /**
     * Sets the subgroups for the builder.
     * @param {PanelSubgroup[]} subgroups The subgroups from configuration.
     * @returns {SdpConfigurationBuilder} This builder for fluent-chaining.
     */
    subgroups(subgroups)
    {
      this.#subgroups = subgroups;
      return this;
    }

    /**
     * Sets the families for the builder.
     * @param {PanelFamily[]} families The families from configuration.
     * @returns {SdpConfigurationBuilder}
     */
    families(families)
    {
      this.#families = families;
      return this;
    }

    /**
     * Sets the subgroup map for the builder.
     * @param {Map<string, PanelSubgroup>} subgroupsMap The subgroups map driving this step.
     * @returns {SdpConfigurationBuilder}
     */
    subgroupsMap(subgroupsMap)
    {
      this.#subgroupsMap = subgroupsMap;
      return this;
    }

    /**
     * Sets the family map for the builder.
     * @param {Map<string, PanelFamily>} familiesMap The families map driving this step.
     * @returns {SdpConfigurationBuilder}
     */
    familiesMap(familiesMap)
    {
      this.#familiesMap = familiesMap;
      return this;
    }

    /**
     * Sets the subgroup-to-family reverse lookup for the builder.
     * @param {Map<string, string>} familyKeyBySubgroupKey The family key by subgroup key driving this step.
     * @returns {SdpConfigurationBuilder}
     */
    familyKeyBySubgroupKey(familyKeyBySubgroupKey)
    {
      this.#familyKeyBySubgroupKey = familyKeyBySubgroupKey;
      return this;
    }

    /**
     * Sets the subgroup panel groupings for the builder.
     * @param {Map<string, StatDistributionPanel[]>} panelsBySubgroupKey The panels by subgroup key driving this step.
     * @returns {SdpConfigurationBuilder}
     */
    panelsBySubgroupKey(panelsBySubgroupKey)
    {
      this.#panelsBySubgroupKey = panelsBySubgroupKey;
      return this;
    }
  }
}

export default SdpConfiguration;
//endregion SdpConfiguration