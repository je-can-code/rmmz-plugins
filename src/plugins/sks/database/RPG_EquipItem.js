//region RPG_EquipItem
/**
 * The modifier to the slot cost of all equipped skills for the owner of this item.
 */
Object.defineProperty(RPG_EquipItem.prototype, 'slotCostModifier', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.SKS.RegExp.SlotCostModifier);
  }
});
//endregion RPG_EquipItem
