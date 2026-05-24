/**
 * The slot cost for this equip skill.
 */
Object.defineProperty(RPG_Skill.prototype, 'slotCost', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.SKS.RegExp.SlotCost);
  }
});

/**
 * Whether this skill is perpetually active without needing to be assigned to a slot.
 * Unslotted skills do not appear in the SKS equip list.
 *
 * A skill is considered unslotted if any of the following are true:
 *  - It carries the explicit {@link J.SKS.RegExp.Unslotted} notetag.
 *  - Passive skill type IDs are configured and this skill's type is not among them.
 */
Object.defineProperty(RPG_Skill.prototype, 'unslotted', {
  get: function()
  {
    // check if this skill is explicitly tagged as unslotted.
    const isExplicitlyUnslotted = RPGManager.checkForBooleanFromNoteByRegex(this, J.SKS.RegExp.Unslotted);

    // if explicitly tagged, it is unslotted regardless of skill type.
    if (isExplicitlyUnslotted) return true;

    // retrieve the configured equippable skill type ids.
    const equippableTypeIds = J.SKS.Metadata.equippableSkillTypeIds;

    // if no types are configured, all skills are eligible for slots.
    if (equippableTypeIds.length === 0) return false;

    // skills whose type is not in the equippable list are implicitly unslotted.
    return equippableTypeIds.includes(this.stypeId) === false;
  }
});