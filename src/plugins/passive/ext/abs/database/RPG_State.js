//region RPG_State
/**
 * Whether or not this state is flagged as an enemy prefix state.
 * @type {boolean}
 */
Object.defineProperty(RPG_State.prototype, 'isEnemyPrefix', {
  get()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.PASSIVE.EXT.ABS.RegExp.Prefix);
  },
});

/**
 * Whether or not this state is flagged as an enemy suffix state.
 * @type {boolean}
 */
Object.defineProperty(RPG_State.prototype, 'isEnemySuffix', {
  get()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.PASSIVE.EXT.ABS.RegExp.Suffix);
  },
});

/**
 * The weight of this state for enemy affixes.
 * Defaults to 100 if none is found.
 * @type {number}
 */
Object.defineProperty(RPG_State.prototype, 'affixWeight', {
  get()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.PASSIVE.EXT.ABS.RegExp.Weight, true) ?? 100;
  },
});

/**
 * Optional tier stripe / HUD tint hex from {@link J.PASSIVE.EXT.ABS.RegExp.TierColorHex}; absent tag means no color.
 * @type {string|null}
 */
Object.defineProperty(RPG_State.prototype, 'tierColorHex', {
  get()
  {
    return RPGManager.getStringFromNoteByRegex(this, J.PASSIVE.EXT.ABS.RegExp.TierColorHex, true);
  }
});
//endregion RPG_State