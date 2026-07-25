//region JABS_SkillSlotManager food + allyai integration

//region getEquippedAllySlots
/**
 * Extends {@link JABS_SkillSlotManager.prototype.getEquippedAllySlots}.<br>
 * Adds the UsableItem slot to the list of invalid ally slots so that AI-controlled
 * party members do not autonomously attempt to consume usable items.
 * Usable-item consumption is an intentional player decision, not an AI behavior.
 * @returns {JABS_SkillSlot[]} Equipped slots excluding AI-invalid ones.
 */
J.ABS.EXT.FOOD.Aliased.JABS_SkillSlotManager.set(
  'getEquippedAllySlots', JABS_SkillSlotManager.prototype.getEquippedAllySlots);
JABS_SkillSlotManager.prototype.getEquippedAllySlots = function()
{
  // perform original logic.
  const slots = J.ABS.EXT.FOOD.Aliased.JABS_SkillSlotManager.get('getEquippedAllySlots').call(this);

  // filter out the food slot — allies should not manage food independently.
  return slots.filter(skillSlot => skillSlot.key !== JABS_Button.UsableItem);
};
//endregion getEquippedAllySlots
//endregion JABS_SkillSlotManager food + allyai integration