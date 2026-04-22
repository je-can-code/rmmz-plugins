//region RPG_Enemy
/**
 * Whether or not this enemy is blocked from having passive prefixes.
 * @type {boolean}
 */
Object.defineProperty(
  RPG_Enemy.prototype, 'noRngPrefixes', {
    get()
    {
      return RPGManager.checkForBooleanFromNoteByRegex(this, J.PASSIVE.EXT.ABS.RegExp.NoRngPassivePrefixes);
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
      return RPGManager.checkForBooleanFromNoteByRegex(this, J.PASSIVE.EXT.ABS.RegExp.NoRngPassiveSuffixes);
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
      return RPGManager.checkForBooleanFromNoteByRegex(this, J.PASSIVE.EXT.ABS.RegExp.NoRngPassives);
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
        J.PASSIVE.EXT.ABS.RegExp.PassiveAffixPrefixChance,
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
        J.PASSIVE.EXT.ABS.RegExp.PassiveAffixSuffixChance,
        true
      );
    }
  },
);
//endregion RPG_Enemy