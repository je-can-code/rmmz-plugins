/**
 * Generated from project/js/rmmz_managers.js
 * Class: DataManager
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface DataManager
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `object[]`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init.<br/>
   * Read in: {@link DataManager#isDatabaseLoaded}, {@link DataManager#loadDatabase}.<br/>
   */
  _databaseFiles: object[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init.<br/>
   * Read in: {@link DataManager#checkError}, {@link DataManager#onXhrError}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `.length`: {@link DataManager#checkError}.<br/>
   * - `push()`: {@link DataManager#onXhrError}.<br/>
   * - `shift()`: {@link DataManager#checkError}.<br/>
   */
  _errors: unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | unknown[]`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init, {@link DataManager#loadGlobalInfo}.<br/>
   * Read in: {@link DataManager#earliestSavefileId}, {@link DataManager#emptySavefileId}, {@link DataManager#isAnySavefileExists}, {@link DataManager#isGlobalInfoLoaded}, {@link DataManager#latestSavefileId}, {@link DataManager#loadAllSavefileImages}, {@link DataManager#removeInvalidGlobalInfo}, {@link DataManager#saveGame}, {@link DataManager#saveGlobalInfo}, {@link DataManager#savefileInfo}.<br/>
   */
  _globalInfo: null | unknown[];
}
declare function DataManager(): never;
declare namespace DataManager
{
  /**
   * Performs check error.
   */
  function checkError(): void;
  /**
   * Performs correct data errors.
   */
  function correctDataErrors(): void;
  /**
   * Creates game objects.
   */
  function createGameObjects(): void;
  /**
   * Gets earliest savefile id.
   * @returns The result.
   */
  function earliestSavefileId(): unknown | number;
  /**
   * Gets empty savefile id.
   * @returns The result.
   */
  function emptySavefileId(): number;
  /**
   * Performs extract array metadata.
   * @param array The array parameter.
   */
  function extractArrayMetadata(array: unknown): void;
  /**
   * Performs extract metadata.
   * @param data The data parameter.
   */
  function extractMetadata(data: unknown): void;
  /**
   * Performs extract save contents.
   * @param contents The contents parameter.
   */
  function extractSaveContents(contents: unknown): void;
  /**
   * Determines whether any savefile exists.
   * @returns True if any savefile exists; false otherwise.
   */
  function isAnySavefileExists(): boolean;
  /**
   * Determines whether armor.
   * @param item The item parameter.
   * @returns True if armor; false otherwise.
   */
  function isArmor(item: unknown): boolean;
  /**
   * Determines whether battle test.
   * @returns True if battle test; false otherwise.
   */
  function isBattleTest(): boolean;
  /**
   * Determines whether database loaded.
   * @returns True if database loaded; false otherwise.
   */
  function isDatabaseLoaded(): boolean;
  /**
   * Determines whether event test.
   * @returns True if event test; false otherwise.
   */
  function isEventTest(): boolean;
  /**
   * Determines whether global info loaded.
   * @returns True if global info loaded; false otherwise.
   */
  function isGlobalInfoLoaded(): boolean;
  /**
   * Determines whether item.
   * @param item The item parameter.
   * @returns True if item; false otherwise.
   */
  function isItem(item: unknown): boolean;
  /**
   * Determines whether map loaded.
   * @returns True if map loaded; false otherwise.
   */
  function isMapLoaded(): boolean;
  /**
   * Determines whether map object.
   * @param object The object parameter.
   * @returns True if map object; false otherwise.
   */
  function isMapObject(object: unknown): boolean;
  /**
   * Determines whether skill.
   * @param item The item parameter.
   * @returns True if skill; false otherwise.
   */
  function isSkill(item: unknown): boolean;
  /**
   * Determines whether title skip.
   * @returns True if title skip; false otherwise.
   */
  function isTitleSkip(): boolean;
  /**
   * Determines whether weapon.
   * @param item The item parameter.
   * @returns True if weapon; false otherwise.
   */
  function isWeapon(item: unknown): boolean;
  /**
   * Gets latest savefile id.
   * @returns The result.
   */
  function latestSavefileId(): unknown | number;
  /**
   * Performs load all savefile images.
   */
  function loadAllSavefileImages(): void;
  /**
   * Performs load data file.
   * @param name The name parameter.
   * @param src The src parameter.
   */
  function loadDataFile(name: unknown, src: unknown): void;
  /**
   * Performs load database.
   */
  function loadDatabase(): void;
  /**
   * Gets load game.
   * @param savefileId The savefileId parameter.
   * @returns The result.
   */
  function loadGame(savefileId: unknown): unknown;
  /**
   * Performs load global info.
   */
  function loadGlobalInfo(): void;
  /**
   * Performs load map data.
   * @param mapId The mapId parameter.
   */
  function loadMapData(mapId: unknown): void;
  /**
   * Performs load savefile images.
   * @param info The info parameter.
   */
  function loadSavefileImages(info: unknown): void;
  /**
   * Creates empty map.
   */
  function makeEmptyMap(): void;
  /**
   * Creates save contents.
   * @returns The result.
   */
  function makeSaveContents(): unknown;
  /**
   * Creates savefile info.
   * @returns The result.
   */
  function makeSavefileInfo(): unknown;
  /**
   * Creates savename.
   * @param savefileId The savefileId parameter.
   * @returns The result.
   */
  function makeSavename(savefileId: unknown): unknown;
  /**
   * Gets max savefiles.
   * @returns The result.
   */
  function maxSavefiles(): number;
  /**
   * Performs on load.
   * @param object The object parameter.
   */
  function onLoad(object: unknown): void;
  /**
   * Performs on xhr error.
   * @param name The name parameter.
   * @param src The src parameter.
   * @param url The url parameter.
   */
  function onXhrError(name: unknown, src: unknown, url: unknown): void;
  /**
   * Performs on xhr load.
   * @param xhr The xhr parameter.
   * @param name The name parameter.
   * @param src The src parameter.
   * @param url The url parameter.
   */
  function onXhrLoad(xhr: unknown, name: unknown, src: unknown, url: unknown): void;
  /**
   * Removes invalid global info.
   */
  function removeInvalidGlobalInfo(): void;
  /**
   * Gets save game.
   * @param savefileId The savefileId parameter.
   * @returns The result.
   */
  function saveGame(savefileId: unknown): unknown;
  /**
   * Performs save global info.
   */
  function saveGlobalInfo(): void;
  /**
   * Gets savefile exists.
   * @param savefileId The savefileId parameter.
   * @returns The result.
   */
  function savefileExists(savefileId: unknown): unknown;
  /**
   * Gets savefile info.
   * @param savefileId The savefileId parameter.
   * @returns The result.
   */
  function savefileInfo(savefileId: unknown): null;
  /**
   * Performs select savefile for new game.
   */
  function selectSavefileForNewGame(): void;
  /**
   * Performs setup battle test.
   */
  function setupBattleTest(): void;
  /**
   * Performs setup event test.
   */
  function setupEventTest(): void;
  /**
   * Performs setup new game.
   */
  function setupNewGame(): void;
}
