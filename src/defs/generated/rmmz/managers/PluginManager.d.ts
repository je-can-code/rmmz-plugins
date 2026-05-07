/**
 * Generated from project/js/rmmz_managers.js
 * Class: PluginManager
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface PluginManager
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _commands: object;
  _errorUrls: unknown[];
  _parameters: object;
  _scripts: unknown[];
}
declare function PluginManager(): never;
declare namespace PluginManager
{
  function callCommand(self: object, pluginName: string, commandName: string, args: string): void;
  function checkErrors(): void;
  function loadScript(filename: string): void;
  function makeUrl(filename: string): string;
  function onError(e: Event): void;
  function parameters(name: string): object;
  function registerCommand(pluginName: string, commandName: string, func: (args: string) => void): void;
  function setParameters(name: string, parameters: object): void;
  function setup(plugins: object[]): void;
  function throwLoadError(url: string): void;
}
