//region JAFTING_Trait
/**
 * A class representing a single trait on a piece of equipment that can be potentially
 * transferred by means of JAFTING's refinement mode.
 *
 * Trait name, value, and combined display are delegated entirely to
 * {@link RPG_Trait} (J-Base), which is the canonical translation layer.
 * The only JAFTING-specific responsibility this class retains is the divider
 * factory and the {@link convertToRmTrait} bridge back to a plain RPG_Trait.
 */
class JAFTING_Trait
{
  /**
   * Initializes the members of this class.
   * @param {number} code The code of the trait.
   * @param {number} dataId The dataId of the trait.
   * @param {number} value The value of the trait.
   */
  

  //region properties
  /**
   * Gets the code.
   * @returns {*} The code.
   */
  code()
  {
    // hand back the code.
    return this._code;
  }

  /**
   * Gets the data id.
   * @returns {*} The dataId.
   */
  dataId()
  {
    // hand back the data id.
    return this._dataId;
  }
  //endregion properties

  constructor(code, dataId, value)
  {
    this._code = code;
    this._dataId = dataId;
    this._value = value;
  }

  /**
   * The defacto of what JAFTING considers a "divider" trait.
   * All traits defined AFTER this trait are considered transferable.
   * @returns {RPG_Trait}
   */
  static divider()
  {
    return RPG_Trait.fromValues(J.BASE.Traits.NO_DISAPPEAR, 3, 1);
  }

  /**
   * Gets a standardized concatenation of the name and value for this trait.
   * Delegates to {@link RPG_Trait#textNameAndValue} in J-Base.
   * @returns {string}
   */
  get nameAndValue()
  {
    return this.convertToRmTrait().textNameAndValue();
  }

  /**
   * Gets the friendly name of the trait based on the trait code.
   * Delegates to {@link RPG_Trait#textName} in J-Base.
   * @returns {string}
   */
  get name()
  {
    return this.convertToRmTrait().textName();
  }

  /**
   * Gets the friendly value of the trait based on the trait code and value.
   * Delegates to {@link RPG_Trait#textValue} in J-Base.
   * @returns {string}
   */
  get value()
  {
    return this.convertToRmTrait().textValue();
  }

  /**
   * Gets the original RM trait associated with this JAFTING trait.
   * @returns {RPG_Trait}
   */
  convertToRmTrait()
  {
    return RPG_Trait.fromValues(this.code(), this.dataId(), this._value);
  }
}

export default JAFTING_Trait;

//endregion JAFTING_Trait