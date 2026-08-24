//region plugin metadata
class J_DropsControlPluginMetadata extends PluginMetadata
{
  /**
   * The upgrade ladders, keyed by {@link RPG_DropItem.Types}. Each inner map points a row id at the
   * row id directly above it on its ladder.
   * @type {Map<number, Map<number, number>>}
   */
  upgradeLadders = new Map();

  /**
   * The downgrade ladders, keyed by {@link RPG_DropItem.Types}. Derived by inverting
   * {@link upgradeLadders}, never authored, so the two directions cannot disagree.
   * @type {Map<number, Map<number, number>>}
   */
  downgradeLadders = new Map();

  /**
   * Constructor.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  /**
   * The three database tables a drop can point into, paired with the drop kind that identifies each.
   *
   * Named here rather than at the boot call site so the ladder builder can be handed a fixture in a
   * test without a database, and so the drop-kind-to-table mapping lives in exactly one place.
   * @returns {({kind: number, name: string, rows: RPG_BaseItem[]})[]}
   */
  dropLadderTables()
  {
    return [
      {
        kind: RPG_DropItem.Types.Item,
        name: 'item',
        rows: $dataItems,
      },
      {
        kind: RPG_DropItem.Types.Weapon,
        name: 'weapon',
        rows: $dataWeapons,
      },
      {
        kind: RPG_DropItem.Types.Armor,
        name: 'armor',
        rows: $dataArmors,
      },
    ];
  }

  /**
   * Builds and validates every drop upgrade ladder from the database.
   *
   * Runs once at boot rather than lazily, because the point of the validation is to fail at launch
   * where a person is watching. A ladder defect discovered at kill time is a drop that quietly
   * vanishes; the same defect discovered here names the offending rows.
   * @param {({kind: number, name: string, rows: RPG_BaseItem[]})[]} tables The database tables to scan.
   */
  buildDropLadders(tables)
  {
    tables.forEach(table =>
    {
      const {
        kind,
        name,
        rows
      } = table;

      const upgrades = J_DropsControlPluginMetadata.readLadderLinks(name, rows);
      J_DropsControlPluginMetadata.assertNoLadderCycles(name, upgrades);

      this.upgradeLadders.set(kind, upgrades);
      this.downgradeLadders.set(kind, J_DropsControlPluginMetadata.invertLadder(upgrades));
    }, this);
  }

  /**
   * Reads every authored `<dropUpgradeId>` in one table into a map of row to the row above it.
   *
   * Two things are fatal here. A link naming a row the table does not contain would resolve to
   * nothing at kill time and silently delete the drop, so an unknown id fails now. Two rows naming
   * the same row above them would invert into one row with two rows beneath it, and a downgrade
   * could not choose between them- a ladder with a fork is not a ladder.
   * @param {string} name The human-readable table name, used only in error messages.
   * @param {RPG_BaseItem[]} rows The table to scan.
   * @returns {Map<number, number>}
   */
  static readLadderLinks(name, rows)
  {
    const upgrades = new Map();

    // tracks which row each promotion target was claimed by, so a second claimant can be named.
    const claimedBy = new Map();

    rows.forEach((row, id) =>
    {
      // absent tags and the null row at index zero both answer zero, which is "no link authored".
      const upgradeId = RPGManager.getNumberFromNoteByRegex(row, J.DROPS.RegExp.DropUpgradeId);
      if (upgradeId === 0) return;

      // a link into nothing would resolve to null at kill time and drop the loot on the floor.
      const target = rows.at(upgradeId);
      if (!target)
      {
        throw new Error(
          `J-DropsControl: ${name} row [${id}] has <dropUpgradeId:${upgradeId}>, `
          + `which is not a row in that table.`);
      }

      // the inverse of two rows claiming one target is one row with an ambiguous descent.
      if (claimedBy.has(upgradeId))
      {
        const otherId = claimedBy.get(upgradeId);

        throw new Error(
          `J-DropsControl: ${name} rows [${otherId}] and [${id}] both promote into [${upgradeId}], `
          + `which forks the downgrade path.`);
      }

      claimedBy.set(upgradeId, id);
      upgrades.set(id, upgradeId);
    });

    return upgrades;
  }

  /**
   * Verifies no ladder in this table loops back on itself.
   *
   * Walks from **every** linked row rather than from the roots. A closed loop has no root- every one
   * of its members has something pointing at it- so a root-first sweep would never enter one and the
   * defect would survive boot untouched.
   * @param {string} name The human-readable table name, used only in error messages.
   * @param {Map<number, number>} upgrades The ladder links for one table.
   */
  static assertNoLadderCycles(name, upgrades)
  {
    upgrades.forEach((unusedTarget, startId) =>
    {
      const visited = new Set();
      let current = startId;

      // walk upward until the chain ends or a row is met for the second time.
      while (upgrades.has(current))
      {
        if (visited.has(current))
        {
          throw new Error(
            `J-DropsControl: ${name} row [${current}] is part of a circular drop upgrade ladder.`);
        }

        visited.add(current);
        current = upgrades.get(current);
      }
    });
  }

  /**
   * Inverts one table's ladder into its downgrade direction.
   *
   * Safe to do blindly because {@link readLadderLinks} already rejected the only shape that would
   * make the inverse ambiguous.
   * @param {Map<number, number>} upgrades The ladder links for one table.
   * @returns {Map<number, number>}
   */
  static invertLadder(upgrades)
  {
    const downgrades = new Map();

    upgrades.forEach((upperId, lowerId) => downgrades.set(upperId, lowerId));

    return downgrades;
  }

  /**
   * Walks a row along its ladder by the given number of rungs.
   *
   * Positive counts climb and negative counts descend, both stopping at the end of the chain rather
   * than reporting a problem- over-promoting is a normal outcome of a generous roll, not a
   * misconfiguration. A row on no ladder is its own answer.
   * @param {number} kind The {@link RPG_DropItem.Types} of the row being walked.
   * @param {number} id The row id to start from.
   * @param {number} rungs How many rungs to travel; negative descends.
   * @returns {number} The row id arrived at.
   */
  walkDropLadder(kind, id, rungs)
  {
    const climbing = rungs > 0;
    const ladders = climbing
      ? this.upgradeLadders
      : this.downgradeLadders;
    const ladder = ladders.get(kind);

    // a table nothing authored a ladder for leaves every row where it is.
    if (!ladder) return id;

    let current = id;
    let remaining = Math.abs(rungs);

    // each hop consumes one rung; running out of ladder ends the walk early and that is fine.
    while (remaining > 0 && ladder.has(current))
    {
      current = ladder.get(current);
      remaining -= 1;
    }

    return current;
  }
}

export default J_DropsControlPluginMetadata;
//endregion plugin metadata