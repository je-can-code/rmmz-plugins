//region Game_Actor
/**
 * Extends {@link #equipSlots}.<br/>
 * Adds a duplicate of the 5th type (accessory).
 */
J.CAMods.Aliased.Game_Actor.set('equipSlots', Game_Actor.prototype.equipSlots);
Game_Actor.prototype.equipSlots = function()
{
  // perform original logic to determine the base slots.
  const baseSlots = J.CAMods.Aliased.Game_Actor.get('equipSlots')
    .call(this);

  // add a copy of the 5th equip type at the end of the list.
  baseSlots.push(5);

  // return the updated equip slots.
  return baseSlots;
};

/**
 * Refreshes all auto-equippable skills available to this battler.
 */
Game_Actor.prototype.refreshAutoEquippedSkills = function()
{
  const allSlots = this.getAllEquippedSkills();

  // iterate over each of the skills and auto-assign/equip them where applicable.
  this.skills()
    .forEach(skill =>
    {
      // extract the skill id.
      const skillId = skill.id;

      // don't autoassign the same skill if a slot already has it somehow.
      if (allSlots.some(slot => slot.id === skillId)) return;

      // process the learned skill!
      this.jabsProcessLearnedSkill(skill.id);
    }, this);
};
//endregion Game_Actor