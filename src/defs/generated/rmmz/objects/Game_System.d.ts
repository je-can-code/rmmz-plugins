/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_System
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_System
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _battleBgm: null | { name: string; pan: number; pitch: number; volume: number };
  _battleCount: number;
  _bgmOnSave: null;
  _bgsOnSave: null;
  _defeatMe: null | { name: string; pan: number; pitch: number; volume: number };
  _encounterEnabled: boolean;
  _escapeCount: number;
  _formationEnabled: boolean;
  _framesOnSave: number;
  _menuEnabled: boolean;
  _saveCount: number;
  _saveEnabled: boolean;
  _savedBgm: null;
  _savefileId: number;
  _versionId: number;
  _victoryMe: null | { name: string; pan: number; pitch: number; volume: number };
  _walkingBgm: null;
  _winCount: number;
  _windowTone: null | [number, number, number, number];
  battleBgm(): { name: string; pan: number; pitch: number; volume: number };
  battleCount(): number;
  defeatMe(): { name: string; pan: number; pitch: number; volume: number };
  disableEncounter(): void;
  disableFormation(): void;
  disableMenu(): void;
  disableSave(): void;
  enableEncounter(): void;
  enableFormation(): void;
  enableMenu(): void;
  enableSave(): void;
  escapeCount(): number;
  initialize(): void;
  isAutosaveEnabled(): boolean;
  isCJK(): boolean;
  isChinese(): boolean;
  isEncounterEnabled(): boolean;
  isFormationEnabled(): boolean;
  isJapanese(): boolean;
  isKorean(): boolean;
  isMenuEnabled(): boolean;
  isMessageSkipEnabled(): boolean;
  isRussian(): boolean;
  isSaveEnabled(): boolean;
  isSideView(): boolean;
  mainFontFace(): string;
  mainFontSize(): number;
  numberFontFace(): string;
  onAfterLoad(): void;
  onBattleEscape(): void;
  onBattleStart(): void;
  onBattleWin(): void;
  onBeforeSave(): void;
  playtime(): number;
  playtimeText(): string;
  replayBgm(): void;
  replayWalkingBgm(): void;
  saveBgm(): void;
  saveCount(): number;
  saveWalkingBgm(): void;
  saveWalkingBgm2(): void;
  savefileId(): number;
  setBattleBgm(value: { name: string; pan: number; pitch: number; volume: number }): void;
  setDefeatMe(value: { name: string; pan: number; pitch: number; volume: number }): void;
  setSavefileId(savefileId: number): void;
  setVictoryMe(value: { name: string; pan: number; pitch: number; volume: number }): void;
  setWindowTone(value: [number, number, number, number]): void;
  versionId(): number;
  victoryMe(): { name: string; pan: number; pitch: number; volume: number };
  winCount(): number;
  windowOpacity(): number;
  windowPadding(): number;
  windowTone(): [number, number, number, number];
}
