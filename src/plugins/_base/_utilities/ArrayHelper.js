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
   * Determines whether two arrays share at least one common element.
   * Builds a Set from the smaller array for O(n + m) performance and early exit.
   *
   * Notes:
   * - Accepts numbers or strings (ids, keys, etc.).
   * - Returns false if either array is empty.
   *
   * @param {(number|string)[]} left The first collection of values.
   * @param {(number|string)[]} right The second collection of values.
   * @returns {boolean} True if a value is found in both arrays; otherwise false.
   */
  static hasAnyIntersection(left, right)
  {
    // if either collection is missing or empty, then there is no intersection.
    if (!left || left.length === 0)
    {
      return false;
    }

    if (!right || right.length === 0)
    {
      return false;
    }

    // identify the smaller/larger arrays to minimize Set size.
    let small = left;
    let large = right;
    if (right.length < left.length)
    {
      small = right;
      large = left;
    }

    // create a set for O(1) membership checks.
    const lookup = new Set(small);

    // iterate the larger array and check for membership in the set.
    for (let i = 0; i < large.length; i++)
    {
      // grab the current value from the larger array.
      const value = large[i];

      // if it exists in the set, we found an intersection.
      if (lookup.has(value))
      {
        return true;
      }
    }

    // no matches were found across both arrays.
    return false;
  }

  /**
   * Creates an array of numbers from a range, inclusive.
   * @param {number} a The starting number of the range.
   * @param {number} b The ending number of the range.
   * @returns {number[]} An array of numbers from a to b, inclusive.
   */
  static rangeInclusive(a, b)
  {
    return Array.from({ length: b - a + 1 }, (_, i) => a + i);
  }
}