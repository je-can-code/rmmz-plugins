/**
 * Generated from project/js/rmmz_core.js
 * Class: JsonEx
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
declare function JsonEx(): never;
declare namespace JsonEx
{
  /**
   * Makes a deep copy of the specified object.
   */
  function _decode(value: object): object;
  /**
   * Makes a deep copy of the specified object.
   */
  function _encode(value: object, depth: number): object;
  /**
   * Makes a deep copy of the specified object.
   * @param object The object to be copied.
   */
  function makeDeepCopy(object: object): object;
  /**
   * Parses a JSON string and reconstructs the corresponding object.
   * @param json The JSON string.
   */
  function parse(json: string): object;
  /**
   * Converts an object to a JSON string with object information.
   * @param object The object to be converted.
   */
  function stringify(object: object): string;
  const maxDepth: 100;
}
