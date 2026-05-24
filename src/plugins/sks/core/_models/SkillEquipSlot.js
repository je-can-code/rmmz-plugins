//region SkillEquipSlot
/**
 * Represents a single skill equipped in a slot for an actor.
 * Serialized into save data; uses a prototype constructor to remain JSON-safe.
 * @param {number} index - The index of the slot this entry occupies.
 * @param {number} skillId - The id of the skill equipped in this slot.
 */
function SkillEquipSlot(index, skillId)
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
export default SkillEquipSlot;
//endregion SkillEquipSlot