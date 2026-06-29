//region RPG_BaseItem
//region critChanceIfStates
/**
 * The conditional crit chance bonuses on this note source, keyed by target state id.
 * Each entry is a [stateId, bonusChance] pair — the bonus applies to all actions executed
 * by the attacker when the target has the specified state active.
 * Covers actors, classes, skills, weapons, armors, enemies, and states.
 * @type {[number, number][]|null}
 */
Object.defineProperty(RPG_BaseItem.prototype, "critChanceIfStates", {
  get: function()
  {
    // parse all <critChanceIfState:[STATE_ID, BONUS_CHANCE]> tags from this note source.
    return RPGManager.getArraysFromNotesByRegex(this, J.CRIT.RegExp.CritChanceIfState);
  },
});
//endregion critChanceIfStates

//region critChanceIfStateTypes
/**
 * The conditional crit chance bonuses on this note source, keyed by state type classifier.
 * Each entry is a [type, bonusChance] pair — the bonus applies to all actions executed by
 * the attacker when the target has any active state carrying the specified type classifier.
 * @type {[string, number][]}
 */
Object.defineProperty(RPG_BaseItem.prototype, "critChanceIfStateTypes", {
  get: function()
  {
    // parse all <critChanceIfStateType:[TYPE, BONUS_CHANCE]> tags from this note source.
    return RPGManager.getArraysFromNotesByRegex(this, J.CRIT.RegExp.CritChanceIfStateType);
  },
});
//endregion critChanceIfStateTypes

//region critAlwaysIfStates
/**
 * The flat list of state ids that guarantee a critical hit for all actions while this note
 * source is active on the attacker, when the target has any one of them active.
 * Aggregated across all <critAlwaysIfState> tags on this note source.
 * @type {number[]}
 */
Object.defineProperty(RPG_BaseItem.prototype, "critAlwaysIfStates", {
  get: function()
  {
    // parse all <critAlwaysIfState:[IDs...]> tags and flatten into a single state id list.
    return RPGManager.getArraysFromNotesByRegex(this, J.CRIT.RegExp.CritAlwaysIfState).flat();
  },
});
//endregion critAlwaysIfStates

//region critAlwaysIfStateTypes
/**
 * The list of state type classifiers that guarantee a critical hit for all actions while this
 * note source is active on the attacker, when the target has any active state carrying one of them.
 * @type {string[]}
 */
Object.defineProperty(RPG_BaseItem.prototype, "critAlwaysIfStateTypes", {
  get: function()
  {
    // parse all <critAlwaysIfStateType:TYPE> tags from this note source.
    return RPGManager.getStringsFromNoteByRegex(this, J.CRIT.RegExp.CritAlwaysIfStateType);
  },
});
//endregion critAlwaysIfStateTypes
//endregion RPG_BaseItem
