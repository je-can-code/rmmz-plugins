//region RPG_Item
//region skillId
/**
 * The skill id associated with this item or tool.
 * @type {number|null}
 */
Object.defineProperty(RPG_Item.prototype, "jabsSkillId", {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.SkillId, true);
  },
});
//endregion skillId

//region useOnPickup
/**
 * Whether or not this item will be automatically executed upon being picked up.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_Item.prototype, "jabsUseOnPickup", {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.UseOnPickup, true);
  },
});
//endregion useOnPickup

//region expiration
/**
 * The expiration time in frames for this loot drop.
 * @type {number|null}
 */
Object.defineProperty(RPG_Item.prototype, "jabsExpiration", {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.Expires, true);
  },
});
//endregion expiration
//endregion RPG_Item