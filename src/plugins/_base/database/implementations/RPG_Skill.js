import RPG_UsableItem from '../core/RPG_UsableItem.js';

//region RPG_Skill
/**
 * An class representing a single skill from the database.
 */
class RPG_Skill
  extends RPG_UsableItem
{
  //region properties
  /**
   * The first line of the message for this skill.
   * @type {string}
   */
  message1 = String.empty;

  /**
   * The second line of the message for this skill.
   * @type {string}
   */
  message2 = String.empty;

  /**
   * The amount of MP required to execute this skill.
   * @type {number}
   */
  mpCost = 0;

  /**
   * The first of two required weapon types to be equipped to execute this skill.
   * @type {number}
   */
  requiredWtypeId1 = 0;

  /**
   * The second of two required weapon types to be equipped to execute this skill.
   * @type {number}
   */
  requiredWtypeId2 = 0;

  /**
   * The skill type that this skill belongs to.
   * @type {number}
   */
  stypeId = 0;

  /**
   * The amount of TP required to execute this skill.
   * @type {number}
   */
  tpCost = 0;

  //endregion properties

  /**
   * Constructor.
   * Maps the skill's properties into this object.
   * @param {RPG_Skill} skill The underlying skill object.
   * @param {number} index The index of the skill in the database.
   */
  constructor(skill, index)
  {
    // supply the base class params.
    super(skill, index);

    // map the data.
    this.initMembers(skill);
  }

  /**
   * Maps all the data from the JSON to this object.
   * @param {RPG_Skill} skill The underlying skill object.
   */
  initMembers(skill)
  {
    // map the data.
    this.message1 = skill.message1;
    this.message2 = skill.message2;
    this.mpCost = skill.mpCost;
    this.requiredWtypeId1 = skill.requiredWtypeId1;
    this.requiredWtypeId2 = skill.requiredWtypeId2;
    this.stypeId = skill.stypeId;
    this.tpCost = skill.tpCost;
  }

  /**
   * Whether or not this database entry is a skill.
   * @returns {boolean}
   */
  isSkill()
  {
    return true;
  }

  /**
   * Gets the type of implementation this database entry is.
   * @returns {string}
   */
  implementationType()
  {
    return `${super.implementationType()}:skill`;
  }

  /**
   * Hydrated blank skill row—symmetry with other DB wrappers when a slot must read as "unused but valid".
   *
   * @param {number} index database id and `$dataSkills` index for this row
   * @returns {RPG_Skill}
   */
  static createEmpty(index)
  {
    const raw = {
      id: index,
      message1: String.empty,
      message2: String.empty,
      messageType: 1,
      mpCost: 0,
      requiredWtypeId1: 0,
      requiredWtypeId2: 0,
      stypeId: 1,
      tpCost: 0,
      animationId: 0,
      damage: {
        critical: false,
        elementId: 0,
        formula: '0',
        type: 0,
        variance: 20,
      },
      effects: [],
      hitType: 0,
      occasion: 0,
      repeats: 1,
      scope: 1,
      speed: 0,
      successRate: 100,
      tpGain: 0,
      description: String.empty,
      iconIndex: 0,
      name: String.empty,
      note: String.empty,
      meta: {},
    };

    return new RPG_Skill(raw, index);
  }
}


export default RPG_Skill;
//endregion RPG_Skill