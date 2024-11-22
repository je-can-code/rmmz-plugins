//region plugin commands
/**
 * Plugin command for modifying proficiency for one or more actors for one or more skills by a given amount.
 */
PluginManager.registerCommand(J.PROF.Metadata.Name, "modifyActorSkillProficiency", args =>
{
  const {
    actorIds, skillIds
  } = args;

  const parsedActorIds = JSON.parse(actorIds)
    .map(num => parseInt(num));
  const parsedSkillIds = JSON.parse(skillIds)
    .map(num => parseInt(num));
  let { amount } = args;
  amount = parseInt(amount);
  parsedSkillIds.forEach(skillId =>
  {
    parsedActorIds.forEach(actorId =>
    {
      $gameActors
        .actor(actorId)
        .increaseSkillProficiency(skillId, amount);
    });
  });
});

/**
 * Plugin command for modifying proficiency of the whole party for one or more skills by a given amount.
 */
PluginManager.registerCommand(J.PROF.Metadata.Name, "modifyPartySkillProficiency", args =>
{
  const { skillIds } = args;
  let { amount } = args;
  const parsedSkillIds = JSON.parse(skillIds)
    .map(num => parseInt(num));
  amount = parseInt(amount);
  $gameParty.members()
    .forEach(actor =>
    {
      parsedSkillIds.forEach(skillId =>
      {
        actor.increaseSkillProficiency(skillId, amount);
      });
    });
});
//endregion plugin commands