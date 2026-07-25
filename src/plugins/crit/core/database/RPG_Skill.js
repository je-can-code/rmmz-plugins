//region RPG_Skill
//region thisCritChanceIfStates
/**
 * The conditional crit chance bonuses for this skill, keyed by target state id.
 * Each entry is a [stateId, bonusChance] pair — the bonus applies only when the
 * target has the specified state active at the time this skill is executed.
 * @type {[number, number][]|null}
 */
Object.defineProperty(RPG_Skill.prototype, "thisCritChanceIfStates", {
  get: function()
  {
    // parse all <thisCritChanceIfState:[STATE_ID, BONUS_CHANCE]> tags from this skill's note.
    return RPGManager.getArraysFromNotesByRegex(this, J.CRIT.RegExp.ThisCritChanceIfState);
  },
});
//endregion thisCritChanceIfStates

//region thisCritChanceIfStateTypes
/**
 * The conditional crit chance bonuses for this skill, keyed by state type classifier.
 * Each entry is a [type, bonusChance] pair — the bonus applies when the target has any
 * active state carrying the specified type classifier.
 * @type {[string, number][]|null}
 */
Object.defineProperty(RPG_Skill.prototype, "thisCritChanceIfStateTypes", {
  get: function()
  {
    // parse all <thisCritChanceIfStateType:[TYPE, BONUS_CHANCE]> tags from this skill's note.
    return RPGManager.getArraysFromNotesByRegex(this, J.CRIT.RegExp.ThisCritChanceIfStateType);
  },
});
//endregion thisCritChanceIfStateTypes

//region thisCritsAlwaysIfStates
/**
 * The flat list of state ids that guarantee a critical hit for this skill when the target
 * has any one of them active. Aggregated across all <thisCritsAlwaysIfState> tags on this skill.
 * @type {number[]}
 */
Object.defineProperty(RPG_Skill.prototype, "thisCritsAlwaysIfStates", {
  get: function()
  {
    // parse all <thisCritsAlwaysIfState:[IDs...]> tags and flatten into a single state id list.
    return RPGManager.getArraysFromNotesByRegex(this, J.CRIT.RegExp.ThisCritsAlwaysIfState).flat();
  },
});
//endregion thisCritsAlwaysIfStates

//region thisCritsAlwaysIfStateTypes
/**
 * The list of state type classifiers that guarantee a critical hit for this skill when the
 * target has any active state carrying one of them.
 * @type {string[]}
 */
Object.defineProperty(RPG_Skill.prototype, "thisCritsAlwaysIfStateTypes", {
  get: function()
  {
    // parse all <thisCritsAlwaysIfStateType:TYPE> tags from this skill's note.
    return RPGManager.getStringsFromNoteByRegex(this, J.CRIT.RegExp.ThisCritsAlwaysIfStateType);
  },
});
//endregion thisCritsAlwaysIfStateTypes
//endregion RPG_Skill
