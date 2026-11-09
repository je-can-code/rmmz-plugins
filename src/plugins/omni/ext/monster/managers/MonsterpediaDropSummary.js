//region MonsterpediaDropSummary
/**
 * Folds an enemy's drop rolls into one line per item for the monsterpedia.
 *
 * An enemy's drop list holds one entry per roll, and one item can be rolled several times, each roll
 * with a chance of its own: that is how a tree drops up to five logs. Listing every roll buries the
 * page, since the largest enemies roll sixty-odd times, so the pedia shows each item once with the
 * best chance any of its rolls has and how many times it can drop.
 */
class MonsterpediaDropSummary
{
  /**
   * One line per distinct item across the given rolls, in the order each item first appears.
   * @param {RPG_DropItem[]} drops The rolls, as the enemy's drop list holds them.
   * @returns {{drop: RPG_DropItem, bestChance: number, rolls: number}[]}
   */
  static summarize(drops)
  {
    // one line per item, keyed by kind and id together, since an item and an armor can share an id.
    const lines = new Map();

    drops.forEach(drop =>
    {
      // the identity of the item this roll is for.
      const key = `${drop.kind}-${drop.dataId}`;

      // an item's first roll opens its line.
      if (lines.has(key) === false)
      {
        lines.set(key, { drop, bestChance: drop.denominator, rolls: 1 });
        return;
      }

      // each later roll of the same item can only raise its best chance, and is one more possible drop.
      const line = lines.get(key);
      line.bestChance = Math.max(line.bestChance, drop.denominator);
      line.rolls += 1;
    });

    // the lines, still in the order their items first appeared.
    return Array.from(lines.values());
  }

  /**
   * The value shown beside an item in the drop list: its best chance, and how many times it can drop
   * when that is more than once.<br/>
   * The value is kept as short as it can be read, since every character it takes is one the item's
   * name beside it cannot.
   * @param {number} bestChance The best chance among the item's rolls, as a percent.
   * @param {number} rolls How many times the item is rolled, and so the most it can drop.
   * @returns {string}
   */
  static lineText(bestChance, rolls)
  {
    // an item rolled once is simply its chance.
    if (rolls === 1) return `${bestChance}%`;

    // an item rolled several times can drop up to that many times.
    return `${bestChance}% ×${rolls}`;
  }
}

export default MonsterpediaDropSummary;
//endregion MonsterpediaDropSummary