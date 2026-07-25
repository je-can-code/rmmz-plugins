//region RPG_Enemy
/**
 * Whether or not this enemy is blocked from having passive prefixes.
 * @type {boolean}
 */
Object.defineProperty(
  RPG_Enemy.prototype, 'noRngPrefixes', {
    get()
    {
      return RPGManager.checkForBooleanFromNoteByRegex(this, J.PASSIVE.EXT.AFFIX.RegExp.NoRngPassivePrefixes);
    }
  },
);

/**
 * Whether or not this enemy is blocked from having passive suffixes.
 * @type {boolean}
 */
Object.defineProperty(
  RPG_Enemy.prototype, 'noRngSuffixes', {
    get()
    {
      return RPGManager.checkForBooleanFromNoteByRegex(this, J.PASSIVE.EXT.AFFIX.RegExp.NoRngPassiveSuffixes);
    }
  },
);

/**
 * Whether or not this enemy is blocked from random passive affix rolls on both slots.
 * @type {boolean}
 */
Object.defineProperty(
  RPG_Enemy.prototype, 'noRngPassives', {
    get()
    {
      return RPGManager.checkForBooleanFromNoteByRegex(this, J.PASSIVE.EXT.AFFIX.RegExp.NoRngPassives);
    }
  },
);

/**
 * Optional override for the passive prefix affix roll percent ({@code 0}–{@code 100}) from this enemy's note.
 * @type {number|null}
 */
Object.defineProperty(
  RPG_Enemy.prototype, 'passiveAffixPrefixChance', {
    get()
    {
      return RPGManager.getNumberFromNoteByRegex(
        this,
        J.PASSIVE.EXT.AFFIX.RegExp.PassiveAffixPrefixChance,
        true
      );
    }
  },
);

/**
 * Optional override for the passive suffix affix roll percent ({@code 0}–{@code 100}) from this enemy's note.
 * @type {number|null}
 */
Object.defineProperty(
  RPG_Enemy.prototype, 'passiveAffixSuffixChance', {
    get()
    {
      return RPGManager.getNumberFromNoteByRegex(
        this,
        J.PASSIVE.EXT.AFFIX.RegExp.PassiveAffixSuffixChance,
        true
      );
    }
  },
);
/**
 * All reward multipliers defined on this enemy via {@link J.PASSIVE.EXT.AFFIX.RegExp.RewardMultiplier}.
 * Returns a map of reward type key to its multiplier value.
 * @type {Map<string, number>}
 */
Object.defineProperty(
  RPG_Enemy.prototype, 'rewardMultipliers', {
    get()
    {
      return J.PASSIVE.EXT.AFFIX.Helpers.parseRewardMultipliers(this);
    }
  },
);
//endregion RPG_Enemy