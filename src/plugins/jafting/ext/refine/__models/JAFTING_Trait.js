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
function JAFTING_Trait()
{
  this.initialize(...arguments);
}

JAFTING_Trait.prototype = {};
JAFTING_Trait.prototype.constructor = JAFTING_Trait;

/**
 * Initializes the members of this class.
 * @param {number} code The code of the trait.
 * @param {number} dataId The dataId of the trait.
 * @param {number} value The value of the trait.
 */
JAFTING_Trait.prototype.initialize = function(code, dataId, value)
{
  this._code = code;
  this._dataId = dataId;
  this._value = value;
};

/**
 * The defacto of what JAFTING considers a "divider" trait.
 * All traits defined AFTER this trait are considered transferable.
 * @returns {RPG_Trait}
 */
JAFTING_Trait.divider = function()
{
  return RPG_Trait.fromValues(J.BASE.Traits.NO_DISAPPEAR, 3, 1);
};

/**
 * Gets a standardized concatenation of the name and value for this trait.
 * Delegates to {@link RPG_Trait#textNameAndValue} in J-Base.
 * @returns {string}
 */
Object.defineProperty(JAFTING_Trait.prototype, "nameAndValue", {
  get()
  {
    return this.convertToRmTrait().textNameAndValue();
  },
  configurable: true,
});

/**
 * Gets the friendly name of the trait based on the trait code.
 * Delegates to {@link RPG_Trait#textName} in J-Base.
 * @returns {string}
 */
Object.defineProperty(JAFTING_Trait.prototype, "name", {
  get()
  {
    return this.convertToRmTrait().textName();
  },
  configurable: true,
});

/**
 * Gets the friendly value of the trait based on the trait code and value.
 * Delegates to {@link RPG_Trait#textValue} in J-Base.
 * @returns {string}
 */
Object.defineProperty(JAFTING_Trait.prototype, "value", {
  get()
  {
    return this.convertToRmTrait().textValue();
  },
  configurable: true,
});

/**
 * Gets the original RM trait associated with this JAFTING trait.
 * @returns {RPG_Trait}
 */
JAFTING_Trait.prototype.convertToRmTrait = function()
{
  return RPG_Trait.fromValues(this._code, this._dataId, this._value);
};
export default JAFTING_Trait;

//endregion JAFTING_Trait