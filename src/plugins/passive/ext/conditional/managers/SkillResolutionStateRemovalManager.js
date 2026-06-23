//region SkillResolutionStateRemovalManager
/**
 * Processes {@link RPG_State#removeOnSkillResolutionRules} when a map battler's action resolves
 * against a target.<br/>
 * Fires after {@link Game_Action#apply} so that state traits (such as ATK bonuses) are still
 * active during damage calculation before the stacks are peeled.<br/>
 * Peels stacks via {@link Game_Battler#decrementStateStacks} using {@code loseAllStacksAtOnce} policy.
 */
class SkillResolutionStateRemovalManager
{
  /**
   * Rolls removal rules on every combat state this battler currently carries.
   * @param {Game_Actor|Game_Enemy} battler - The battler whose action just resolved.
   * @param {number} skillId - The database skill id that resolved against the target.
   */
  static process(battler, skillId)
  {
    // resolution removal only applies while JABS is active.
    if (!$jabsEngine || $jabsEngine.absEnabled === false) return;

    // look up the executed skill in the database.
    const skill = $dataSkills[skillId];

    // if the skill doesn't exist, there is nothing to process.
    if (!skill) return;

    // cache the executed skill's type for stype matching.
    const executedStype = skill.stypeId;

    // only states presently on the battler can declare removal rules on their own row.
    const activeStates = battler.states();

    for (const state of activeStates)
    {
      // skip null/undefined entries in the state array.
      if (!state) continue;

      const rules = state.removeOnSkillResolutionRules || [];

      for (const tuple of rules)
      {
        const stypeId = Number(tuple[0]);
        const chance = Number(tuple[1]);

        // a non-positive chance is never processed.
        if (Number.isNaN(chance) || chance <= 0) continue;

        // stype 0 matches any executed skill type; otherwise require an exact match.
        if (stypeId !== 0 && stypeId !== executedStype) continue;

        // roll the removal chance before doing anything.
        if (RPGManager.chanceIn100(chance) === false) continue;

        // resolve how many stacks to remove for this state.
        const stateId = state.id;
        const stacksLossCount = this.#resolveStacksLossCount(battler, stateId);

        // peel the stacks, which will remove the state entirely if stacks reach zero.
        battler.decrementStateStacks(stateId, stacksLossCount);
      }
    }
  }

  /**
   * Mirrors {@link JABS_State#handleStackLossFromDuration} stack peel amount for one state id.
   * @param {Game_Actor|Game_Enemy} battler - The battler losing stacks.
   * @param {number} stateId - The database state id to peel.
   * @returns {number} - How many stacks to remove in one proc.
   */
  static #resolveStacksLossCount(battler, stateId)
  {
    // look up the state row for the loseAllStacksAtOnce flag.
    const stateRow = $dataStates[stateId];

    // if the state row is missing, fall back to peeling one stack.
    if (!stateRow) return 1;

    // check if this state collapses all stacks at once.
    const loseAllStacksAtOnce = stateRow.jabsLoseAllStacksAtOnce === true;

    // look up the live JABS state tracker to know the current stack count.
    const tracked = $jabsEngine.getJabsStateByUuidAndStateId(battler.getUuid(), stateId);

    // when collapsing all at once and a tracker exists, return the full stack count.
    if (loseAllStacksAtOnce === true && tracked)
    {
      return tracked.stackCount;
    }

    // default to peeling one stack at a time.
    return 1;
  }
}

export default SkillResolutionStateRemovalManager;
//endregion SkillResolutionStateRemovalManager
