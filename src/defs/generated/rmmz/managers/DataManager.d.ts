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
   * Inferred engine backing field.
   *
   * Type: `object[]`.
   * Initialized in: module init.
   * Written in: module init.
   * Read in: {@link DataManager#isDatabaseLoaded}, {@link DataManager#loadDatabase}.
   */
  _databaseFiles: object[];
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown[]`.
   * Initialized in: module init.
   * Written in: module init.
   * Read in: {@link DataManager#checkError}, {@link DataManager#onXhrError}.
   *
   * Consumed by:
   * - `.length`: {@link DataManager#checkError}.
   * - `push()`: {@link DataManager#onXhrError}.
   * - `shift()`: {@link DataManager#checkError}.
   */
  _errors: unknown[];
  /**
   * Inferred engine backing field.
   *
   * Type: `null | unknown[]`.
   * Initialized in: module init.
   * Written in: module init, {@link DataManager#loadGlobalInfo}.
   * Read in: {@link DataManager#earliestSavefileId}, {@link DataManager#emptySavefileId}, {@link DataManager#isAnySavefileExists}, {@link DataManager#isGlobalInfoLoaded}, {@link DataManager#latestSavefileId}, {@link DataManager#loadAllSavefileImages}, {@link DataManager#removeInvalidGlobalInfo}, {@link DataManager#saveGame}, {@link DataManager#saveGlobalInfo}, {@link DataManager#savefileInfo}.
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
  function earliestSavefileId(): number;
  /**
   * Gets empty savefile id.
   * @returns The result.
   */
  function emptySavefileId(): number;
  /**
   * Performs extract array metadata.
   * @param array The array parameter.
   */
  function extractArrayMetadata(array: object[]): void;
  /**
   * Performs extract metadata.
   * @param data The data parameter.
   */
  function extractMetadata(data: { note: string }): void;
  /**
   * Performs extract save contents.
   * @param contents The contents parameter.
   */
  function extractSaveContents(contents: object): void;
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
  function isArmor(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
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
  function isItem(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
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
  function isMapObject(object: object): boolean;
  /**
   * Determines whether skill.
   * @param item The item parameter.
   * @returns True if skill; false otherwise.
   */
  function isSkill(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
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
  function isWeapon(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  /**
   * Gets latest savefile id.
   * @returns The result.
   */
  function latestSavefileId(): number;
  /**
   * Performs load all savefile images.
   */
  function loadAllSavefileImages(): void;
  /**
   * Performs load data file.
   * @param name The name parameter.
   * @param src The src parameter.
   */
  function loadDataFile(name: string, src: string): void;
  /**
   * Performs load database.
   */
  function loadDatabase(): void;
  /**
   * Gets load game.
   * @param savefileId The savefileId parameter.
   * @returns The result.
   */
  function loadGame(savefileId: number): Promise<number>;
  /**
   * Performs load global info.
   */
  function loadGlobalInfo(): void;
  /**
   * Performs load map data.
   * @param mapId The mapId parameter.
   */
  function loadMapData(mapId: number): void;
  /**
   * Performs load savefile images.
   * @param info The info parameter.
   */
  function loadSavefileImages(info: object): void;
  /**
   * Creates empty map.
   */
  function makeEmptyMap(): void;
  /**
   * Creates save contents.
   * @returns The result.
   */
  function makeSaveContents(): object;
  /**
   * Creates savefile info.
   * @returns The result.
   */
  function makeSavefileInfo(): object;
  /**
   * Creates savename.
   * @param savefileId The savefileId parameter.
   * @returns The result.
   */
  function makeSavename(savefileId: number): string;
  /**
   * Gets max savefiles.
   * @returns The result.
   */
  function maxSavefiles(): number;
  /**
   * Performs on load.
   * @param object The object parameter.
   */
  function onLoad(object: object): void;
  /**
   * Performs on xhr error.
   * @param name The name parameter.
   * @param src The src parameter.
   * @param url The url parameter.
   */
  function onXhrError(name: string, src: string, url: string): void;
  /**
   * Performs on xhr load.
   * @param xhr The xhr parameter.
   * @param name The name parameter.
   * @param src The src parameter.
   * @param url The url parameter.
   */
  function onXhrLoad(xhr: XMLHttpRequest, name: string, src: string, url: string): void;
  /**
   * Removes invalid global info.
   */
  function removeInvalidGlobalInfo(): void;
  /**
   * Gets save game.
   * @param savefileId The savefileId parameter.
   * @returns The result.
   */
  function saveGame(savefileId: number): Promise<number>;
  /**
   * Performs save global info.
   */
  function saveGlobalInfo(): void;
  /**
   * Gets savefile exists.
   * @param savefileId The savefileId parameter.
   * @returns The result.
   */
  function savefileExists(savefileId: number): boolean;
  /**
   * Gets savefile info.
   * @param savefileId The savefileId parameter.
   * @returns The result.
   */
  function savefileInfo(savefileId: number): object | null;
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
