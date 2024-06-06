class ArrayHelper
{
  /**
   * A filter function for ignoring null or undefined.
   * @param {any} value The value of the array being filtered.
   * @returns {boolean} False if the value is null or undefined, true otherwise.
   */
  static NoNulls(value)
  {
    if (value === undefined || value === null)
    {
      return false;
    }

    return true;
  }

  /**
   * A filter function for ignoring any falsey values.
   * @param {any} value The value of the array being filtered.
   * @returns {boolean} True if the value is truthy, false if the value is falsey.
   */
  static NoFalsey(value)
  {
    return !!value;
  }
}