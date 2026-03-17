//region RPG_Class
//region bonusHits
/**
 * The number of additional bonus hits this battler adds to their basic attacks.
 * @type {number}
 */
Object.defineProperty(RPG_Class.prototype, "jabsBonusHits", {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.BonusHits, true);
  },
});
//endregion bonusHits
//endregion RPG_Class