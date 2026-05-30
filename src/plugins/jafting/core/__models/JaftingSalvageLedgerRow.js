//region JaftingSalvageLedgerRow
/**
 * One stamped ingredient line (`t` + `id` + `n`, optional dismantle ban).<br>
 * `t` mirrors dismantle routing (`i` / `w` / `a`, gold letter, SDP letter, etc.)—see
 * {@link JaftingSalvageManager.refundLedgerRows}.
 */
class JaftingSalvageLedgerRow
{
  /**
   * @param {string} t Ledger type letter (`i`, `w`, `a`, gold, SDP, etc.).
   * @param {number} id Database id (or 0 for non-db rows such as gold).
   * @param {number} n Quantity credited when dismantling **one** stamped unit.
   * @param {boolean=} banned When true, dismantle skips this row.
   */
  constructor(t, id, n, banned)
  {
    this.t = t;
    this.id = id;
    this.n = n;

    // when banned  equals  true, take this branch.
    if (banned === true)
    {
      this.banned = true;
    }
  }

  /**
   * Normalizes save data or hand-built literals into a row instance.
   *
   * @param {JaftingSalvageLedgerRow|{ t: string, id: number, n: number, banned?: boolean }} row
   * @returns {JaftingSalvageLedgerRow}
   */
  static coerce(row)
  {
    if (row instanceof JaftingSalvageLedgerRow)
    {
      return row;
    }

    // hand back new JaftingSalvageLedgerRow(row.t, row.id, row.n, row... to the caller.
    return new JaftingSalvageLedgerRow(row.t, row.id, row.n, row.banned === true);
  }

  /**
   * Deep-copies this row so merges never share mutable references.
   *
   * @returns {JaftingSalvageLedgerRow}
   */
  clone()
  {
    return new JaftingSalvageLedgerRow(this.t, this.id, this.n, this.banned === true);
  }
}

export default JaftingSalvageLedgerRow;
//endregion JaftingSalvageLedgerRow