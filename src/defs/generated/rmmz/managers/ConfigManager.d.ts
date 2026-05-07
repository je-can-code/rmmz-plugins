/**
 * Generated from project/js/rmmz_managers.js
 * Class: ConfigManager
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface ConfigManager
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _isLoaded: boolean;
}
declare function ConfigManager(): never;
declare namespace ConfigManager
{
  function applyData(config: object): void;
  function isLoaded(): boolean;
  function load(): void;
  function makeData(): { alwaysDash: boolean; commandRemember: boolean; touchUI: boolean; bgmVolume: number; bgsVolume: number; meVolume: number; seVolume: number };
  function readFlag(config: object, name: string, defaultValue: boolean): boolean;
  function readVolume(config: object, name: string): number;
  function save(): void;
  const alwaysDash: false;
  const commandRemember: false;
  const touchUI: true;
}
