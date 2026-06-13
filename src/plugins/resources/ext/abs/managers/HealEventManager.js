//region HealEventManager
/**
 * Manages the dispatch of secondary resource cascades triggered by healing events.
 *
 * When a battler is healed (via the onHeal hook in J-Base), this manager reads
 * onSelf and onAlly tags from the relevant battlers' notes and applies proportional
 * secondary resource gains. Cascades are capped by the healChainDepth plugin parameter
 * to prevent runaway chains.
 */
class HealEventManager
{
  /**
   * Tracks how many cascade rounds are currently in flight.
   * Incremented at the start of each dispatch round and decremented on exit.
   * @type {number}
   */
  static _currentDepth = 0;

  /**
   * The three output resource keys used for looping over possible output resources.
   * @type {string[]}
   */
  static #outputKeys = ['Hp', 'Mp', 'Tp'];

  /**
   * Entry point from the onHeal alias in Game_Battler.js.
   * Converts the J.BASE.Resource string into a PascalCase trigger key and starts dispatch.
   * @param {Game_Battler} recipient The battler that received the heal.
   * @param {string} resource One of J.BASE.Resource.HP / MP / TP.
   * @param {number} amount The positive amount that was recovered.
   */
  static dispatch(recipient, resource, amount)
  {
    this.#dispatch(recipient, this.#resourceToKey(resource), amount);
  }

  /**
   * Internal dispatch entry; enforces the chain depth cap.
   * @param {Game_Battler} recipient The battler that received the heal.
   * @param {string} triggerKey PascalCase resource key ('Hp', 'Mp', 'Tp').
   * @param {number} amount The positive amount that was recovered.
   */
  static #dispatch(recipient, triggerKey, amount)
  {
    // stop cascading once we exceed the configured depth limit.
    if (this._currentDepth >= J.RESOURCES.EXT.ABS.Metadata.healChainDepth) return;

    this._currentDepth++;

    try
    {
      this.#dispatchOnSelf(recipient, triggerKey, amount);
      this.#dispatchOnAlly(recipient, triggerKey, amount);
    }
    finally
    {
      // always decrement even if an error occurs mid-cascade.
      this._currentDepth--;
    }
  }

  /**
   * Converts a J.BASE.Resource string to the PascalCase suffix used in RegExp key lookups.
   * @param {string} resource One of J.BASE.Resource.HP / MP / TP.
   * @returns {string} 'Hp', 'Mp', or 'Tp'.
   */
  static #resourceToKey(resource)
  {
    if (resource === J.BASE.Resource.HP) return 'Hp';
    if (resource === J.BASE.Resource.MP) return 'Mp';
    return 'Tp';
  }

