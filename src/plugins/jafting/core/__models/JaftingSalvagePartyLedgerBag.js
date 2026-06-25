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
   * Returns the bag as-is, or a fresh empty bag when the map slot is absent.
   *
   * @param {JaftingSalvagePartyLedgerBag|null|undefined} raw
   * @returns {JaftingSalvagePartyLedgerBag}
   */
  static coerce(raw)
  {
    // absent entry means no crafts have been tracked for this template yet.
    if (!raw)
    {
      return new JaftingSalvagePartyLedgerBag();
    }

    return raw;
  }
}

export default JaftingSalvagePartyLedgerBag;
//endregion JaftingSalvagePartyLedgerBag
