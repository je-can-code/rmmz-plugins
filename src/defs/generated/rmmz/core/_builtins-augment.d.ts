/**
 * Generated from project/js/rmmz_core.js
 * Built-in prototype/static augmentations (JsExtensions, Math.randomInt, …).
 */

declare global
{
  interface Array
  {
  /**
   * Makes a shallow copy of the array.
   * @returns The result.
   */
  clone(): unknown[];
  /**
   * Checks whether the array contains a given element.
   * @param element The element to search for.
   * @returns The result.
   */
  contains(element: any): boolean;
  /**
   * Checks whether the two arrays are the same.
   * @param array The array to compare to.
   * @returns The result.
   */
  equals(array: unknown[]): boolean;
  /**
   * Removes a given element from the array (in place).
   * @param element The element to remove.
   * @returns The result.
   */
  remove(element: any): unknown[];
  }

  interface Number
  {
  /**
   * Returns a number whose value is limited to the given range.
   * @param min The lower boundary.
   * @param max The upper boundary.
   * @returns The result.
   */
  clamp(min: number, max: number): number;
  /**
   * Returns a modulo value which is always positive.
   * @param n The divisor.
   * @returns The result.
   */
  mod(n: number): number;
  /**
   * Makes a number string with leading zeros.
   * @param length The length of the output string.
   * @returns The result.
   */
  padZero(length: number): string;
  }

  interface String
  {
  /**
   * Checks whether the string contains a given string.
   * @param _string The string to search for.
   * @returns The result.
   */
  contains(_string: string): boolean;
  /**
   * Replaces %1, %2 and so on in the string to the arguments.
   * @returns The result.
   */
  format(): string;
  /**
   * Makes a number string with leading zeros.
   * @param length The length of the output string.
   * @returns The result.
   */
  padZero(length: number): string;
  }

  interface Math
  {
  /**
   * Generates a random integer in the range (0, max-1).
   * @param max The upper boundary (excluded).
   * @returns The result.
   */
  randomInt(max: number): number;
  }
}

export {};
