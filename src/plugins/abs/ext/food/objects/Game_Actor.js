//region Game_Actor food extensions

//region getUsableItemSkillSlot
/**
 * Gets the skill slot dedicated to the R2 usable-item button.
 * Mirrors the pattern of getToolSkillSlot and getDodgeSkillSlot in J-ABS core.
 * @returns {JABS_SkillSlot} The usable-item slot from this actor's slot manager.
 */
Game_Actor.prototype.getUsableItemSkillSlot = function()
{
  return this.getSkillSlotManager()
    .getSkillSlotByKey(JABS_Button.UsableItem);
};
//endregion getUsableItemSkillSlot
//endregion Game_Actor food extensions