//region MonsterpediaTypes
/**
 * Which enemies the monsterpedia lists, and on which of its pages.
 *
 * The monsterpedia is one scene with several pages, each listing one kind of entry: ordinary enemies,
 * destructibles, or whatever else the omnipedia's configuration authors. An enemy names its kind with
 * `<monsterType:KEY>`, and every rule about whether a row shows up at all lives here rather than in the
 * list window that draws the result.
 */
class MonsterpediaTypes
{
  /**
   * The kind every enemy is unless its row says otherwise.
   * @type {string}
   */
  static DEFAULT_KEY = 'enemy';

  /**
   * The pages the monsterpedia flips between, in the order L2/R2 walks them.<br/>
   * A kind already carries a key, a name and an icon, which is exactly what a ring position is.
   * @returns {{key: string, name: string, iconIndex: number, showsStats: boolean}[]}
   */
  static positions()
  {
    return J.OMNI.EXT.MONSTER.Metadata.monsterTypes;
  }

  /**
   * Whether an entry's detail shows its stats: its level, its resources and its parameters.<br/>
   * The page listing the entry decides, for every entry it lists. Enemies are read largely for their
   * stats, while a crate's or a tree's would only be noise beside what it drops and what breaks it.
   * @param {RPG_Enemy} enemy The database row, which is listed on one of the configured pages.
   * @returns {boolean}
   */
  static showsStatsFor(enemy)
  {
    // the page listing this entry's kind.
    const page = this.positions()
      .find(position => position.key === enemy.monsterType);

    // that page decides for everything it lists.
    return page.showsStats;
  }

  /**
   * Whether a database row belongs on the page listing the given kind.<br/>
   * Some rows are never entries on any page: the empty slot the database array opens with, a row with
   * no name, a row hidden by `<hideFromMonsterpedia>`, and a `===` placeholder awaiting an enemy.
   * @param {RPG_Enemy|null} enemy The database row; null for the array's opening slot.
   * @param {string} typeKey The kind of entry the page lists.
   * @returns {boolean}
   */
  static isListed(enemy, typeKey)
  {
    // the database array's opening slot holds nothing.
    if (enemy === null) return false;

    // a row with no name is not a monster anyone authored.
    if (enemy.name === String.empty) return false;

    // a row explicitly hidden is never listed, on any page.
    if (enemy.hideFromMonsterpedia === true) return false;

    // a row named with a leading "===" is a placeholder awaiting an enemy.
    if (enemy.name.startsWith('===') === true) return false;

    // every other row belongs on whichever page lists its kind.
    return enemy.monsterType === typeKey;
  }

  /**
   * Every database row listed on the page of the given kind, in database order.
   * @param {string} typeKey The kind of entry the page lists.
   * @returns {RPG_Enemy[]}
   */
  static entriesFor(typeKey)
  {
    return $dataEnemies.filter(enemy => this.isListed(enemy, typeKey));
  }
}

export default MonsterpediaTypes;
//endregion MonsterpediaTypes