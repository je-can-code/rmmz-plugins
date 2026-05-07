/**
 * Generated from project/js/rmmz_managers.js
 * Class: EffectManager
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface EffectManager
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `object`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init, {@link EffectManager#clear}.<br/>
   * Read in: {@link EffectManager#clear}, {@link EffectManager#isReady}, {@link EffectManager#load}, {@link EffectManager#startLoading}.<br/>
   */
  _cache: object;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init.<br/>
   * Read in: {@link EffectManager#checkErrors}, {@link EffectManager#onError}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `push()`: {@link EffectManager#onError}.<br/>
   * - `shift()`: {@link EffectManager#checkErrors}.<br/>
   */
  _errorUrls: unknown[];
}
declare function EffectManager(): never;
declare namespace EffectManager
{
  /**
   * Performs check errors.
   */
  function checkErrors(): void;
  /**
   * Performs clear.
   */
  function clear(): void;
  /**
   * Determines whether ready.
   * @returns True if ready; false otherwise.
   */
  function isReady(): boolean;
  /**
   * Gets load.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function load(filename: string): null;
  /**
   * Creates url.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function makeUrl(filename: string): string;
  /**
   * Performs on error.
   * @param url The url parameter.
   */
  function onError(url: string): void;
  /**
   * Performs on load.
   */
  function onLoad(): void;
  /**
   * Gets start loading.
   * @param url The url parameter.
   * @returns The result.
   */
  function startLoading(url: string): object;
  /**
   * Performs throw load error.
   * @param url The url parameter.
   */
  function throwLoadError(url: string): void;
}
