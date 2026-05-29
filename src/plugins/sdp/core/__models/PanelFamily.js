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
   * @param {string} name
   * @param {string} key
   * @param {number} iconIndex
   * @param {string} description
   * @param {string[]} subgroupKeys
   */
  constructor(name, key, iconIndex, description, subgroupKeys)
  {
    this.name = name;
    this.key = key;
    this.iconIndex = iconIndex;
    this.description = description;
    this.subgroupKeys = subgroupKeys;
  }
}

export default PanelFamily;
//endregion PanelFamily