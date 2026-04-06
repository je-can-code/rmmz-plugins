//region RPG_Traited
/**
 * Gets the hp cost reduction for this battler.
 * @returns {number}
 */
RPG_Traited.prototype.hcr = function()
{
  return RPGManager.getResultFromNoteByRegex(this, J.RESOURCES.RegExp.HpCostReduction, 0);
};
//endregion RPG_Traited