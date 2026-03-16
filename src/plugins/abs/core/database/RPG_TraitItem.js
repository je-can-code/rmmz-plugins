//region RPG_Traited
//region bonusHits
/**
 * A new property for retrieving the JABS bonusHits from this traited item.
 * @type {number}
 */
Object.defineProperty(RPG_Traited.prototype, "jabsBonusHits", {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.BonusHits, true);
  },
});
//endregion bonusHits
//endregion RPG_Traited