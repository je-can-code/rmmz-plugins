//region JABS_StateExpireData
/**
 * Represents the natural-expiry chain data attached to a JABS state.
 * Returned by {@link RPG_State#jabsApplyStateOnExpire} when the state database entry
 * carries the {@code <applyStateOnExpire:[STATE_ID, CHANCE]>} notetag.
 *
 * Instances are read-only after construction; callers should treat them as value objects.
 */
class JABS_StateExpireData
{
  /**
   * The database id of the state to apply when the parent state expires naturally.
   * @type {number}
   */
  stateId = 0;

  /**
   * The integer percent chance (0–100) that the follow-up state fires on expiry.
   * A value of 100 means the follow-up always fires; 0 means it never fires.
   * @type {number}
   */
  chance = 0;

  /**
   * Constructor.
   * @param {number} stateId The database id of the follow-up state.
   * @param {number} chance The percent chance (0–100) the follow-up fires on natural expiry.
   */
  constructor(stateId, chance)
  {
    this.stateId = stateId;
    this.chance = chance;
  }
}

export default JABS_StateExpireData;
//endregion JABS_StateExpireData