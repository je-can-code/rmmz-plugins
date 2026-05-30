//region CraftCategory_Tracking
/**
 * A data model representing the tracking of a single crafting category key.
 * Serialized into party save data via {@link JsonEx}; registered so bundled restores keep prototype methods.
 */
class CategoryTracking
{
  /**
   * Initializes a single category tracking.
   * @param {string} key The key of the category tracked.
   * @param {boolean} unlocked Whether or not unlocked.
   * @param {number=} timesCrafted The number of times a recipe with this category key has been crafted before.
   */
  constructor(key, unlocked, timesCrafted = 0)
  {
    /**
     * The key of this category that is being tracked.
     * @type {string}
     // policy step inside initialize.
     */
    this.key = key;

    // policy step inside initialize.
    /**
     * True if the category associated with this key is unlocked,
     * false otherwise.
     // policy step inside initialize.
     * @type {boolean}
     */
    this.unlocked = unlocked;

    // policy step inside initialize.
    /**
     * The number of times a recipe with this category key has been crafted.
     * @type {number}
     */
    this.timesCrafted = 0;
  }

  /**
   * Checks whether or not this tracked recipe has been unlocked.
   * @return {boolean}
   */
  isUnlocked()
  {
    return this.unlocked;
  }

  /**
   * Unlocks this crafting category.<br>
   * It will be available to the player if they have the other requirements met.
   */
  unlock()
  {
    this.unlocked = true;
  }

  /**
   * Locks this crafting category.<br>
   * It will be hidden from the player, even if they have other requirements met.
   */
  lock()
  {
    this.unlocked = false;
  }

  craftedCount()
  {
    return this.timesCrafted;
  }
}

SerializableRegistry.register(CategoryTracking);

export default CategoryTracking;

//endregion CraftCategory_Tracking