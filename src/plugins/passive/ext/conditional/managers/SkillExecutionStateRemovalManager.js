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

      const rules = state.removeOnSkillExecutionRules;

      for (const tuple of rules)
      {
        const stypeId = Number(tuple[0]);
        const chance = Number(tuple[1]);

        if (Number.isNaN(chance) || chance <= 0) continue;

        // stype 0 matches any executed skill type.
        if (stypeId !== 0 && stypeId !== executedStype) continue;

        // this is a purely self-scoped proc- the battler shedding the state is both the roller
        // and the recipient, so both their own positive and negative rolls apply.
        const positiveRolls = 1 + battler.getPositiveRollsForSkill(state);
        const negativeRolls = battler.getNegativeRollsForSkill(state);

        if (RPGManager.fateOf100(battler, chance, positiveRolls, negativeRolls) === false) continue;

        const stacksLossCount = this.#resolveStacksLossCount(battler, state);

        battler.decrementStateStacks(state.id, stacksLossCount);
      }
    }
  }

  /**
   * Mirrors {@link JABS_State#handleStackChangeFromDuration} stack peel amount for one state.
   * @param {Game_Actor|Game_Enemy} battler The battler losing stacks.
   * @param {RPG_State} state The state row to peel- already confirmed live on the battler by the
   * caller, so no re-lookup against $dataStates is needed here.
   * @returns {number} How many stacks to remove in one proc.
   */
  static #resolveStacksLossCount(battler, state)
  {
    const loseAllStacksAtOnce = state.jabsLoseAllStacksAtOnce === true;
    const tracked = $jabsEngine.getJabsStateByUuidAndStateId(battler.getUuid(), state.id);

    if (loseAllStacksAtOnce === true && tracked)
    {
      return tracked.stackCount;
    }

    return 1;
  }
}

export default SkillExecutionStateRemovalManager;
//endregion SkillExecutionStateRemovalManager