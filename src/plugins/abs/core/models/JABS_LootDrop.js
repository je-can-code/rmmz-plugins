//region JABS_LootDrop
/**
 * An object that represents the binding of a `Game_Event` to an item/weapon/armor.
 */
class JABS_LootDrop
{
  /**
   * The lifecycle a loot drop moves through, in order.
   *
   * The distinction that matters is {@link WHIZZING}: a drop being drawn toward somebody has
   * already been promised to them, so it stops aging out. Without that, loot could expire in
   * mid-flight and vanish an item the player had visibly already earned.
   */
  static States = {
    /**
     * Sitting on the ground, bobbing, aging toward expiration.
     */
    Waiting: 'waiting',

    /**
     * In flight toward whoever is drawing it in. Claimed, and no longer expiring.
     */
    Whizzing: 'whizzing',

    /**
     * Arrived and granted. Awaiting removal from the map.
     */
    Collected: 'collected',
  };

  /**
   * The distance in tiles at which a drop counts as having arrived and can be absorbed.
   *
   * This is not a reach stat- the magnet radius is what decides how far loot is collected from.
   * This is only the "close enough to land" threshold, kept small so a drop is visibly on top of
   * its collector before disappearing.
   * @returns {number}
   */
  static arrivalDistance()
  {
    return 0.5;
  }

  //region properties
  /**
   * Sets the can expire.
   * @param {boolean} newCanExpire The new canExpire.
   */
  setCanExpire(newCanExpire)
  {
    // assign the can expire.
    this._canExpire = newCanExpire;
  }

  /**
   * Sets the duration.
   * @param {number} newDuration The new duration.
   */
  //endregion properties

  /**
   * The duration that this loot drop will exist on the map.
   * @type {number}
   */

  _duration = 900;

  /**
   * Whether or not this loot drop can expire.
   * @type {boolean}
   */
  _canExpire = true;

  /**
   * The universally unique identifier for this loot drop.
   * @type {string}
   */
  _uuid = J.BASE.Helpers.shortUuid();

  /**
   * The underlying database object for the item or equip loot.
   * Is null while unassigned.
   * @type {RPG_EquipItem|RPG_Item|null}
   */
  _lootObject = null;

  /**
   * Where this drop currently sits in its lifecycle.
   * @type {string}
   */
  _state = JABS_LootDrop.States.Waiting;

  constructor(object)
  {
    this.setLootObject(object);
  }

  /**
   * Gets the `uuid` of this loot drop.
   * @returns {string}
   */
  uuid()
  {
    return this._uuid;
  }

  /**
   * Sets the `uuid` to the new value.
   * This overwrites the default-generated `uuid`.
   * @param {string} newUuid The new `uuid`.
   */
  setUuid(newUuid)
  {
    this._uuid = newUuid;
  }

  /**
   * Gets the duration remaining on this loot drop.
   * @returns {number}
   */
  duration()
  {
    return this._duration;
  }

  /**
   * Sets the duration for this loot drop.
   */
  setDuration(newDuration)
  {
    // -1 is the magic duration means this loot stays forever.
    if (newDuration === -1)
    {
      // disable this loot's expire functionality.
      this.disableExpiration();
    }

    // update the duration.
    this._duration = newDuration;
  }

  /**
   * Whether or not this loot drop's duration is expired.
   * If the loot cannot expire, this will always return false, regardless of duration.
   * @returns {boolean}
   */
  isExpired()
  {
    // if this loot cannot expire, then it is never expired.
    if (!this.canExpire()) return false;

    // return whether or not the duration has expired.
    return this.duration() <= 0;
  }

  /**
   * Set the underlying loot drop.
   * @param {RPG_EquipItem|RPG_Item|null} newLootObject The loot that this drop represents.
   */
  setLootObject(newLootObject)
  {
    this._lootObject = newLootObject;
  }

  canExpire()
  {
    return this._canExpire;
  }

  enableExpiration()
  {
    this.setCanExpire(true);
  }

  disableExpiration()
  {
    this.setCanExpire(false);
  }

  /**
   * Gets the current lifecycle state of this loot drop.
   * @returns {string}
   */
  state()
  {
    return this._state;
  }

  /**
   * Sets the current lifecycle state of this loot drop.
   * @param {string} newState The new state, from {@link JABS_LootDrop.States}.
   */
  setState(newState)
  {
    this._state = newState;
  }

  /**
   * Whether or not this drop is still sitting on the ground unclaimed.
   * @returns {boolean}
   */
  isWaiting()
  {
    return this.state() === JABS_LootDrop.States.Waiting;
  }

  /**
   * Whether or not this drop is currently in flight toward whoever claimed it.
   * @returns {boolean}
   */
  isWhizzing()
  {
    return this.state() === JABS_LootDrop.States.Whizzing;
  }

  /**
   * Whether or not this drop has arrived and been granted.
   * @returns {boolean}
   */
  isCollected()
  {
    return this.state() === JABS_LootDrop.States.Collected;
  }

  /**
   * Claims this drop for whoever is drawing it in, starting its flight.
   */
  beginWhizzing()
  {
    this.setState(JABS_LootDrop.States.Whizzing);
  }

  /**
   * Marks this drop as arrived and granted, leaving only its removal outstanding.
   */
  markCollected()
  {
    this.setState(JABS_LootDrop.States.Collected);
  }

  /**
   * Counts down the duration for this loot drop.
   */
  countdownDuration()
  {
    if (!this.canCountdownDuration()) return;

    this.setDuration(this.duration() - 1);
  }

  /**
   * Determines whether or not this loot should countdown the duration.
   * @returns {boolean} True if the loot should countdown, false otherwise.
   */
  canCountdownDuration()
  {
    // if already expired, do not countdown.
    if (!this.canExpire()) return false;

    // a drop already claimed by somebody is spoken for; letting it age out mid-flight would
    // delete an item the player has already watched themselves earn.
    if (!this.isWaiting()) return false;

    // do not continue counting if duration has expired.
    if (this.duration() <= 0) return false;

    // countdown the duration!
    return true;
  }

  /**
   * Gets the underlying loot object.
   * @returns {RPG_BaseItem}
   */
  lootData()
  {
    return this._lootObject;
  }

  /**
   * Gets the `iconIndex` for the underlying loot object.
   * @returns {number}
   */
  lootIcon()
  {
    return this.lootData().iconIndex ?? 0;
  }

  /**
   * Gets whether or not this loot should be automatically consumed on pickup.
   * @returns {boolean}
   */
  isUseOnPickup()
  {
    return this.lootData().jabsUseOnPickup ?? false;
  }
}

export default JABS_LootDrop;
//endregion JABS_LootDrop