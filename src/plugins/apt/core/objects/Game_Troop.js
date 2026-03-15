//region Game_Troop (APT)
/**
 * Gets the amount of AP earned from all defeated enemies in the troop.
 * @returns {number}
 */
Game_Troop.prototype.aptitudeApTotal = function()
{
  // Initialize the total to zero.
  let ap = 0;

  // Sum the AP from all dead enemies in this troop.
  this.deadMembers()
    .forEach(enemy => ap += enemy.apPoints);

  // Return the summed AP.
  return ap;
};
//endregion Game_Troop (APT)