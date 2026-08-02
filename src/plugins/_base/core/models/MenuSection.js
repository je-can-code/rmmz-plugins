//region MenuSection
/**
 * The sections a main menu command can belong to.
 *
 * The main menu is split into two columns because the scenes behind it split cleanly in two: those
 * that answer "something specific about this actor", and those that concern the party or the game as
 * a whole. Surfacing that split in the menu itself means the player learns the model by using it,
 * rather than hunting through one long undifferentiated list.
 */
class MenuSection
{
  /**
   * Commands opening a scene scoped to a single actor- status, equipment, skills, and the like.
   * These render in the left column.
   * @type {string}
   */
  static Actor = 'actor';

  /**
   * Commands opening a scene concerning the party or the game as a whole- items, crafting, options.
   * These render in the right column, and are the default for any command that never declares itself.
   * @type {string}
   */
  static Party = 'party';

  /**
   * Gets every valid section.
   * @returns {string[]}
   */
  static sections()
  {
    return [ this.Actor, this.Party ];
  }

  /**
   * Determines whether the given value names a real section.
   * @param {string} section The value to validate.
   * @returns {boolean}
   */
  static isValid(section)
  {
    return this.sections()
      .includes(section);
  }
}

export default MenuSection;
//endregion MenuSection
