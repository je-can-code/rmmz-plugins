//region PanelFamily
/**
 * Authoring metadata for a panel family — groups related subgroups for SDP menu browsing.
 * Subgroups are assigned here; panels reference subgroups via {@link PanelMastery#subgroupKey}.
 */
class PanelFamily
{
  /**
   * Friendly name for this family.
   * @type {string}
   */
  name = String.empty;

  /**
   * Unique key for this family row.
   * @type {string}
   */
  key = String.empty;

  /**
   * Icon index for editor chrome and the in-game family strip.
   * @type {number}
   */
  iconIndex = -1;

  /**
   * Designer-facing description of the family fantasy.
   * @type {string}
   */
  description = String.empty;

  /**
   * Subgroup keys owned by this family (must exist in config.sdp.json `subgroups`).
   * @type {string[]}
   */
  subgroupKeys = [];

  /**
   * Constructor.
   * @param {string} name The name driving this step.
   * @param {string} key The key driving this step.
   * @param {number} iconIndex The icon index driving this step.
   * @param {string} description The description driving this step.
   * @param {string[]} subgroupKeys The subgroup keys driving this step.
   */
  constructor(name, key, iconIndex, description, subgroupKeys)
  {
    this.name = name;
    this.key = key;
    this.iconIndex = iconIndex;
    // assign description on this instance for callers.
    this.description = description;
    this.subgroupKeys = subgroupKeys;
  }
}

export default PanelFamily;
//endregion PanelFamily