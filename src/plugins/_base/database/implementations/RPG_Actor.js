import RPG_BaseBattler from '../core/RPG_BaseBattler.js';

//region RPG_Actor
/**
 * A class representing a single actor battler's data from the database.
 */
class RPG_Actor
  extends RPG_BaseBattler
{
  //region properties
  /**
   * The index of the character sprite of the battler
   * on the spritesheet.
   * @type {number}
   */
  characterIndex = 0;

  /**
   * The name of the file that the character sprite
   * resides within.
   * @type {string}
   */
  characterName = String.empty;

  /**
   * The id of the class that this actor currently is.
   * @type {number}
   */
  classId = 0;

  /**
   * The ids of the equipment in the core equips slots
   * of the actors from the database.
   * @type {number[]}
   */
  equips = [ 0, 0, 0, 0, 0 ];

  /**
   * The index of the face sprite of this battler on
   * the spritesheet.
   * @type {number}
   */
  faceIndex = 0;

  /**
   * The name of the file that the face sprite resides
   * within.
   * @type {string}
   */
  faceName = String.empty;

  /**
   * The starting level for this actor in the database.
   * @type {number}
   */
  initialLevel = 1;

  /**
   * The maximum level of this actor from the database.
   * @type {number}
   */
  maxLevel = 99;

  /**
   * The nickname of this actor from the database.
   * @type {string}
   */
  nickname = String.empty;

  /**
   * The profile multiline text for this actor in the database.
   * @type {string}
   */
  profile = String.empty;

  //endregion properties

  /**
   * Constructor.
   * @param {RPG_Actor} actor The actor to parse.
   * @param {number} index The index of the entry in the database.
   */
  constructor(actor, index)
  {
    // supply parameters to base class.
    super(actor, index);

    // map the data.
    this.initMembers(actor);
  }

  /**
   * Maps the data from the JSON to this object.
   * @param {RPG_Actor} actor The actor to parse.
   */
  initMembers(actor)
  {
    // map actor-specific battler properties.
    this.characterIndex = actor.characterIndex;
    this.characterName = actor.characterName;
    this.classId = actor.classId;
    // assign equips on this instance for callers.
    this.equips = actor.equips;
    this.faceIndex = actor.faceIndex;
    this.faceName = actor.faceName;
    this.initialLevel = actor.initialLevel;
    this.maxLevel = actor.maxLevel;
    this.nickname = actor.nickname;
    this.profile = actor.profile;
  }

  /**
   * Whether or not this database entry is an actor.
   * @returns {boolean}
   */
  isActor()
  {
    return true;
  }

  /**
   * Gets the type of implementation this database entry is.
   * @returns {string}
   */
  implementationType()
  {
    return `${super.implementationType()}:actor`;
  }
}


export default RPG_Actor;
//endregion RPG_Actor