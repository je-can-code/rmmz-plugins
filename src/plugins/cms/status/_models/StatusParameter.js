//region StatusParameter
/**
 * The content of a single parameter being drawn in a window.
 */
class StatusParameter
{
  /**
   * The numeric value for the parameter.
   * For sp/ex parameters, this may be a decimal.
   * @type {number}
   */
  value = 0.0;

  /**
   * The parameter registry key this value represents.
   * @type {string}
   */
  parameterKey = String.empty;

  /**
   * The `name` of this parameter.
   * @type {string}
   */
  name = String.empty;

  /**
   * The `iconIndex` of this parameter.
   * @type {number}
   */
  iconIndex = 0;

  /**
   * The `colorIndex` of this parameter.
   * @type {number}
   */
  colorIndex = 0;

  /**
   * Constructor.
   * @param {number} value The value of the parameter.
   * @param {string} parameterKey The registry key this value represents.
   */
  constructor(value, parameterKey)
  {
    // assign the raw numeric value of the parameter.
    this.value = value;

    // assign the registry key that describes how this value should be displayed.
    this.parameterKey = parameterKey;

    // refresh the derived display data for this parameter.
    this.refresh();
  }

  /**
   * Initialize the properties based on the registry definition.
   */
  refresh()
  {
    const definition = ParameterRegistry.get(this.parameterKey);

    if (!definition)
    {
      this.name = this.parameterKey;
      this.iconIndex = 0;
      this.colorIndex = 0;
      return;
    }

    this.name = definition.label();
    this.iconIndex = definition.iconIndex();
    this.colorIndex = definition.resolveDisplayColorIndex(this.value);
  }

  /**
   * Whether this parameter should use styled zero-padding on the status screen.
   * @returns {boolean}
   */
  usesStyledValue()
  {
    const definition = ParameterRegistry.get(this.parameterKey);

    if (!definition)
    {
      return false;
    }

    if (definition.resolveDisplaySentinel(this.value))
    {
      return false;
    }

    return definition.format !== ParameterFormat.REGEN_PER_SECOND;
  }

  /**
   * Get the pretty value of this parameter.
   * @param {boolean=} withPadding True if you want zero-padding, false otherwise; defaults to false.
   * @returns {string}
   */
  prettyValue(withPadding = false)
  {
    const definition = ParameterRegistry.get(this.parameterKey);

    if (!definition)
    {
      return this.value.toString();
    }

    return definition.prettyValue(this.value, withPadding);
  }
}

export default StatusParameter;
//endregion StatusParameter