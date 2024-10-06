//region Game_Actor
/**
 * Gets this actor's bonus drop multiplier.
 * @returns {number}
 */
Game_Actor.prototype.getDropMultiplierBonus = function()
{
  // define the base multiplier.
  let baseMultiplier = 0;

  // grab all the notes.
  const objectsToCheck = this.getAllNotes();

  // get the multiplier from anything this battler has available.
  const multiplierBonus = RPGManager.getSumFromAllNotesByRegex(objectsToCheck, J.DROPS.RegExp.DropMultiplier);

  // calculate the multiplier factor.
  const factor = (multiplierBonus + baseMultiplier) / 100;

  // return the factor.
  return factor;
};

/**
 * Gets this actor's bonus gold multiplier.
 * @returns {number}
 */
Game_Actor.prototype.getGoldMultiplier = function()
{
  // define the base multiplier.
  let baseMultiplier = 0;

  // grab all the notes.
  const objectsToCheck = this.getAllNotes();

  // get the multiplier from anything this battler has available.
  const multiplierBonus = RPGManager.getSumFromAllNotesByRegex(objectsToCheck, J.DROPS.RegExp.GoldMultiplier);

  // calculate the multiplier factor.
  const factor = (multiplierBonus + baseMultiplier) / 100;

  // return the factor.
  return factor;
};
//endregion Game_Actor