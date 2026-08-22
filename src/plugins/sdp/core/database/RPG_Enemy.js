//region RPG_Enemy
//region sdpPoints
/**
 * The number of SDP points this enemy will yield upon defeat.
 * @type {number|null}
 */
Object.defineProperty(RPG_Enemy.prototype, "sdpPoints", {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.SDP.RegExp.SdpPoints);
  },
});
//endregion sdpPoints

//region sdpDropData
/**
 * Gets the SDP drop data for this enemy.
 *
 * Panels that have already been dropped and collected will not
 * be dropped again.
 *
 * The zeroth index is the string key for the panel being dropped.
 * The first index is 1-100 percent chance for the panel to drop.
 * The second index is the numeric id of the item associated with the panel.
 * @type {[string, number, number]|null}
 */
Object.defineProperty(RPG_Enemy.prototype, "sdpDropData", {
  get: function()
  {
    // grab the data from the enemy.
    const sdpData = RPGManager.getArrayFromNotesByRegex(this, J.SDP.RegExp.SdpDropData, true);

    // return the data, or the default.
    return sdpData ?? [ String.empty, 0 ];
  },
});

/**
 * Gets the key of the panel being dropped.
 * @type {string}
 */
Object.defineProperty(RPG_Enemy.prototype, "sdpDropKey", {
  get: function()
  {
    return this.sdpDropData[0];
  },
});

/**
 * Gets the drop rate for this panel.
 * @type {number}
 */
Object.defineProperty(RPG_Enemy.prototype, "sdpDropChance", {
  get: function()
  {
    return this.sdpDropData[1];
  },
});
//endregion sdpDropData
//endregion RPG_Enemy