import RPG_Base from './RPG_Base.js';

//region RPG_BaseItem
/**
 * The class representing baseItem from the database,
 * and now an iconIndex with a description.
 */
class RPG_BaseItem
  extends RPG_Base
{
  /**
   * The description of this entry.
   * @type {string}
   */
  description = String.empty;

  /**
   * The icon index of this entry.
   * @type {number}
   */
  iconIndex = 0;

  /**
   * Constructor.
   * Maps the base item's properties into this object.
   * @param {any} baseItem The underlying database object.
   * @param {number} index The index of the entry in the database.
   */
  constructor(baseItem, index)
  {
    // perform original logic.
    super(baseItem, index);

    // map the additional description and iconIndex as well for all base items.
    this.description = baseItem.description;
    this.iconIndex = baseItem.iconIndex;
  }
}

/**
 * A frozen sentinel representing an empty or unoccupied database item slot.
 * Use in place of null when a slot may have no item equipped so that callers
 * can read {@code .name}, {@code .iconIndex}, and {@code .description} without
 * null-guarding. Distinguish a real entry from this sentinel via {@code entry.id > 0}.
 * @type {Readonly<{id: number, index: number, name: string, note: string, meta: {}, description: string, iconIndex: number}>}
 */
RPG_BaseItem.Empty = Object.freeze({
  id: 0,
  index: 0,
  name: '',
  note: '',
  meta: {},
  description: '',
  iconIndex: 0,
});

export default RPG_BaseItem;
//endregion RPG_BaseItem