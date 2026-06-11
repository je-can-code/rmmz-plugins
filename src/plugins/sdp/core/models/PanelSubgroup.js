//region PanelSubgroup
/**
 * Authoring metadata for a panel subgroup (mirrors crafting categories).
 * Subgroups group tiered panels whose masteries replace one another.
 */
class PanelSubgroup
{
  /**
   * Friendly name for this subgroup.
   * @type {string}
   */
  name = String.empty;

  /**
   * Unique key referenced by panels via {@link StatDistributionPanel#subgroupKey}.
   * @type {string}
   */
  key = String.empty;

  /**
   * Icon index for editor chrome and future UI.
   * @type {number}
   */
  iconIndex = -1;

  /**
   * Designer-facing description of the subgroup fantasy.
   * @type {string}
   */
  description = String.empty;

  /**
   * Constructor.
   * @param {string} name The name driving this step.
   * @param {string} key The key driving this step.
   * @param {number} iconIndex The icon index driving this step.
   * @param {string} description The description driving this step.
   */
  constructor(name, key, iconIndex, description)
  {
    this.name = name;
    this.key = key;
    this.iconIndex = iconIndex;
    // assign description on this instance for callers.
    this.description = description;
  }
}

export default PanelSubgroup;
//endregion PanelSubgroup