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
   * Inferred engine backing field.
   *
   * Type: `unknown[]`.
   * Initialized in: module init.
   * Written in: module init, {@link StorageManager#updateForageKeys}.
   * Read in: {@link StorageManager#forageExists}.
   */
  _forageKeys: unknown[];
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: module init.
   * Written in: module init, {@link StorageManager#updateForageKeys}.
   * Read in: {@link StorageManager#forageKeysUpdated}.
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
  function exists(saveName: string): boolean;
  /**
   * Gets file directory path.
   * @returns The result.
   */
  function fileDirectoryPath(): string;
  /**
   * Gets file path.
   * @param saveName The saveName parameter.
   * @returns The result.
   */
  function filePath(saveName: string): string;
  /**
   * Gets forage exists.
   * @param saveName The saveName parameter.
   * @returns The result.
   */
  function forageExists(saveName: string): boolean;
  /**
   * Gets forage key.
   * @param saveName The saveName parameter.
   * @returns The result.
   */
  function forageKey(saveName: string): string;
  /**
   * Gets forage keys updated.
   * @returns The result.
   */
  function forageKeysUpdated(): boolean;
  /**
   * Gets forage test key.
   * @returns The result.
   */
  function forageTestKey(): string;
  /**
   * Performs fs mkdir.
   * @param path The path parameter.
   */
  function fsMkdir(path: string): void;
  /**
   * Gets fs read file.
   * @param path The path parameter.
   * @returns The result.
   */
  function fsReadFile(path: string): string | null;
  /**
   * Performs fs rename.
   * @param oldPath The oldPath parameter.
   * @param newPath The newPath parameter.
   */
  function fsRename(oldPath: string, newPath: string): void;
  /**
   * Performs fs unlink.
   * @param path The path parameter.
   */
  function fsUnlink(path: string): void;
  /**
   * Performs fs write file.
   * @param path The path parameter.
   * @param data The data parameter.
   */
  function fsWriteFile(path: string, data: string): void;
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
  function jsonToObject(json: string): Promise<object>;
  /**
   * Gets json to zip.
   * @param json The json parameter.
   * @returns The result.
   */
  function jsonToZip(json: string): Promise<string>;
  /**
   * Gets load from forage.
   * @param saveName The saveName parameter.
   * @returns The result.
   */
  function loadFromForage(saveName: string): Promise<string>;
  /**
   * Gets load from local file.
   * @param saveName The saveName parameter.
   * @returns The result.
   */
  function loadFromLocalFile(saveName: string): Promise<string>;
  /**
   * Gets load object.
   * @param saveName The saveName parameter.
   * @returns The result.
   */
  function loadObject(saveName: string): Promise<object>;
  /**
   * Gets load zip.
   * @param saveName The saveName parameter.
   * @returns The result.
   */
  function loadZip(saveName: string): Promise<string>;
  /**
   * Gets local file exists.
   * @param saveName The saveName parameter.
   * @returns The result.
   */
  function localFileExists(saveName: string): boolean;
  /**
   * Gets object to json.
   * @param object The object parameter.
   * @returns The result.
   */
  function objectToJson(object: object): Promise<string>;
  /**
   * Gets remove.
   * @param saveName The saveName parameter.
   * @returns The result.
   */
  function remove(saveName: string): void | Promise<number>;
  /**
   * Removes forage.
   * @param saveName The saveName parameter.
   * @returns The result.
   */
  function removeForage(saveName: string): Promise<number>;
  /**
   * Removes local file.
   * @param saveName The saveName parameter.
   */
  function removeLocalFile(saveName: string): void;
  /**
   * Gets save object.
   * @param saveName The saveName parameter.
   * @param object The object parameter.
   * @returns The result.
   */
  function saveObject(saveName: string, object: object): Promise<void>;
  /**
   * Gets save to forage.
   * @param saveName The saveName parameter.
   * @param zip The zip parameter.
   * @returns The result.
   */
  function saveToForage(saveName: string, zip: string): Promise<void>;
  /**
   * Gets save to local file.
   * @param saveName The saveName parameter.
   * @param zip The zip parameter.
   * @returns The result.
   */
  function saveToLocalFile(saveName: string, zip: string): Promise<void>;
  /**
   * Gets save zip.
   * @param saveName The saveName parameter.
   * @param zip The zip parameter.
   * @returns The result.
   */
  function saveZip(saveName: string, zip: string): Promise<void>;
  /**
   * Updates forage keys.
   * @returns The result.
   */
  function updateForageKeys(): Promise<number>;
  /**
   * Gets zip to json.
   * @param zip The zip parameter.
   * @returns The result.
   */
  function zipToJson(zip: string): Promise<string>;
}
