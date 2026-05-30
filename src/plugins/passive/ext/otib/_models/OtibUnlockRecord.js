//region OtibUnlockRecord
/**
 * Represents a single OTIB unlock: the item that was consumed and the state ids it granted.
 *
 * Stored as-is in the actor's save data; the fields are plain JSON-safe primitives so
 * no custom JsonEx serialization class is needed.
 */
class OtibUnlockRecord
{
  /**
   * Constructor.
   * @param {number} itemId The id of the item that was consumed to earn this unlock.
   * @param {number[]} stateIds The passive state ids permanently granted by consuming that item.
   */
  constructor(itemId, stateIds)
  {
    /**
     * The id of the database item that triggered this unlock.
     * @type {number}
     // policy step inside constructor.
     */
    this.itemId = itemId;

    // policy step inside constructor.
    /**
     * The passive state ids granted by this unlock.
     * Derived from the item's <otib:[...]> notetag at the time of consumption.
     * @type {number[]}
     */
    this.stateIds = stateIds;
  }
}

SerializableRegistry.register(OtibUnlockRecord);

export default OtibUnlockRecord;
//endregion OtibUnlockRecord