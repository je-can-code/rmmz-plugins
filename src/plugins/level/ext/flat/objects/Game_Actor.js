//region Game_Actor
/**
 * Overrides {@link #expForLevel}.<br/>
 * Uses the flat-experience formula.
 * @param {number} level The level to calculate the experience for.
 * @returns {number}
 */
Game_Actor.prototype.expForLevel = function(level)
{
  // if the level is lesser than or equal to 1, then there is no experience to gain.
  if (level <= 1) return 0;

  // define the formula.
  const formula = (level - 1) * J.LEVEL.EXT.FLAT.Metadata.expPerLevel;

  // return the experience required.
  return formula;
};
//endregion Game_Actor