//region RPG_Skill
/**
 * The charge tier data associated with a skill.
 * @type {[number, number, number, number][]|null}
 */
Object.defineProperty(RPG_Skill.prototype, "jabsChargeData", {
  get: function()
  {
    return RPGManager.getArraysFromNotesByRegex(this, J.ABS.EXT.CHARGE.RegExp.ChargeData, true);
  },
});
//endregion RPG_Skill