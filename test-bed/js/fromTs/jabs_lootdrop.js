/**
 * An object that represents the binding of a `Game_Event` to an item/weapon/armor.
 */
var JABS_LootDrop = /** @class */ (function () {
    function JABS_LootDrop(object) {
        this._lootObject = object;
        this.initMembers();
    }
    ;
    /**
     * Initializes properties of this object that don't require parameters.
     */
    JABS_LootDrop.prototype.initMembers = function () {
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
    ;
    Object.defineProperty(JABS_LootDrop.prototype, "duration", {
        /**
         * Gets the duration remaining on this loot drop.
         * @returns {number}
         */
        get: function () {
            return this._duration;
        },
        /**
         * Sets the duration for this loot drop.
         */
        set: function (dur) {
            this._duration = dur;
        },
        enumerable: true,
        configurable: true
    });
    ;
    ;
    Object.defineProperty(JABS_LootDrop.prototype, "expired", {
        /**
         * Whether or not this loot drop's duration is expired.
         * @returns {boolean} True if this loot is expired, false otherwise.
         */
        get: function () {
            return this._duration <= 0;
        },
        enumerable: true,
        configurable: true
    });
    ;
    /**
     * Counts down the duration for this loot drop.
     */
    JABS_LootDrop.prototype.countdownDuration = function () {
        if (this._duration <= 0)
            return;
        this._duration--;
    };
    ;
    Object.defineProperty(JABS_LootDrop.prototype, "lootData", {
        /**
         * Gets the underlying loot object.
         * @returns {object}
         */
        get: function () {
            return this._lootObject;
        },
        enumerable: true,
        configurable: true
    });
    ;
    Object.defineProperty(JABS_LootDrop.prototype, "lootIcon", {
        /**
         * Gets the `iconIndex` for the underlying loot object.
         * @returns {number}
         */
        get: function () {
            return this._lootObject.iconIndex;
        },
        enumerable: true,
        configurable: true
    });
    ;
    Object.defineProperty(JABS_LootDrop.prototype, "useOnPickup", {
        /**
         * Gets whether or not this loot should be automatically consumed on pickup.
         * @returns {boolean}
         */
        get: function () {
            return this._lootObject._j.useOnPickup;
        },
        enumerable: true,
        configurable: true
    });
    return JABS_LootDrop;
}());
;
