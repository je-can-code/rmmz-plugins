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
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _cache: object;
  _errorUrls: unknown[];
}
declare function EffectManager(): never;
declare namespace EffectManager
{
  function checkErrors(): void;
  function clear(): void;
  function isReady(): boolean;
  function load(filename: string): null;
  function makeUrl(filename: string): string;
  function onError(url: string): void;
  function onLoad(): void;
  function startLoading(url: string): object;
  function throwLoadError(url: string): void;
}
