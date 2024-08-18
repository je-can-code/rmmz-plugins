//region OmniTag
/**
 * A class representing the data shape of a single tag a quest can be associated with.
 */
class OmniTag
{
  /**
   * The primary key of the tag. This is a unique representation used for accessing the tag data.
   * @type {string}
   */
  key = String.empty;

  /**
   * The name of the tag.
   * @type {string}
   */
  name = String.empty;

  /**
   * The description of the tag.
   * @type {string}
   */
  description = String.empty;

  /**
   * The icon index for the tag.
   * @type {number}
   */
  iconIndex = 0;

  /**
   * Constructor.
   * @param {string} key The key of the category.
   * @param {string} name The name of the category.
   * @param {number} iconIndex The icon index of the category.
   */
  constructor(key, name, iconIndex)
  {
    this.key = key;
    this.name = name;
    this.iconIndex = iconIndex;
  }
}
//endregion OmniTag