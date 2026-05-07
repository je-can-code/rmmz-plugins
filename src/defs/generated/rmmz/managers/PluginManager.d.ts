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
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `object`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init.<br/>
   * Read in: {@link PluginManager#callCommand}, {@link PluginManager#registerCommand}.<br/>
   */
  _commands: object;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init.<br/>
   * Read in: {@link PluginManager#checkErrors}, {@link PluginManager#onError}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `push()`: {@link PluginManager#onError}.<br/>
   * - `shift()`: {@link PluginManager#checkErrors}.<br/>
   */
  _errorUrls: unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `object`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init.<br/>
   * Read in: {@link PluginManager#parameters}, {@link PluginManager#setParameters}.<br/>
   */
  _parameters: object;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init.<br/>
   * Read in: {@link PluginManager#setup}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `push()`: {@link PluginManager#setup}.<br/>
   */
  _scripts: unknown[];
}
declare function PluginManager(): never;
declare namespace PluginManager
{
  /**
   * Performs call command.
   * @param self The self parameter.
   * @param pluginName The pluginName parameter.
   * @param commandName The commandName parameter.
   * @param args The args parameter.
   */
  function callCommand(self: object, pluginName: string, commandName: string, args: string): void;
  /**
   * Performs check errors.
   */
  function checkErrors(): void;
  /**
   * Performs load script.
   * @param filename The filename parameter.
   */
  function loadScript(filename: string): void;
  /**
   * Creates url.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function makeUrl(filename: string): string;
  /**
   * Performs on error.
   * @param e The e parameter.
   */
  function onError(e: Event): void;
  /**
   * Gets parameters.
   * @param name The name parameter.
   * @returns The result.
   */
  function parameters(name: string): object;
  /**
   * Performs register command.
   * @param pluginName The pluginName parameter.
   * @param commandName The commandName parameter.
   * @param func The func parameter.
   */
  function registerCommand(pluginName: string, commandName: string, func: (args: string) => void): void;
  /**
   * Sets parameters.
   * @param name The name parameter.
   * @param parameters The parameters parameter.
   */
  function setParameters(name: string, parameters: object): void;
  /**
   * Performs setup.
   * @param plugins The plugins parameter.
   */
  function setup(plugins: object[]): void;
  /**
   * Performs throw load error.
   * @param url The url parameter.
   */
  function throwLoadError(url: string): void;
}
