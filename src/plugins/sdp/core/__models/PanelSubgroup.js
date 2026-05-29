//region PanelSubgroup
/**
 * Authoring metadata for a panel subgroup (mirrors crafting categories).
 * Subgroups group tiered panels whose masteries replace one another.
 * Panels reference a subgroup by key; the registry lives in config.sdp.json `subgroups`.
 */
class PanelSubgroup
{
  /**
   * Friendly name for this subgroup.
   * @type {string}
   */
  name = String.empty;

  /**
   * Unique key referenced by panels via {@link PanelMastery#subgroupKey}.
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
   * @param {string} name
   * @param {string} key
   * @param {number} iconIndex
   * @param {string} description
   */
  constructor(name, key, iconIndex, description)
  {
    this.name = name;
    this.key = key;
    this.iconIndex = iconIndex;
    this.description = description;
  }
}

export default PanelSubgroup;
//endregion PanelSubgroup