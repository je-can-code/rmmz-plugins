//region Game_Actor
/**
 * Extends {@link #increaseSkillProficiency}.<br/>
 * Also credits the party with whatever kinds of knowledge that skill's use produces.
 *
 * This is deliberately hung on the actor rather than on the battler. {@link Game_Enemy} defines its own
 * `increaseSkillProficiency`, so an enemy practising its craft on the party never mints knowledge, and
 * that exclusion costs no guard- the class boundary is the rule.
 */
J.PROF.EXT.KNOWLEDGE.Aliased.Game_Actor.set('increaseSkillProficiency', Game_Actor.prototype.increaseSkillProficiency);
Game_Actor.prototype.increaseSkillProficiency = function(skillId, amount = 1)
{
  // perform original logic.
  J.PROF.EXT.KNOWLEDGE.Aliased.Game_Actor.get('increaseSkillProficiency')
    .call(this, skillId, amount);

  // credit whatever the use of that skill teaches the party.
  this.gainKnowledgeFromSkillUse(skillId, amount);
};

/**
 * Credits the party with the knowledge that using a given skill produces.
 *
 * Proficiency can be handed out in the negative by the plugin commands that reward it, and a debit must
 * not claw knowledge back: the points may already have been spent, and taking them from a balance that
 * no longer holds them would leave the ledger disagreeing with what the player is carrying.
 * @param {number} skillId The id of the skill that was used.
 * @param {number} amount How much proficiency was gained by using it.
 */
Game_Actor.prototype.gainKnowledgeFromSkillUse = function(skillId, amount)
{
  // a debit reduces proficiency and leaves what was already learned alone.
  if (amount <= 0) return;

  const tagKeys = J.PROF.EXT.KNOWLEDGE.Metadata.tagKeysForSkillId(skillId);

  // knowledge is credited at the same rate proficiency is, so anything boosting one boosts the other.
  tagKeys.forEach(tagKey => $gameParty.gainKnowledgePoints(tagKey, amount));
};
//endregion Game_Actor