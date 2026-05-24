//region RPG_State
/**
 * The modifier to global slot costs for skill equips.
 */
Object.defineProperty(RPG_State.prototype, 'slotCostModifier', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.SKS.RegExp.SlotCostModifier);
  }
});
//endregion RPG_State