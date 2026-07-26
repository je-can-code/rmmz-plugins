//region RPG_State
/**
 * Whether or not this state is flagged as an enemy prefix state.
 * @type {boolean}
 */
Object.defineProperty(RPG_State.prototype, 'isEnemyPrefix', {
  get()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.PASSIVE.EXT.AFFIX.RegExp.Prefix);
  },
});

/**
 * Whether or not this state is flagged as an enemy suffix state.
 * @type {boolean}
 */
Object.defineProperty(RPG_State.prototype, 'isEnemySuffix', {
  get()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.PASSIVE.EXT.AFFIX.RegExp.Suffix);
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
    return RPGManager.getNumberFromNoteByRegex(this, J.PASSIVE.EXT.AFFIX.RegExp.Weight, true) ?? 100;
  },
});

/**
 * Optional tier stripe / HUD tint hex from {@link J.PASSIVE.EXT.AFFIX.RegExp.TierColorHex}; absent tag means no color.
 * @type {string|null}
 */
Object.defineProperty(RPG_State.prototype, 'tierColorHex', {
  get()
  {
    return RPGManager.getStringFromNoteByRegex(this, J.PASSIVE.EXT.AFFIX.RegExp.TierColorHex, true);
  }
});

/**
 * The tier rank of this state for map nameplate stripe pips, from {@link J.PASSIVE.EXT.AFFIX.RegExp.AffixTier}.
 * Defaults to 0 if none is found, meaning no pip subdivision (single solid stripe).
 * @type {number}
 */
Object.defineProperty(RPG_State.prototype, 'affixTier', {
  get()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.PASSIVE.EXT.AFFIX.RegExp.AffixTier, true) ?? 0;
  }
});
/**
 * All reward multipliers defined on this state via {@link J.PASSIVE.EXT.AFFIX.RegExp.RewardMultiplier}.
 * Returns a map of reward type key to its multiplier value.
 * @type {Map<string, number>}
 */
Object.defineProperty(RPG_State.prototype, 'rewardMultipliers', {
  get()
  {
    return J.PASSIVE.EXT.AFFIX.Helpers.parseRewardMultipliers(this);
  },
});
//endregion RPG_State