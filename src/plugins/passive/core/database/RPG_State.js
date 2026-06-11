//region RPG_State
/**
 * Whether this state row should be omitted from the Passives menu list.<br/>
 * Stack amplifiers and other implementation-only passive duplicates stay combat-active via {@link #allStates}.
 * @type {boolean}
 */
Object.defineProperty(RPG_State.prototype, 'hideFromPassiveList', {
  get()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.PASSIVE.RegExp.HideFromPassiveList);
  },
});
//endregion RPG_State