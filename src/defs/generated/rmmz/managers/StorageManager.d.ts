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
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _forageKeys: unknown[];
  _forageKeysUpdated: boolean;
}
declare function StorageManager(): never;
declare namespace StorageManager
{
  function exists(saveName: string): boolean;
  function fileDirectoryPath(): string;
  function filePath(saveName: string): string;
  function forageExists(saveName: string): boolean;
  function forageKey(saveName: string): string;
  function forageKeysUpdated(): boolean;
  function forageTestKey(): string;
  function fsMkdir(path: string): void;
  function fsReadFile(path: string): string | null;
  function fsRename(oldPath: string, newPath: string): void;
  function fsUnlink(path: string): void;
  function fsWriteFile(path: string, data: string): void;
  function isLocalMode(): boolean;
  function jsonToObject(json: string): Promise<object>;
  function jsonToZip(json: string): Promise<string>;
  function loadFromForage(saveName: string): Promise<string>;
  function loadFromLocalFile(saveName: string): Promise<string>;
  function loadObject(saveName: string): Promise<object>;
  function loadZip(saveName: string): Promise<string>;
  function localFileExists(saveName: string): boolean;
  function objectToJson(object: object): Promise<string>;
  function remove(saveName: string): void | Promise<number>;
  function removeForage(saveName: string): Promise<number>;
  function removeLocalFile(saveName: string): void;
  function saveObject(saveName: string, object: object): Promise<void>;
  function saveToForage(saveName: string, zip: string): Promise<void>;
  function saveToLocalFile(saveName: string, zip: string): Promise<void>;
  function saveZip(saveName: string, zip: string): Promise<void>;
  function updateForageKeys(): Promise<number>;
  function zipToJson(zip: string): Promise<string>;
}
