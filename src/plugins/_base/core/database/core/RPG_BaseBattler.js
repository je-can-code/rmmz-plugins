import RPG_Traited from '../base/RPG_Traited.js';

//region RPG_BaseBattler
/**
 * A class representing the groundwork for what all battlers
 * database data look like.
 */
class RPG_BaseBattler
  extends RPG_Traited
{
  /**
   * The name of the battler while in battle.
   * @type {string}
   */
  battlerName = String.empty;

  /**
   * Constructor.
   * Maps the base battler data to the properties on this class.
   * @param {RPG_Enemy|RPG_Actor} battler The battler to parse.
   * @param {number} index The index of the entry in the database.
   */
  constructor(battler, index)
  {
    // perform original logic.
    super(battler, index);

    // map core battler data onto this object.
    this.battlerName = battler.battlerName;
  }

  /**
   * Gets the type of implementation this database entry is.
   * @returns {string}
   */
  implementationType()
  {
    return `${super.implementationType()}:battler`;
  }
}


export default RPG_BaseBattler;
//endregion RPG_BaseBattler