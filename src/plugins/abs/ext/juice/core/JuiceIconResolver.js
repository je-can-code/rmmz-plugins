//region JuiceIconResolver
/**
 * Works out which IconSet cell a plugin command is talking about.
 *
 * An event author thinks in "the amulet" rather than "cell 195", and the database already knows
 * which icon the amulet uses. Naming the row is also the only version of this that survives editing
 * the icon later — a raw index typed into a command in chapter two keeps pointing at whatever moves
 * into that cell afterwards.
 *
 * The raw index is still offered, because an icon that belongs to no row at all is a real thing to
 * want and there is nowhere else to say it.
 *
 * This is the one place in the ship that treats database ids as untrusted, and deliberately: every
 * other id in the codebase comes from a notetag the JMZ editor wrote, while these are typed by hand
 * into a command dialog and land in a cutscene that may not be played for another six months.
 */
class JuiceIconResolver
{
  /**
   * An item from `$dataItems`.
   * @type {string}
   */
  static ITEM = 'Item';

  /**
   * A weapon from `$dataWeapons`.
   * @type {string}
   */
  static WEAPON = 'Weapon';

  /**
   * An armor from `$dataArmors`.
   * @type {string}
   */
  static ARMOR = 'Armor';

  /**
   * A skill from `$dataSkills`.
   * @type {string}
   */
  static SKILL = 'Skill';

  /**
   * The IconSet cell index, given directly.
   * @type {string}
   */
  static ICON_INDEX = 'Icon Index';

  /**
   * Resolves a command's icon choice into an IconSet cell.
   * @param {string} source Which kind of thing names the icon.
   * @param {number} id The database id, or the cell index when the source is the index itself.
   * @returns {number} The IconSet cell, or `0` when the choice does not name one.
   */
  static resolve(source, id)
  {
    if (source === JuiceIconResolver.ICON_INDEX) return id;

    const table = JuiceIconResolver.tableFor(source);

    // the command named a kind of thing this resolver does not know, which only happens when a
    // command's arguments have been edited outside the editor that offers the list.
    if (table === null)
    {
      Diagnostics.warn(__PLUGIN_NAME__, `unknown icon source: [ ${source} ]`, { source, id });

      return 0;
    }

    const entry = table.at(id);

    // the row was deleted, or the id was a typo. either way there is no icon behind it, and a
    // blank one on screen is a far kinder answer than the crash that reading it would produce.
    if (!entry)
    {
      Diagnostics.warn(__PLUGIN_NAME__, `no ${source} exists with id: [ ${id} ]`, { source, id });

      return 0;
    }

    return entry.iconIndex;
  }

  /**
   * Gets the database table a given icon source reads from.
   * @param {string} source Which kind of thing names the icon.
   * @returns {RPG_BaseItem[]|null} The table, or null when the source names none.
   */
  static tableFor(source)
  {
    switch (source)
    {
      case JuiceIconResolver.ITEM:
        return $dataItems;
      case JuiceIconResolver.WEAPON:
        return $dataWeapons;
      case JuiceIconResolver.ARMOR:
        return $dataArmors;
      case JuiceIconResolver.SKILL:
        return $dataSkills;
      default:
        return null;
    }
  }
}

export default JuiceIconResolver;
//endregion JuiceIconResolver