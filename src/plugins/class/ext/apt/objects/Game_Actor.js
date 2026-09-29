//region Game_Actor
import ClassAptitudeManager from '../managers/ClassAptitudeManager.js';

/**
 * Determines whether this actor has learned everything the given class teaches.
 *
 * Here for events to ask by script- a trainer offering a class's next step checks this first, as
 * `$gameActors.actor(1).isClassMastered(2)` in a conditional branch.
 * @param {number} classId The id of the class being asked about.
 * @returns {boolean}
 */
Game_Actor.prototype.isClassMastered = function(classId)
{
  return ClassAptitudeManager.isMastered(this, classId);
};
//endregion Game_Actor