//region SkillExecutionStateToggleManager
/**
 * Processes {@link RPG_State#toggleStateOnSkillExecutionRules} each time a map battler pays for a skill it is
 * executing, from {@link JABS_Engine#paySkillCosts}.<br/>
 * Each rule names a state and a skill type. A hardcast of that type- any skill of it that costs MP- executed while the
 * battler lacks the state arms it, and one executed while the battler carries it spends it, so those casts alternate:
 * a plain cast, then one the armed state shapes, then a plain one again. That is a Red Mage's Dualcast, when the
 * armed state makes a cast instant and free: a cheap spell arms it, and the big one after it fires free.
 * <p>
 * Running once the cost is paid is what lets the spending cast be the one the state shapes: its cast time was read
 * with the state on when the skill was decided, and its cost a moment ago. Arming and spending both come from a
 * single look at the battler, so the cast that spends a state can never arm it again.
 * </p>
 */
class SkillExecutionStateToggleManager
{
  /**
   * Arms or spends every state the battler's own states toggle for the skill it just paid for.
   * @param {Game_Actor|Game_Enemy} battler The battler that just paid for the skill.
   * @param {RPG_Skill} skill The skill being executed.
   */
  static process(battler, skill)
  {
    // a skill that costs nothing is no hardcast, so it neither arms nor spends one.
    if (this.isHardcast(skill) === false) return;

    // the states named for this type of skill, each once however many sources name it.
    const stateIds = this.stateIdsToggledBy(battler, skill.stypeId);

    // flip each one on this battler.
    stateIds.forEach(stateId => this.toggle(battler, stateId, skill));
  }

  /**
   * Whether the given skill counts as a hardcast, which is what lets it arm or spend a toggled state.<br/>
   * A skill that costs MP is a hardcast, however long or short its cast: a mover that costs MP arms the charge as
   * surely as a slow nuke does. A skill that costs nothing- a weapon swing, a free spell- never touches it, so no
   * cast of the rule's type can ride an armed state for free without spending it. The cost is read as the database
   * row writes it, before any cost rate applies, so the cast the armed state made free still counts as the hardcast
   * it is.
   * @param {RPG_Skill} skill The skill being executed.
   * @returns {boolean}
   */
  static isHardcast(skill)
  {
    // any MP cost at all makes it a hardcast.
    return skill.mpCost > 0;
  }

  /**
   * The ids of the states this battler's own states toggle when it executes a skill of the given type, each listed
   * once.<br/>
   * A state named by two sources, or handed over once per stack of a stacked state, would otherwise be armed and then
   * spent again by the very same execution.
   * @param {Game_Actor|Game_Enemy} battler The battler executing the skill.
   * @param {number} skillTypeId The type of the skill being executed.
   * @returns {number[]}
   */
  static stateIdsToggledBy(battler, skillTypeId)
  {
    // every toggle rule on every state the battler carries, passives included, since that is where they live.
    const rules = battler.allStates()
      .flatMap(state => state.toggleStateOnSkillExecutionRules);

    // a rule answers to its own skill type, or to every type when it names 0.
    const stateIds = rules
      .filter(([ , ruleSkillTypeId ]) => ruleSkillTypeId === 0 || ruleSkillTypeId === skillTypeId)
      .map(([ stateId ]) => stateId);

    // one flip per state, however many times it was named.
    return [ ...new Set(stateIds) ];
  }

  /**
   * Spends the given state when the battler carries it, or arms it when the battler does not.<br/>
   * Spending removes the state outright, every stack of it. Arming applies it with the battler as its source, so
   * the state's own duration runs its timer and lets an unused charge lapse.
   * @param {Game_Actor|Game_Enemy} battler The battler executing the skill.
   * @param {number} stateId The state being toggled.
   * @param {RPG_Skill} skill The skill being executed, credited as the source of a state it arms.
   */
  static toggle(battler, stateId, skill)
  {
    // carried: this execution spends it.
    if (battler.isStateAffected(stateId))
    {
      battler.removeState(stateId);
      return;
    }

    // not carried: this execution arms it for the next one.
    battler.addState(stateId, battler, skill);
  }
}

export default SkillExecutionStateToggleManager;
//endregion SkillExecutionStateToggleManager