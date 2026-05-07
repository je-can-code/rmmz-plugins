//region RPG_Class
/**
 * A class representing a RPG-relevant class from the database.
 */
class RPG_Class
  extends RPG_Traited
{
  //region properties
  /**
   * The four data points that comprise the EXP curve for this class.
   * @type {[number, number, number, number]}
   */
  expParams = [ 0, 0, 0, 0 ];

  /**
   * A collection of skill learning data points for this class.
   * @type {RPG_ClassLearning[]}
   */
  learnings = [];

  /**
   * A multi-dimensional array of the core parameters that all battlers have:
   * MHP, MMP, ATK, DEF, MAT, MDF, SPD, LUK,
   * in that order, but for all 100 of the base levels.
   * @type {[number[], number[], number[], number[], number[], number[], number[], number[]]}
   */
  params = [ [ 1 ], [ 0 ], [ 0 ], [ 0 ], [ 0 ], [ 0 ], [ 0 ], [ 0 ] ];

  //endregion properties

  /**
   * Constructor.
   * @param {RPG_Class} classData The class data to parse.
   * @param {number} index The index of the entry in the database.
   */
  constructor(classData, index)
  {
    // perform original logic.
    super(classData, index);

    // map the class data to this object.
    this.expParams = classData.expParams;
    this.learnings = classData.learnings
      .map(learning => new RPG_ClassLearning(learning));
    this.params = classData.params;
  }

  /**
   * Whether or not this database entry is a class.
   * @returns {boolean}
   */
  isClass()
  {
    return true;
  }

  /**
   * Gets the type of implementation this database entry is.
   * @returns {string}
   */
  implementationType()
  {
    return `${super.implementationType()}:class`;
  }
}

//endregion RPG_Class