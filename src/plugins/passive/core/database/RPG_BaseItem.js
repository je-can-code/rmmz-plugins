//region RPG_BaseItem
//region passive state ids
/**
 * The passive state ids that this item possesses.
 * @type {number[]}
 */
Object.defineProperty(RPG_BaseItem.prototype, "passiveStateIds", {
  get: function()
  {
    return RPGManager.getNumbersFromNoteByRegex(this, J.PASSIVE.RegExp.PassiveStateIds);
  },
});
//endregion passive state ids

//region unique passive state ids
/**
 * The non-duplicative passive state ids that this item possesses.
 * @type {number[]}
 */
Object.defineProperty(RPG_BaseItem.prototype, "uniquePassiveStateIds", {
  get: function()
  {
    return RPGManager.getNumbersFromNoteByRegex(this, J.PASSIVE.RegExp.UniquePassiveStateIds);
  },
});
//endregion unique passive state ids

//region equipped passive state ids
/**
 * The passive state ids that this equipment will apply while this equip is equipped.
 * @type {number[]}
 */
Object.defineProperty(RPG_BaseItem.prototype, "equippedPassiveStateIds", {
  get: function()
  {
    return RPGManager.getNumbersFromNoteByRegex(this, J.PASSIVE.RegExp.EquippedPassiveStateIds);
  },
});
//endregion equipped passive state ids

//region unique equipped passive state ids
/**
 * The non-duplicative passive state ids that this equipment will apply
 * while this equip is equipped.
 * @type {number[]}
 */
Object.defineProperty(RPG_BaseItem.prototype, "uniqueEquippedPassiveStateIds", {
  get: function()
  {
    return RPGManager.getNumbersFromNoteByRegex(this, J.PASSIVE.RegExp.UniqueEquippedPassiveStateIds);
  },
});
//endregion unique equipped passive state ids
//endregion RPG_BaseItem