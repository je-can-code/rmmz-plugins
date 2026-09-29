//region Game_Actor
import ClassManager from '../managers/ClassManager.js';

/**
 * Extends {@link #initMembers}.<br/>
 * Also initializes the class members.
 */
J.CLASS.Aliased.Game_Actor.set('initMembers', Game_Actor.prototype.initMembers);
Game_Actor.prototype.initMembers = function()
{
  // perform original logic.
  J.CLASS.Aliased.Game_Actor.get('initMembers')
    .call(this);

  // also initialize the class members.
  this.initClassMembers();
};

/**
 * Initializes the members this plugin keeps on every actor.
 */
Game_Actor.prototype.initClassMembers = function()
{
  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with this plugin.
   */
  this._j._class ||= {};

  /**
   * The ids of every class this actor has unlocked, in the order they were unlocked.
   *
   * The class an actor is standing in is deliberately not recorded here just for being worn. It is always
   * listed by virtue of being current, and recording it would make leaving a class look like having
   * unlocked it- the class every actor starts the game in would stay selectable forever.
   * @type {number[]}
   */
  this._j._class._unlockedClassIds = [];
};

/**
 * Gets the ids of every class this actor has unlocked.
 * @returns {number[]}
 */
Game_Actor.prototype.unlockedClassIds = function()
{
  return this._j._class._unlockedClassIds;
};

/**
 * Sets the ids of every class this actor has unlocked.
 * @param {number[]} classIds The unlocked class ids.
 */
Game_Actor.prototype.setUnlockedClassIds = function(classIds)
{
  this._j._class._unlockedClassIds = classIds;
};

/**
 * Determines whether this actor has unlocked the given class.
 * @param {number} classId The id of the class to check.
 * @returns {boolean}
 */
Game_Actor.prototype.isClassUnlocked = function(classId)
{
  return this.unlockedClassIds()
    .includes(classId);
};

/**
 * Unlocks the given class for this actor, making it selectable in the class scene.
 *
 * Unlocking a class twice changes nothing, which is what lets an event repeat an unlock safely. A class set
 * aside for other actors through `<unlockableForActors>` is refused, with a warning, since an event asking
 * for it is a mistake in the event rather than something to quietly honor.
 * @param {number} classId The id of the class to unlock.
 */
Game_Actor.prototype.unlockClass = function(classId)
{
  // a class set aside for other actors is not this one's to unlock.
  if (ClassManager.canUnlockClass(this, classId) === false)
  {
    Diagnostics.warn(__PLUGIN_NAME__, `class ${classId} is set aside for other actors, not actor ${this.actorId()}.`);
    return;
  }

  // an unlock that already happened has nothing left to do.
  if (this.isClassUnlocked(classId)) return;

  // record the class after everything unlocked before it.
  const classIds = [ ...this.unlockedClassIds(), classId ];
  this.setUnlockedClassIds(classIds);
};
//endregion Game_Actor