//region Game_Actor
/**
 * Filters a candidate skill pool down to those exempt from SKS gating (tagged
 * <unslotted>, or otherwise ineligible for slotting) or currently SKS-equipped.
 * @param {Game_Actor} actor The actor whose SKS equip state governs the filter.
 * @param {RPG_Skill[]} candidates The unfiltered candidate pool to narrow.
 * @returns {RPG_Skill[]}
 */
function filterToEquippedOrExempt(actor, candidates)
{
  // build a lookup of every skill id currently sitting in an SKS slot.
  const equippedSkillIds = actor.equippedSkills()
    .map(skill => skill.id);

  const equippedIds = new Set(equippedSkillIds);

  // keep only skills that are exempt from slotting entirely, or actually equipped.
  return candidates.filter(skill => skill.unslotted === true || equippedIds.has(skill.id));
}

/**
 * Extends {@link #buildCombatSkillCandidatePool}.<br/>
 * Narrows the combat quick-menu candidate pool down to SKS-equipped (or exempt) skills.
 */
J.SKS.EXT.ABS.Aliased.Game_Actor.set('buildCombatSkillCandidatePool', Game_Actor.prototype.buildCombatSkillCandidatePool);
Game_Actor.prototype.buildCombatSkillCandidatePool = function()
{
  // perform original logic.
  const candidates = J.SKS.EXT.ABS.Aliased.Game_Actor.get('buildCombatSkillCandidatePool')
    .call(this);

  // narrow the pool down to what this actor has actually equipped via SKS.
  return filterToEquippedOrExempt(this, candidates);
};

/**
 * Extends {@link #buildDodgeSkillCandidatePool}.<br/>
 * Narrows the dodge quick-menu candidate pool down to SKS-equipped (or exempt) skills.
 */
J.SKS.EXT.ABS.Aliased.Game_Actor.set('buildDodgeSkillCandidatePool', Game_Actor.prototype.buildDodgeSkillCandidatePool);
Game_Actor.prototype.buildDodgeSkillCandidatePool = function()
{
  // perform original logic.
  const candidates = J.SKS.EXT.ABS.Aliased.Game_Actor.get('buildDodgeSkillCandidatePool')
    .call(this);

  // narrow the pool down to what this actor has actually equipped via SKS.
  return filterToEquippedOrExempt(this, candidates);
};

/**
 * Extends {@link #buildOffhandAssignableSkillPool}.<br/>
 * Narrows the offhand quick-menu candidate pool down to SKS-equipped (or exempt) skills.
 * The mainhand-provided offhand skill is always exempt- it is granted by the equipped
 * weapon, not learned or chosen by the player, so it was never meant to compete for a slot.
 */
J.SKS.EXT.ABS.Aliased.Game_Actor.set('buildOffhandAssignableSkillPool', Game_Actor.prototype.buildOffhandAssignableSkillPool);
Game_Actor.prototype.buildOffhandAssignableSkillPool = function()
{
  // perform original logic.
  const candidates = J.SKS.EXT.ABS.Aliased.Game_Actor.get('buildOffhandAssignableSkillPool')
    .call(this);

  // the mainhand-provided offhand skill is exempt regardless of SKS equip state.
  const mainhandProvidedSkillId = this.getMainhandProvidedOffhandSkillId();

  // build a lookup of every skill id currently sitting in an SKS slot.
  const equippedSkillIds = this.equippedSkills()
    .map(skill => skill.id);

  const equippedIds = new Set(equippedSkillIds);

  // keep skills that are exempt from slotting, actually equipped, or the weapon-granted skill.
  return candidates.filter(skill => skill.unslotted === true
    || equippedIds.has(skill.id)
    || skill.id === mainhandProvidedSkillId);
};

/**
 * Extends {@link #onSkillUnequipChange}.<br/>
 * Clears any live JABS combat/dodge/offhand slot pointing at a skill that was just
 * unequipped from SKS, so no button is left pointing at a skill the actor can no longer use.
 */
J.SKS.EXT.ABS.Aliased.Game_Actor.set('onSkillUnequipChange', Game_Actor.prototype.onSkillUnequipChange);
Game_Actor.prototype.onSkillUnequipChange = function(slotIndex, skillId)
{
  // perform original logic.
  J.SKS.EXT.ABS.Aliased.Game_Actor.get('onSkillUnequipChange')
    .call(this, slotIndex, skillId);

  // find whichever live JABS slot, if any, is currently holding this skill.
  const jabsSlot = this.getSkillSlotManager()
    .getSlotBySkillId(skillId);

  // if no JABS slot holds this skill, there is nothing to clean up.
  if (!jabsSlot) return;

  // clear the stale assignment so it no longer points at an unequipped skill.
  this.getSkillSlotManager()
    .clearSlot(jabsSlot.key);
};
//endregion Game_Actor
