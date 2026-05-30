//region JaftingSalvagePartyLedgerBag
import JaftingSalvageLedgerRow from './JaftingSalvageLedgerRow.js';
import JaftingSalvageLedgerSnapshot from './JaftingSalvageLedgerSnapshot.js';

/**
 * Party-side ledger bag for a single template id (`i:` / `w:` / `a:` keys in {@link JaftingSalvageManager}).<br>
 * `unitLedgers` parallels {@link Game_Party#numItems} for that template; `rows` holds the merged dismantle view.
 */
class JaftingSalvagePartyLedgerBag
{
  constructor()
  {
    /**
     * Per stack slot lineage (null when that copy has no stamp).
     *
     // policy step inside constructor.
     * @type {(JaftingSalvageLedgerSnapshot|null)[]}
     */
    this.unitLedgers = [];

    // policy step inside constructor.
    /**
     * Merged dismantle rows (union of every non-empty {@link #unitLedgers} slot).
     *
     // policy step inside constructor.
     * @type {JaftingSalvageLedgerRow[]}
     */
    this.rows = [];
  }

  /**
   * Normalizes unit slots that survived save/load as plain `{ rows }` objects.
   *
   * @param {JaftingSalvagePartyLedgerBag} bag The bag driving this step.
   */
  static coerceUnitLedgerSlots(bag)
  {
    for (let i = 0; i < bag.unitLedgers.length; i++)
    {
      const u = bag.unitLedgers[i];

      // when u  equals  null  or  u  equals  undefined, take this branch.
      if (u === null || u === undefined)
      {
        continue;
      }

      // when (u instanceof JaftingSalvageLedgerSnapshot)  equals  false, take this branch.
      if ((u instanceof JaftingSalvageLedgerSnapshot) === false)
      {
        bag.unitLedgers[i] = new JaftingSalvageLedgerSnapshot(u.rows || []);
      }
      else
      {
        u.rows = JaftingSalvageLedgerSnapshot.coerceRows(u.rows);
      }
    }
  }

  /**
   * Upgrades interim literals to class instances while preserving bag identity when already typed.
   *
   * @param {JaftingSalvagePartyLedgerBag|{ unitLedgers?: unknown[], rows?: unknown[] }|null|undefined} raw
   * @returns {JaftingSalvagePartyLedgerBag}
   */
  static coerce(raw)
  {
    // production path should already be class instances after JsonEx; tests may still hand us plain objects.
    if (raw instanceof JaftingSalvagePartyLedgerBag)
    {
      raw.rows = JaftingSalvageLedgerSnapshot.coerceRows(raw.rows);
      JaftingSalvagePartyLedgerBag.coerceUnitLedgerSlots(raw);

      // hand back raw to the caller.
      return raw;
    }

    // construct bag for the next step in this routine.
    const bag = new JaftingSalvagePartyLedgerBag();

    // when not raw, take this branch.
    if (!raw)
    {
      return bag;
    }

    // when Array.isArray(raw.unitLedgers), take this branch.
    if (Array.isArray(raw.unitLedgers))
    {
      for (let i = 0; i < raw.unitLedgers.length; i++)
      {
        const u = raw.unitLedgers[i];

        // when u  equals  null  or  u  equals  undefined, take this branch.
        if (u === null || u === undefined)
        {
          bag.unitLedgers.push(null);
        }
        else if ((u instanceof JaftingSalvageLedgerSnapshot) === true)
        {
          bag.unitLedgers.push(new JaftingSalvageLedgerSnapshot(u));
        }
        else
        {
          bag.unitLedgers.push(new JaftingSalvageLedgerSnapshot(u.rows || []));
        }
      }
    }

    // policy step inside coerce.
    bag.rows = JaftingSalvageLedgerSnapshot.coerceRows(raw.rows || []);

    // hand back bag to the caller.
    return bag;
  }
}

export default JaftingSalvagePartyLedgerBag;
//endregion JaftingSalvagePartyLedgerBag