//region SkillExecutionStateRemovalManager
/**
 * Processes {@link RPG_State#removeOnSkillExecutionRules} when a map battler executes a skill.<br/>
 * Peels stacks via {@link Game_Battler#decrementStateStacks} using {@code loseAllStacksAtOnce} policy.
 */
class SkillExecutionStateRemovalManager
{
  /**
   * Rolls removal rules on every combat state this battler currently carries.
   * @param {Game_Actor|Game_Enemy} battler The battler that executed the skill.
   * @param {number} skillId The database skill id that was executed.
   */
  static process(battler, skillId)
  {
    if (!$jabsEngine || $jabsEngine.absEnabled === false) return;

    const skill = $dataSkills[skillId];

    if (!skill) return;

    const executedStype = skill.stypeId;
    const activeStates = battler.states();

    // only states presently on the battler can declare removal rules on their own row.
    for (const state of activeStates)
    {
      if (!state) continue;

      const rules = state.removeOnSkillExecutionRules || [];

      for (const tuple of rules)
      {
        const stypeId = Number(tuple[0]);
        const chance = Number(tuple[1]);

        if (Number.isNaN(chance) || chance <= 0) continue;

        // stype 0 matches any executed skill type.
        if (stypeId !== 0 && stypeId !== executedStype) continue;

        if (RPGManager.chanceIn100(chance) === false) continue;

        const stateId = state.id;
        const stacksLossCount = this.#resolveStacksLossCount(battler, stateId);

        battler.decrementStateStacks(stateId, stacksLossCount);
      }
    }
  }

  /**
   * Mirrors {@link JABS_State#handleStackLossFromDuration} stack peel amount for one state id.
   * @param {Game_Actor|Game_Enemy} battler The battler losing stacks.
   * @param {number} stateId The database state id to peel.
   * @returns {number} How many stacks to remove in one proc.
   */
  static #resolveStacksLossCount(battler, stateId)
  {
    const stateRow = $dataStates[stateId];

    if (!stateRow) return 1;

    const loseAllStacksAtOnce = stateRow.jabsLoseAllStacksAtOnce === true;
    const tracked = $jabsEngine.getJabsStateByUuidAndStateId(battler.getUuid(), stateId);

    if (loseAllStacksAtOnce === true && tracked)
    {
      return tracked.stackCount;
    }

    return 1;
  }
}

export default SkillExecutionStateRemovalManager;
//endregion SkillExecutionStateRemovalManager