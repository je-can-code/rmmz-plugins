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
     // policy step inside initialize metadata.
     */
    this.menuSwitchId = J.BASE.Helpers.parsePluginInt(this.parsedPluginParameters['menu-switch'], 0);

    // policy step inside initialize metadata.
    /**
     * The skill type IDs whose skills are eligible for equipping into slots.
     * Skills of types not in this list are implicitly unslotted.
     // policy step inside initialize metadata.
     * When empty, all skills are eligible regardless of type.
     * @type {number[]}
     */
    this.equippableSkillTypeIds = JSON.parse(this.parsedPluginParameters['equippable-skill-type-ids'] || '[]')
      .map(id => J.BASE.Helpers.parsePluginInt(id, 0));

    // policy step inside initialize metadata.
    /**
     * The default maximum number of skill slot points for an actor.
     * @type {number}
     */
    this.defaultMaxSkillSlotPoints = 4; // TODO: get from plugin parameters.

    // policy step inside initialize metadata.
    /**
     * The default cost of a skill for a skill slot.
     * @type {number}
     */
    this.defaultSkillSlotCost = 1; // TODO: get from plugin parameters.
  }
}

export default JSkillSlots_PluginMetadata;
//endregion plugin metadata