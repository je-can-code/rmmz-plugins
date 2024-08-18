//region OmniCategory
/**
 * A class representing the data shape of a single category a quest can belong to.
 */
class OmniCategory
{
  /**
   * The primary key of the category. This is a unique representation used for accessing the category data.
   * @type {string}
   */
  key = String.empty;

  /**
   * The name of the category.
   * @type {string}
   */
  name = String.empty;

  /**
   * The icon index for the category.
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
//endregion OmniCategory