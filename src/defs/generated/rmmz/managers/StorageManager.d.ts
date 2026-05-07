/**
 * Generated from project/js/rmmz_managers.js
 * Class: StorageManager
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface StorageManager
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init, {@link StorageManager#updateForageKeys}.<br/>
   * Read in: {@link StorageManager#forageExists}.<br/>
   */
  _forageKeys: unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init, {@link StorageManager#updateForageKeys}.<br/>
   * Read in: {@link StorageManager#forageKeysUpdated}.<br/>
   */
  _forageKeysUpdated: boolean;
}
declare function StorageManager(): never;
declare namespace StorageManager
{
  /**
   * Gets exists.
   * @param saveName The saveName parameter.
   * @returns The result.
   */
  function exists(saveName: unknown): unknown;
  /**
   * Gets file directory path.
   * @returns The result.
   */
  function fileDirectoryPath(): unknown;
  /**
   * Gets file path.
   * @param saveName The saveName parameter.
   * @returns The result.
   */
  function filePath(saveName: unknown): string;
  /**
   * Gets forage exists.
   * @param saveName The saveName parameter.
   * @returns The result.
   */
  function forageExists(saveName: unknown): unknown;
  /**
   * Gets forage key.
   * @param saveName The saveName parameter.
   * @returns The result.
   */
  function forageKey(saveName: unknown): string;
  /**
   * Gets forage keys updated.
   * @returns The result.
   */
  function forageKeysUpdated(): unknown;
  /**
   * Gets forage test key.
   * @returns The result.
   */
  function forageTestKey(): string;
  /**
   * Performs fs mkdir.
   * @param path The path parameter.
   */
  function fsMkdir(path: unknown): void;
  /**
   * Gets fs read file.
   * @param path The path parameter.
   * @returns The result.
   */
  function fsReadFile(path: unknown): null;
  /**
   * Performs fs rename.
   * @param oldPath The oldPath parameter.
   * @param newPath The newPath parameter.
   */
  function fsRename(oldPath: unknown, newPath: unknown): void;
  /**
   * Performs fs unlink.
   * @param path The path parameter.
   */
  function fsUnlink(path: unknown): void;
  /**
   * Performs fs write file.
   * @param path The path parameter.
   * @param data The data parameter.
   */
  function fsWriteFile(path: unknown, data: unknown): void;
  /**
   * Determines whether local mode.
   * @returns True if local mode; false otherwise.
   */
  function isLocalMode(): boolean;
  /**
   * Gets json to object.
   * @param json The json parameter.
   * @returns The result.
   */
  function jsonToObject(json: unknown): Promise;
  /**
   * Gets json to zip.
   * @param json The json parameter.
   * @returns The result.
   */
  function jsonToZip(json: unknown): Promise;
  /**
   * Gets load from forage.
   * @param saveName The saveName parameter.
   * @returns The result.
   */
  function loadFromForage(saveName: unknown): unknown;
  /**
   * Gets load from local file.
   * @param saveName The saveName parameter.
   * @returns The result.
   */
  function loadFromLocalFile(saveName: unknown): Promise;
  /**
   * Gets load object.
   * @param saveName The saveName parameter.
   * @returns The result.
   */
  function loadObject(saveName: unknown): unknown;
  /**
   * Gets load zip.
   * @param saveName The saveName parameter.
   * @returns The result.
   */
  function loadZip(saveName: unknown): unknown;
  /**
   * Gets local file exists.
   * @param saveName The saveName parameter.
   * @returns The result.
   */
  function localFileExists(saveName: unknown): unknown;
  /**
   * Gets object to json.
   * @param object The object parameter.
   * @returns The result.
   */
  function objectToJson(object: unknown): Promise;
  /**
   * Gets remove.
   * @param saveName The saveName parameter.
   * @returns The result.
   */
  function remove(saveName: unknown): unknown;
  /**
   * Removes forage.
   * @param saveName The saveName parameter.
   * @returns The result.
   */
  function removeForage(saveName: unknown): unknown;
  /**
   * Removes local file.
   * @param saveName The saveName parameter.
   */
  function removeLocalFile(saveName: unknown): void;
  /**
   * Gets save object.
   * @param saveName The saveName parameter.
   * @param object The object parameter.
   * @returns The result.
   */
  function saveObject(saveName: unknown, object: unknown): unknown;
  /**
   * Gets save to forage.
   * @param saveName The saveName parameter.
   * @param zip The zip parameter.
   * @returns The result.
   */
  function saveToForage(saveName: unknown, zip: unknown): unknown;
  /**
   * Gets save to local file.
   * @param saveName The saveName parameter.
   * @param zip The zip parameter.
   * @returns The result.
   */
  function saveToLocalFile(saveName: unknown, zip: unknown): Promise;
  /**
   * Gets save zip.
   * @param saveName The saveName parameter.
   * @param zip The zip parameter.
   * @returns The result.
   */
  function saveZip(saveName: unknown, zip: unknown): unknown;
  /**
   * Updates forage keys.
   * @returns The result.
   */
  function updateForageKeys(): unknown;
  /**
   * Gets zip to json.
   * @param zip The zip parameter.
   * @returns The result.
   */
  function zipToJson(zip: unknown): Promise;
}
