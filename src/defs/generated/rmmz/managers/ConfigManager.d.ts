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
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init, {@link ConfigManager#load}.<br/>
   * Read in: {@link ConfigManager#isLoaded}.<br/>
   */
  _isLoaded: boolean;
}
declare function ConfigManager(): never;
declare namespace ConfigManager
{
  /**
   * Performs apply data.
   * @param config The config parameter.
   */
  function applyData(config: object): void;
  /**
   * Gets bgm volume.
   * @returns The result.
   */
  get bgmVolume(): unknown;
  /**
   * Gets bgs volume.
   * @returns The result.
   */
  get bgsVolume(): unknown;
  /**
   * Determines whether loaded.
   * @returns True if loaded; false otherwise.
   */
  function isLoaded(): boolean;
  /**
   * Performs load.
   */
  function load(): void;
  /**
   * Creates data.
   * @returns The result.
   */
  function makeData(): { alwaysDash: boolean; commandRemember: boolean; touchUI: boolean; bgmVolume: number; bgsVolume: number; meVolume: number; seVolume: number };
  /**
   * Gets me volume.
   * @returns The result.
   */
  get meVolume(): unknown;
  /**
   * Gets read flag.
   * @param config The config parameter.
   * @param name The name parameter.
   * @param defaultValue The defaultValue parameter.
   * @returns The result.
   */
  function readFlag(config: object, name: string, defaultValue: boolean): boolean;
  /**
   * Gets read volume.
   * @param config The config parameter.
   * @param name The name parameter.
   * @returns The result.
   */
  function readVolume(config: object, name: string): number;
  /**
   * Performs save.
   */
  function save(): void;
  /**
   * Gets se volume.
   * @returns The result.
   */
  get seVolume(): unknown;
  /**
   * Engine static constant.
   */
  const alwaysDash: false;
  /**
   * Engine static constant.
   */
  const commandRemember: false;
  /**
   * Engine static constant.
   */
  const touchUI: true;
}
