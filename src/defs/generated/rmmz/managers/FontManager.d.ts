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
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `object`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init.<br/>
   * Read in: {@link FontManager#isReady}, {@link FontManager#load}, {@link FontManager#startLoading}.<br/>
   */
  _states: object;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `object`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init.<br/>
   * Read in: {@link FontManager#load}, {@link FontManager#startLoading}, {@link FontManager#throwLoadError}.<br/>
   */
  _urls: object;
}
declare function FontManager(): never;
declare namespace FontManager
{
  /**
   * Determines whether ready.
   * @returns True if ready; false otherwise.
   */
  function isReady(): boolean;
  /**
   * Performs load.
   * @param family The family parameter.
   * @param filename The filename parameter.
   */
  function load(family: unknown, filename: unknown): void;
  /**
   * Creates url.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function makeUrl(filename: unknown): string;
  /**
   * Performs start loading.
   * @param family The family parameter.
   * @param url The url parameter.
   */
  function startLoading(family: unknown, url: unknown): void;
  /**
   * Performs throw load error.
   * @param family The family parameter.
   */
  function throwLoadError(family: unknown): void;
}
