//region RPG_EquipItem
//region skillId
/**
 * The skill id associated with this equipment.
 * This is typically found on weapons and offhand armors.
 * @type {number|null}
 */
Object.defineProperty(RPG_EquipItem.prototype, 'jabsSkillId', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.SkillId, true);
  },
});
//endregion skillId

//region offhand skillId
/**
 * The offhand skill id override from this equip.
 * @type {number}
 */
Object.defineProperty(RPG_EquipItem.prototype, 'jabsOffhandSkillId', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.OffhandSkillId, true);
  },
});
//endregion offhand skillId


//region useOnPickup
/**
 * Normally defines whether or not an item will be automatically used
 * upon being picked up, however, equipment cannot be "used".
 * @type {false}
 */
Object.defineProperty(RPG_EquipItem.prototype, 'jabsUseOnPickup', {
  get: function()
  {
    return false;
  },
});
//endregion useOnPickup

//region expiration
/**
 * The expiration time in frames for this equip drop.
 * @type {number|null}
 */
Object.defineProperty(RPG_EquipItem.prototype, 'jabsExpiration', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.Expires, true);
  },
});
//endregion expiration
//endregion RPG_EquipItem