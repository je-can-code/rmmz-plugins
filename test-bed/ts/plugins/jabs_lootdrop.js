/**
 * An object that represents the binding of a `Game_Event` to an item/weapon/armor.
 */
 class JABS_LootDrop {
  constructor(object) {
    this._lootObject = object;
    this.initMembers();
  };

  /**
   * Initializes properties of this object that don't require parameters.
   */
  initMembers() {
    /**
     * The duration that this loot drop will exist on the map.
     * @type {number}
     */
    this._duration = 900;

    /**
     * The universally unique identifier for this loot drop.
     * @type {string}
     */
    this._uuid = J.Base.Helpers.generateUuid();
  };

  /**
   * Gets the duration remaining on this loot drop.
   * @returns {number}
   */
  get duration() {
    return this._duration;
  };

  /**
   * Sets the duration for this loot drop.
   */
  set duration(dur) {
    this._duration = dur;
  };

  /**
   * Whether or not this loot drop's duration is expired.
   * @returns {boolean} True if this loot is expired, false otherwise.
   */
  get expired() {
    return this._duration <= 0;
  };

  /**
   * Counts down the duration for this loot drop.
   */
  countdownDuration() {
    if (this._duration <= 0) return;

    this._duration--;
  };

  /**
   * Gets the underlying loot object.
   * @returns {object}
   */
  get lootData() {
    return this._lootObject;
  };

  /**
   * Gets the `iconIndex` for the underlying loot object.
   * @returns {number}
   */
  get lootIcon() {
    return this._lootObject.iconIndex;
  };

  /**
   * Gets whether or not this loot should be automatically consumed on pickup.
   * @returns {boolean}
   */
  get useOnPickup() {
    return this._lootObject._j.useOnPickup;
  }
};