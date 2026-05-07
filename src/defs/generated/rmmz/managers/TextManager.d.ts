/**
 * Generated from project/js/rmmz_managers.js
 * Class: TextManager
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
declare function TextManager(): never;
declare namespace TextManager
{
  /**
   * Gets basic.
   * @param basicId The basicId parameter.
   * @returns The result.
   */
  function basic(basicId: number): string;
  /**
   * Gets command.
   * @param commandId The commandId parameter.
   * @returns The result.
   */
  function command(commandId: number): string;
  /**
   * Gets getter.
   * @param method The method parameter.
   * @param param The param parameter.
   * @returns The result.
   */
  function getter(method: string, param: number | string): object;
  /**
   * Gets message.
   * @param messageId The messageId parameter.
   * @returns The result.
   */
  function message(messageId: number): string;
  /**
   * Gets param.
   * @param paramId The paramId parameter.
   * @returns The result.
   */
  function param(paramId: number): string;
}
