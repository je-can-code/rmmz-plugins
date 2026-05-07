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
  function basic(basicId: number): string;
  function command(commandId: number): string;
  function getter(method: string, param: number | string): object;
  function message(messageId: number): string;
  function param(paramId: number): string;
}
