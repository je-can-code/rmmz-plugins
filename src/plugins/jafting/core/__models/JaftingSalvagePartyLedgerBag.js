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
     * @type {(JaftingSalvageLedgerSnapshot|null)[]}
     */
    this.unitLedgers = [];

    /**
     * Merged dismantle rows (union of every non-empty {@link #unitLedgers} slot).
     *
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

      if (u === null || u === undefined)
      {
        continue;
      }

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

      return raw;
    }

    // construct bag for the next step in this routine.
    const bag = new JaftingSalvagePartyLedgerBag();

    if (!raw)
    {
      return bag;
    }

    if (Array.isArray(raw.unitLedgers))
    {
      for (let i = 0; i < raw.unitLedgers.length; i++)
      {
        const u = raw.unitLedgers[i];

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

    bag.rows = JaftingSalvageLedgerSnapshot.coerceRows(raw.rows || []);

    return bag;
  }
}

export default JaftingSalvagePartyLedgerBag;
//endregion JaftingSalvagePartyLedgerBag