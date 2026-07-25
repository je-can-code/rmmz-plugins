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
    this.menuSwitchId = J.BASE.Helpers.parsePluginInt(this.parsedPluginParameters['menu-switch'], 0);

    /**
     * The skill type IDs whose skills are eligible for equipping into slots.
     * Skills of types not in this list are implicitly unslotted.
     * When empty, all skills are eligible regardless of type.
     * @type {number[]}
     */
    this.equippableSkillTypeIds = JSON.parse(this.parsedPluginParameters['equippable-skill-type-ids'] || '[]')
      .map(id => J.BASE.Helpers.parsePluginInt(id, 0));

    /**
     * The baseline number of skill slots an actor has when neither the actor nor their class
     * carries a {@link J.SKS.RegExp.BaseSlots} tag.
     * @type {number}
     */
    this.defaultMaxSkillSlots = J.BASE.Helpers.parsePluginInt(this.parsedPluginParameters['default-max-slots'], 4);

    /**
     * The baseline slot point budget an actor has when neither the actor nor their class
     * carries a {@link J.SKS.RegExp.BaseSlotPoints} tag.
     * @type {number}
     */
    this.defaultMaxSkillSlotPoints = J.BASE.Helpers.parsePluginInt(this.parsedPluginParameters['default-max-slot-points'], 4);

    /**
     * The default cost of a skill for a skill slot.
     * @type {number}
     */
    this.defaultSkillSlotCost = 1; // TODO: get from plugin parameters.

    /**
     * Whether or not exclusive mode is enabled. When enabled, only one of slot count or
     * slot points gates equipping (per {@link #slotsOnly}), rather than both together.
     * @type {boolean}
     */
    this.enableExclusiveMode = this.parsedPluginParameters['enable-exclusive-mode'] === 'true';

    /**
     * Which capacity governs equipping while {@link #enableExclusiveMode} is on.
     * True means only slot count matters; false means only slot points matter.
     * Has no effect when {@link #enableExclusiveMode} is false.
     * @type {boolean}
     */
    this.slotsOnly = this.parsedPluginParameters['slots-only'] === 'true';
  }
}

export default JSkillSlots_PluginMetadata;
//endregion plugin metadata