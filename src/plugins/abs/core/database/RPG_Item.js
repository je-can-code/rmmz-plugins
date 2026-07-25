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

//region jabsTool
/**
 * Whether this item is a JABS tool (hookshot, bomb, etc.) that belongs in the tool slot.<br/>
 * Tagged with {@code <jabsTool>}. Items without this tag are treated as consumables and land
 * in the usable-item slot instead.<br/>
 * Note: the tag alone is not sufficient — {@link Window_AbsMenuSelect#isItemVisibleInToolMenu}
 * also enforces itypeId===1 and occasion===0 as a safety rail, since only RPG_Item entries
 * are ever iterated for either menu list.
 * @type {boolean}
 */
Object.defineProperty(RPG_Item.prototype, "jabsTool", {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.JabsTool, true);
  },
});
//endregion jabsTool
//endregion RPG_Item