//region PanelSubgroup
import PanelMasteryProse from './PanelMasteryProse.js';

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
   * Player-facing mastery description templates, one per act.
   * Lives on the subgroup rather than the panel because a mastery's mechanic changes at act
   * boundaries, not tier by tier, so three templates cover all ten panels in the strip.
   * @type {PanelMasteryProse}
   */
  prose = PanelMasteryProse.none();

  /**
   * Constructor.
   * @param {string} name The name driving this step.
   * @param {string} key The key driving this step.
   * @param {number} iconIndex The icon index driving this step.
   * @param {string} description The description driving this step.
   * @param {PanelMasteryProse} prose The mastery prose driving this step.
   */
  constructor(name, key, iconIndex, description, prose)
  {
    this.name = name;
    this.key = key;
    this.iconIndex = iconIndex;
    // assign description on this instance for callers.
    this.description = description;
    this.prose = prose;
  }
}

export default PanelSubgroup;
//endregion PanelSubgroup