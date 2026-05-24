//region JaftingSalvageDataModels
import JaftingSalvageManager from './../managers/JaftingSalvageManager.js';
/**
 * Concrete JAFTING salvage ledger models (rows, per-unit snapshots, party keyed bags).<br>
 * <br>
 * **Mental model (what you are looking at in a save file):**<br>
 * - {@link JaftingSalvageLedgerRow} — one dismantle refund line (`t` + database id + `n` count,
 *   optional `banned`).<br>
 * - {@link JaftingSalvageLedgerSnapshot} — the full stamp on **one** physical unit (one craft output,
 *   one refine output, or one stack slot for a shared template id).<br>
 * - {@link JaftingSalvagePartyLedgerBag} — lives under `$gameParty._j._jafting._salvageLedgers['w:12']` style keys
 *   because vanilla stacks cannot diverge per copy inside `$dataWeapons` / `$dataArmors`.<br>
 * <br>
 * File name sorts **before** {@link JaftingSalvageLedger} so the concatenated bundle loads these constructors
 * first.<br>
 * {@link SerializableRegistry} registration lets J-Base’s patched {@link JsonEx} restore prototypes on load.
 */

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

SerializableRegistry.register(JaftingSalvageLedgerRow);

/**
 * Salvage stamp for **one** inventory unit (craft output slot, refinement output, or one stack ordinal).<br>
 * Party stacks mirror these in {@link JaftingSalvagePartyLedgerBag#unitLedgers}; dynamic refinement rows hang the same
 * shape on {@link RPG_Weapon#_jaftingSalvageLedger} and {@link RPG_Armor#_jaftingSalvageLedger}.
 */
class JaftingSalvageLedgerSnapshot
{
  /**
   * @param {JaftingSalvageLedgerRow[]|JaftingSalvageLedgerSnapshot|{ rows?: JaftingSalvageLedgerRow[] }|null|
   *   undefined} rowsSource
   */
  constructor(rowsSource)
  {
    // clone-from-snapshot, accept `{ rows }` literals from older saves/tests, or accept a bare row array.
    if (rowsSource instanceof JaftingSalvageLedgerSnapshot)
    {
      this.rows = rowsSource.rows.map(r => JaftingSalvageLedgerRow.coerce(r).clone());

      return;
    }

    if (rowsSource && Array.isArray(rowsSource.rows))
    {
      this.rows = JaftingSalvageLedgerSnapshot.coerceRows(rowsSource.rows);

      return;
    }

    if (Array.isArray(rowsSource))
    {
      this.rows = JaftingSalvageLedgerSnapshot.coerceRows(rowsSource);

      return;
    }

    this.rows = [];
  }

  /**
   * Normalizes every entry to {@link JaftingSalvageLedgerRow} (handles post-load plain objects).
   *
   * @param {unknown[]} rows
   * @returns {JaftingSalvageLedgerRow[]}
   */
  static coerceRows(rows)
  {
    if (Array.isArray(rows) === false)
    {
      return [];
    }

    const out = [];

    for (let i = 0; i < rows.length; i++)
    {
      out.push(JaftingSalvageLedgerRow.coerce(rows[i]));
    }

    return out;
  }

  /**
   * Reads `.rows` from a snapshot instance or a duck-typed interim object.
   *
   * @param {JaftingSalvageLedgerSnapshot|{ rows?: unknown[] }|null|undefined} ledger
   * @returns {JaftingSalvageLedgerRow[]}
   */
  static rowsFromUnknown(ledger)
  {
    if (!ledger || !ledger.rows)
    {
      return [];
    }

    return JaftingSalvageLedgerSnapshot.coerceRows(ledger.rows);
  }

  /**
   * Clones every row into a fresh snapshot (used when stamping multiple outputs from the same recipe shell).
   *
   * @param {JaftingSalvageLedgerSnapshot|{ rows?: JaftingSalvageLedgerRow[] }} ledger
   * @returns {JaftingSalvageLedgerSnapshot}
   */
  static cloneFromLedgerLike(ledger)
  {
    const rows = JaftingSalvageLedgerSnapshot.rowsFromUnknown(ledger);
    const clones = [];

    for (let i = 0; i < rows.length; i++)
    {
      clones.push(rows[i].clone());
    }

    return new JaftingSalvageLedgerSnapshot(clones);
  }
}

SerializableRegistry.register(JaftingSalvageLedgerSnapshot);

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
   * @param {JaftingSalvagePartyLedgerBag} bag
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

SerializableRegistry.register(JaftingSalvagePartyLedgerBag);

export {
  JaftingSalvageLedgerRow,
  JaftingSalvageLedgerSnapshot,
  JaftingSalvagePartyLedgerBag,
};

export default JaftingSalvageLedgerRow;
//endregion JaftingSalvageDataModels