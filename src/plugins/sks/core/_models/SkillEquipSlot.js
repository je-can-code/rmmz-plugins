//region SkillEquipSlot
/**
 * One equipped skill occupying a slot on an actor's skill-equip bar.
 * Serialized into save data via {@link JsonEx}; registered so bundled restores keep prototype methods.
 */
class SkillEquipSlot
{
  /**
   * Constructor.
   * @param {number} index The index of the slot this entry occupies.
   * @param {number} skillId The id of the skill equipped in this slot.
   */
  constructor(index, skillId)
  {
    /**
     * The index of the slot this entry occupies.
     * @type {number}
     */
    this.index = index;

    /**
     * The id of the skill equipped in this slot.
     * @type {number}
     */
    this.skillId = skillId;
  }
}

SerializableRegistry.register(SkillEquipSlot);

export default SkillEquipSlot;
//endregion SkillEquipSlot