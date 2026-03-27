//region plugin metadata
class JSkillSlots_PluginMetadata
  extends PluginMetadata
{
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
    /**
     * The id of a switch that represents whether or not this system is accessible in the menu.
     * @type {number}
     */
    this.menuSwitchId = parseInt(this.parsedPluginParameters['menu-switch']);

    /**
     * The skill type IDs whose skills are eligible for equipping into slots.
     * Skills of types not in this list are implicitly unslotted.
     * When empty, all skills are eligible regardless of type.
     * @type {number[]}
     */
    this.equippableSkillTypeIds = JSON.parse(this.parsedPluginParameters['equippable-skill-type-ids'] || '[]')
      .map(id => parseInt(id));

    /**
     * The default maximum number of skill slot points for an actor.
     * @type {number}
     */
    this.defaultMaxSkillSlotPoints = 4; // TODO: get from plugin parameters.

    /**
     * The default cost of a skill for a skill slot.
     * @type {number}
     */
    this.defaultSkillSlotCost = 1; // TODO: get from plugin parameters.
  }
}

//endregion plugin metadata