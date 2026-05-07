/**
 * Generated from project/js/rmmz_managers.js
 * Class: FontManager
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface FontManager
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _states: object;
  _urls: object;
}
declare function FontManager(): never;
declare namespace FontManager
{
  function isReady(): boolean;
  function load(family: string, filename: string): void;
  function makeUrl(filename: string): string;
  function startLoading(family: string, url: string): void;
  function throwLoadError(family: string): void;
}
