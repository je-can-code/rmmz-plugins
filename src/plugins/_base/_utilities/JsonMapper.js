//region JsonMapper
class JsonMapper
{
  /**
   * Parses a object into whatever its given data type is.
   * @param {any} obj The unknown object to parse.
   * @returns {any|null}
   */
  static parseObject(obj)
  {
    // do not attempt to parse if the input is null.
    if (obj === null || obj === undefined) return null;

    // check if the object to parse is a string.
    if (typeof obj === "string")
    {
      // check if the string is an unparsed array.
      if (obj.startsWith("[") && obj.endsWith("]"))
      {
        // expose the stringified segments of the array.
        return this.parseArrayFromString(obj);
      }

      // no check for special string values.
      return this.parseString(obj);
    }

    // check if the object to parse is a collection.
    if (Array.isArray(obj))
    {
      // iterate over the array and parse each item.
      return obj.map(this.parseObject, this);
    }

    // number, boolean, or otherwise unidentifiable object.
    return obj;
  }

  /**
   * Parses a presumed array by peeling off the `[` and `]` and parsing the
   * exposed insides.
   *
   * This does not handle multiple nested arrays properly.
   * @param {string} strArr An string presumed to be an array.
   * @returns {any} The parsed exposed insides of the string array.
   */
  static parseArrayFromString(strArr)
  {
    // expose the stringified segments of the array.
    const exposedArray = strArr
      // peel off the outer brackets.
      .slice(1, strArr.length - 1)
      // split string into an array by comma or space+comma.
      .split(/, |,/);

    // grab the index of any possible inner arrays.
    const innerArrayStartIndex = exposedArray.findIndex(element => element.startsWith("["));

    // check if we found an opening inner array bracket.
    if (innerArrayStartIndex > -1)
    {
      // grab the last closing inner array bracket.
      const outerArrayEndIndex = exposedArray.findLastIndex(element => element.endsWith("]"));

      // slice the array contents that we believe is an inner array.
      const slicedArrayString = exposedArray
        .slice(innerArrayStartIndex, outerArrayEndIndex + 1)
        .toString();

      // convert the inner array contents into a proper array.
      const innerArray = this.parseArrayFromString(slicedArrayString);

      // splice the inner array into the original array replacing all elements.
      exposedArray.splice(
        innerArrayStartIndex,
        ((outerArrayEndIndex + 1) - innerArrayStartIndex),
        innerArray);
    }

    // with the content exposed, attempt to continue parsing.
    return this.parseObject(exposedArray);
  }

  /**
   * Parses a metadata object from a string into possibly a boolean or number.
   * If the conversion to those fail, then it'll proceed as a string.
   * @param {string} str The string object to parse.
   * @returns {boolean|number|string}
   */
  static parseString(str)
  {
    // check if its actually boolean true.
    if (str.toLowerCase() === "true") return true;
    // check if its actually boolean false.
    else if (str.toLowerCase() === "false") return false;

    // check if its actually a number.
    if (!Number.isNaN(parseFloat(str))) return parseFloat(str);

    // it must just be a word or something.
    return str;
  }
}
//endregion JsonMapper