  /**
   * Reads onSelf tags from the recipient's notes and applies secondary heals.
   * Self always receives the secondary heal; allies within the tag's range also receive it.
   * @param {Game_Battler} recipient The battler whose onSelf tags are evaluated.
   * @param {string} triggerKey PascalCase trigger resource ('Hp', 'Mp', 'Tp').
   * @param {number} amount The amount that triggered this event.
   */
  static #dispatchOnSelf(recipient, triggerKey, amount)
  {
    const notes = recipient.getAllNotes();

    for (const outputKey of this.#outputKeys)
    {
      const tuples = this.#getTuples(notes, false, triggerKey, outputKey);

      for (const [percent, range] of tuples)
      {
        const secondary = Math.floor(amount * percent / 100);
        if (secondary <= 0) continue;

        // self always gets the secondary heal.
        this.#applySecondaryHeal(recipient, outputKey, secondary);

        // if range > 0, splash to allies within that tile radius too.
        if (range > 0)
        {
          const jabsBattler = JABS_AiManager.getBattlerByUuid(recipient.getUuid());

          // skip ally splash if this battler is not on the JABS map.
          if (jabsBattler === undefined) continue;

          const nearbyAllies = JABS_AiManager.getAlliedBattlersWithinRange(jabsBattler, range);

          for (const allyJabs of nearbyAllies)
          {
            const ally = allyJabs.getBattler();

            // skip the recipient itself — they already received the heal above.
            if (ally === recipient) continue;

            this.#applySecondaryHeal(ally, outputKey, secondary);
          }
        }
      }
    }
  }

  /**
   * Reads onAlly tags from all allied observers and applies secondary heals to observers
   * whose tag range includes the healed battler.
   * @param {Game_Battler} healTarget The battler that received the original heal.
   * @param {string} triggerKey PascalCase trigger resource ('Hp', 'Mp', 'Tp').
   * @param {number} amount The amount that triggered this event.
   */
  static #dispatchOnAlly(healTarget, triggerKey, amount)
  {
    const jabsTarget = JABS_AiManager.getBattlerByUuid(healTarget.getUuid());

    // no JABS presence means no proximity data — skip entirely.
    if (jabsTarget === undefined) return;

    const alliedBattlers = JABS_AiManager.getAlliedBattlers(jabsTarget);

    for (const observerJabs of alliedBattlers)
    {
      const observer = observerJabs.getBattler();

      // an observer reacting to themselves is covered by onSelf tags.
      if (observer === healTarget) continue;

      // measure distance once for all tag checks on this observer.
      const distance = jabsTarget.distanceToDesignatedTarget(observerJabs);

      const notes = observer.getAllNotes();

      for (const outputKey of this.#outputKeys)
      {
        const tuples = this.#getTuples(notes, true, triggerKey, outputKey);

        for (const [percent, range] of tuples)
        {
          // the observer only reacts if the healed ally is within the tag's range.
          if (distance > range) continue;

          const secondary = Math.floor(amount * percent / 100);
          if (secondary <= 0) continue;

          this.#applySecondaryHeal(observer, outputKey, secondary);
        }
      }
    }
  }

  /**
   * Routes a secondary heal to the appropriate gain method on the battler.
   * Fires onHeal again, allowing cascades to propagate naturally up to the depth cap.
   * @param {Game_Battler} battler The battler receiving the secondary heal.
   * @param {string} outputKey PascalCase output resource ('Hp', 'Mp', 'Tp').
   * @param {number} amount The positive amount to recover.
   */
  static #applySecondaryHeal(battler, outputKey, amount)
  {
    if (outputKey === 'Hp') battler.gainHpFromResource(amount);
    else if (outputKey === 'Mp') battler.gainMpFromResource(amount);
    else battler.gainTpFromResource(amount);
  }

  /**
   * Collects all [percent, range] tuples from notes for a given family/trigger/output combination.
   * Checks both the specific trigger regexp and the "Any" trigger variant.
   * @param {RPG_BaseItem[]} notes The array of database objects to scan.
   * @param {boolean} isAlly True when looking for onAlly tags; false for onSelf tags.
   * @param {string} triggerKey PascalCase trigger resource ('Hp', 'Mp', 'Tp').
   * @param {string} outputKey PascalCase output resource ('Hp', 'Mp', 'Tp').
   * @returns {Array<[number, number]>} Array of [percent, range] pairs.
   */
  static #getTuples(notes, isAlly, triggerKey, outputKey)
  {
    const family = isAlly ? 'Ally' : 'Self';
    const specificKey = `On${family}${triggerKey}Heal${outputKey}`;
    const anyKey = `On${family}AnyHeal${outputKey}`;

    const specificRegexp = J.RESOURCES.EXT.ABS.RegExp[specificKey];
    const anyRegexp = J.RESOURCES.EXT.ABS.RegExp[anyKey];

    const tuples = [];

    for (const databaseData of notes)
    {
      // collect tuples from the specific trigger regexp.
      if (specificRegexp)
      {
        const results = RPGManager.getArraysFromNotesByRegex(databaseData, specificRegexp);

        for (const result of results)
        {
          if (Array.isArray(result) && result.length === 2) tuples.push([Number(result[0]), Number(result[1])]);
        }
      }

      // also collect tuples from the Any variant — it fires on any trigger resource.
      if (anyRegexp)
      {
        const results = RPGManager.getArraysFromNotesByRegex(databaseData, anyRegexp);

        for (const result of results)
        {
          if (Array.isArray(result) && result.length === 2) tuples.push([Number(result[0]), Number(result[1])]);
        }
      }
    }

    return tuples;
  }
}
//endregion HealEventManager

export default HealEventManager;