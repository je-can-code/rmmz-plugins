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
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _databaseFiles: object[];
  _errors: unknown[];
  _globalInfo: null | unknown[];
}
declare function DataManager(): never;
declare namespace DataManager
{
  function checkError(): void;
  function correctDataErrors(): void;
  function createGameObjects(): void;
  function earliestSavefileId(): number;
  function emptySavefileId(): number;
  function extractArrayMetadata(array: object[]): void;
  function extractMetadata(data: { note: string }): void;
  function extractSaveContents(contents: object): void;
  function isAnySavefileExists(): boolean;
  function isArmor(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  function isBattleTest(): boolean;
  function isDatabaseLoaded(): boolean;
  function isEventTest(): boolean;
  function isGlobalInfoLoaded(): boolean;
  function isItem(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  function isMapLoaded(): boolean;
  function isMapObject(object: object): boolean;
  function isSkill(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  function isTitleSkip(): boolean;
  function isWeapon(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  function latestSavefileId(): number;
  function loadAllSavefileImages(): void;
  function loadDataFile(name: string, src: string): void;
  function loadDatabase(): void;
  function loadGame(savefileId: number): Promise<number>;
  function loadGlobalInfo(): void;
  function loadMapData(mapId: number): void;
  function loadSavefileImages(info: object): void;
  function makeEmptyMap(): void;
  function makeSaveContents(): object;
  function makeSavefileInfo(): object;
  function makeSavename(savefileId: number): string;
  function maxSavefiles(): number;
  function onLoad(object: object): void;
  function onXhrError(name: string, src: string, url: string): void;
  function onXhrLoad(xhr: XMLHttpRequest, name: string, src: string, url: string): void;
  function removeInvalidGlobalInfo(): void;
  function saveGame(savefileId: number): Promise<number>;
  function saveGlobalInfo(): void;
  function savefileExists(savefileId: number): boolean;
  function savefileInfo(savefileId: number): object | null;
  function selectSavefileForNewGame(): void;
  function setupBattleTest(): void;
  function setupEventTest(): void;
  function setupNewGame(): void;
}
