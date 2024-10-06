//region Game_Enemy
/**
 * Extends {@link onDeath}.<br/>
 * Also processes quest checks for slain enemies.
 */
J.OMNI.EXT.QUEST.Aliased.Game_Enemy.set('onDeath', Game_Enemy.prototype.onDeath);
Game_Enemy.prototype.onDeath = function()
{
  // perform original logic.
  J.OMNI.EXT.QUEST.Aliased.Game_Enemy.get('onDeath')
    .call(this);

  // process the quest checking for slaying enemies.
  this.processSlayQuestsCheck();
};

/**
 * Evaluate all active slay objectives that relate to this particular enemy.
 */
Game_Enemy.prototype.processSlayQuestsCheck = function()
{
  // grab all the valid objectives.
  const activeSlayObjectives = QuestManager.getValidSlayObjectives();

  // if there are none, don't try to process this.
  if (activeSlayObjectives.length === 0) return;

  // iterate over each of the destination objectives.
  activeSlayObjectives.forEach(objective =>
  {
    // extract the target enemyId from the objective.
    const [ enemyId, ] = objective.slayData();

    // if this isn't the right enemy, then it doesn't count.
    if (this.enemyId() !== enemyId) return;

    // increment the slay counter.
    objective.incrementSlayTargetEnemyAmount();

    // check if we've exceeded the number of required enemies to slay for the objective.
    if (!objective.hasSlainEnoughEnemies()) return;

    console.log(`player has completed the slay objective: ${objective.id} for quest: ${objective.questKey}.`);

    // grab the quest for reference.
    const questToProgress = QuestManager.quest(objective.questKey);

    // flag the quest objective as completed.
    questToProgress.flagObjectiveAsCompleted(objective.id);

    // progress the quest to active its next objective.
    questToProgress.progressObjectives();
  });
};
//endregion Game_Enemy