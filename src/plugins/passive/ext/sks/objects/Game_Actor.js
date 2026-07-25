//region Game_Actor
/**
 * Extends {@link #getPassiveStateSourcedSkills}.<br/>
 * Narrows the passive-state-sourced skill list down to skills that are exempt from SKS
 * gating (tagged <unslotted>, ineligible for slotting, or exempted for this battler
 * specifically via <unslottedSkills:[...]>) or currently equipped via SKS. This is
 * actor-only- SKS equip state does not exist for enemies, so enemies keep deriving
 * passives from every learned skill via the unmodified base implementation.
 */
J.PASSIVE.EXT.SKS.Aliased.Game_Actor.set('getPassiveStateSourcedSkills', Game_Actor.prototype.getPassiveStateSourcedSkills);
Game_Actor.prototype.getPassiveStateSourcedSkills = function()
{
  // perform original logic.
  const learnedSkills = J.PASSIVE.EXT.SKS.Aliased.Game_Actor.get('getPassiveStateSourcedSkills')
    .call(this);

  // build a lookup of every skill id currently sitting in an SKS slot.
  const equippedIds = new Set(this.equippedSkills()
    .map(skill => skill.id));

  // grab this battler's own per-actor slot-requirement exemptions.
  const forcedUnslottedIds = this.forcedUnslottedSkillIds();

  // keep skills that are exempt from slotting (globally or for this battler), or equipped.
  return learnedSkills.filter(skill => skill.unslotted === true
    || forcedUnslottedIds.has(skill.id)
    || equippedIds.has(skill.id));
};
//endregion Game_Actor
