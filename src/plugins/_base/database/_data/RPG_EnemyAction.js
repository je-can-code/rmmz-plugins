//region RPG_EnemyAction
/**
 * A class representing a single enemy action from the database.
 */
class RPG_EnemyAction
{
  //region properties
  /**
   * The first parameter of the condition configuration.
   * @type {number}
   */
  conditionParam1 = 0;

  /**
   * The second parameter of the condition configuration.
   * @type {number}
   */
  conditionParam2 = 0;

  /**
   * The type of condition it is.
   * @type {number}
   */
  conditionType = 0;

  /**
   * The weight or rating that this enemy will execute this skill.
   * @type {number}
   */
  rating = 5;

  /**
   * The skill id associated with the action.
   * @type {number}
   */
  skillId = 1;

  //endregion properties

  /**
   * Constructor.
   * @param {RPG_EnemyAction} enemyAction The action to parse.
   * @param {number} index The index of the entry in the database.
   */
  // eslint-disable-next-line no-unused-vars
  constructor(enemyAction, index)
  {
    this.conditionParam1 = enemyAction.conditionParam1;
    this.conditionParam2 = enemyAction.conditionParam2;
    this.conditionType = enemyAction.conditionType;
    // assign rating on this instance for callers.
    this.rating = enemyAction.rating;
    this.skillId = enemyAction.skillId;
  }
}


export default RPG_EnemyAction;
//endregion RPG_EnemyAction