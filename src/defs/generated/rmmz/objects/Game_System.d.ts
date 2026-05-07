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
   * Inferred engine backing field.
   *
   * Type: `null | { name: string; pan: number; pitch: number; volume: number }`.
   * Initialized in: {@link Game_System#initialize}.
   * Written in: {@link Game_System#initialize}, {@link Game_System#setBattleBgm}.
   * Read in: {@link Game_System#battleBgm}.
   */
  _battleBgm: null | { name: string; pan: number; pitch: number; volume: number };
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Game_System#initialize}.
   * Written in: {@link Game_System#initialize}, {@link Game_System#onBattleStart}.
   * Read in: {@link Game_System#battleCount}.
   */
  _battleCount: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `null`.
   * Initialized in: {@link Game_System#initialize}.
   * Written in: {@link Game_System#initialize}, {@link Game_System#onBeforeSave}.
   * Read in: {@link Game_System#onAfterLoad}.
   */
  _bgmOnSave: null;
  /**
   * Inferred engine backing field.
   *
   * Type: `null`.
   * Initialized in: {@link Game_System#initialize}.
   * Written in: {@link Game_System#initialize}, {@link Game_System#onBeforeSave}.
   * Read in: {@link Game_System#onAfterLoad}.
   */
  _bgsOnSave: null;
  /**
   * Inferred engine backing field.
   *
   * Type: `null | { name: string; pan: number; pitch: number; volume: number }`.
   * Initialized in: {@link Game_System#initialize}.
   * Written in: {@link Game_System#initialize}, {@link Game_System#setDefeatMe}.
   * Read in: {@link Game_System#defeatMe}.
   */
  _defeatMe: null | { name: string; pan: number; pitch: number; volume: number };
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: {@link Game_System#initialize}.
   * Written in: {@link Game_System#disableEncounter}, {@link Game_System#enableEncounter}, {@link Game_System#initialize}.
   * Read in: {@link Game_System#isEncounterEnabled}.
   */
  _encounterEnabled: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Game_System#initialize}.
   * Written in: {@link Game_System#initialize}, {@link Game_System#onBattleEscape}.
   * Read in: {@link Game_System#escapeCount}.
   */
  _escapeCount: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: {@link Game_System#initialize}.
   * Written in: {@link Game_System#disableFormation}, {@link Game_System#enableFormation}, {@link Game_System#initialize}.
   * Read in: {@link Game_System#isFormationEnabled}.
   */
  _formationEnabled: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Game_System#initialize}.
   * Written in: {@link Game_System#initialize}, {@link Game_System#onBeforeSave}.
   * Read in: {@link Game_System#onAfterLoad}.
   */
  _framesOnSave: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: {@link Game_System#initialize}.
   * Written in: {@link Game_System#disableMenu}, {@link Game_System#enableMenu}, {@link Game_System#initialize}.
   * Read in: {@link Game_System#isMenuEnabled}.
   */
  _menuEnabled: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Game_System#initialize}.
   * Written in: {@link Game_System#initialize}, {@link Game_System#onBeforeSave}.
   * Read in: {@link Game_System#saveCount}.
   */
  _saveCount: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: {@link Game_System#initialize}.
   * Written in: {@link Game_System#disableSave}, {@link Game_System#enableSave}, {@link Game_System#initialize}.
   * Read in: {@link Game_System#isSaveEnabled}.
   */
  _saveEnabled: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `null`.
   * Initialized in: {@link Game_System#initialize}.
   * Written in: {@link Game_System#initialize}, {@link Game_System#saveBgm}.
   * Read in: {@link Game_System#replayBgm}.
   */
  _savedBgm: null;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Game_System#initialize}.
   * Written in: {@link Game_System#initialize}, {@link Game_System#setSavefileId}.
   * Read in: {@link Game_System#savefileId}.
   */
  _savefileId: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Game_System#initialize}.
   * Written in: {@link Game_System#initialize}, {@link Game_System#onBeforeSave}.
   * Read in: {@link Game_System#versionId}.
   */
  _versionId: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `null | { name: string; pan: number; pitch: number; volume: number }`.
   * Initialized in: {@link Game_System#initialize}.
   * Written in: {@link Game_System#initialize}, {@link Game_System#setVictoryMe}.
   * Read in: {@link Game_System#victoryMe}.
   */
  _victoryMe: null | { name: string; pan: number; pitch: number; volume: number };
  /**
   * Inferred engine backing field.
   *
   * Type: `null`.
   * Initialized in: {@link Game_System#initialize}.
   * Written in: {@link Game_System#initialize}, {@link Game_System#saveWalkingBgm}, {@link Game_System#saveWalkingBgm2}.
   * Read in: {@link Game_System#replayWalkingBgm}.
   */
  _walkingBgm: null;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Game_System#initialize}.
   * Written in: {@link Game_System#initialize}, {@link Game_System#onBattleWin}.
   * Read in: {@link Game_System#winCount}.
   */
  _winCount: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `null | [number, number, number, number]`.
   * Initialized in: {@link Game_System#initialize}.
   * Written in: {@link Game_System#initialize}, {@link Game_System#setWindowTone}.
   * Read in: {@link Game_System#windowTone}.
   */
  _windowTone: null | [number, number, number, number];
  /**
   * Gets battle bgm.
   * @returns The result.
   */
  battleBgm(): { name: string; pan: number; pitch: number; volume: number };
  /**
   * Gets battle count.
   * @returns The result.
   */
  battleCount(): number;
  /**
   * Gets defeat me.
   * @returns The result.
   */
  defeatMe(): { name: string; pan: number; pitch: number; volume: number };
  /**
   * Performs disable encounter.
   */
  disableEncounter(): void;
  /**
   * Performs disable formation.
   */
  disableFormation(): void;
  /**
   * Performs disable menu.
   */
  disableMenu(): void;
  /**
   * Performs disable save.
   */
  disableSave(): void;
  /**
   * Performs enable encounter.
   */
  enableEncounter(): void;
  /**
   * Performs enable formation.
   */
  enableFormation(): void;
  /**
   * Performs enable menu.
   */
  enableMenu(): void;
  /**
   * Performs enable save.
   */
  enableSave(): void;
  /**
   * Gets escape count.
   * @returns The result.
   */
  escapeCount(): number;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Determines whether autosave enabled.
   * @returns True if autosave enabled; false otherwise.
   */
  isAutosaveEnabled(): boolean;
  /**
   * Determines whether cjk.
   * @returns True if cjk; false otherwise.
   */
  isCJK(): boolean;
  /**
   * Determines whether chinese.
   * @returns True if chinese; false otherwise.
   */
  isChinese(): boolean;
  /**
   * Determines whether encounter enabled.
   * @returns True if encounter enabled; false otherwise.
   */
  isEncounterEnabled(): boolean;
  /**
   * Determines whether formation enabled.
   * @returns True if formation enabled; false otherwise.
   */
  isFormationEnabled(): boolean;
  /**
   * Determines whether japanese.
   * @returns True if japanese; false otherwise.
   */
  isJapanese(): boolean;
  /**
   * Determines whether korean.
   * @returns True if korean; false otherwise.
   */
  isKorean(): boolean;
  /**
   * Determines whether menu enabled.
   * @returns True if menu enabled; false otherwise.
   */
  isMenuEnabled(): boolean;
  /**
   * Determines whether message skip enabled.
   * @returns True if message skip enabled; false otherwise.
   */
  isMessageSkipEnabled(): boolean;
  /**
   * Determines whether russian.
   * @returns True if russian; false otherwise.
   */
  isRussian(): boolean;
  /**
   * Determines whether save enabled.
   * @returns True if save enabled; false otherwise.
   */
  isSaveEnabled(): boolean;
  /**
   * Determines whether side view.
   * @returns True if side view; false otherwise.
   */
  isSideView(): boolean;
  /**
   * Gets main font face.
   * @returns The result.
   */
  mainFontFace(): string;
  /**
   * Gets main font size.
   * @returns The result.
   */
  mainFontSize(): number;
  /**
   * Gets number font face.
   * @returns The result.
   */
  numberFontFace(): string;
  /**
   * Performs on after load.
   */
  onAfterLoad(): void;
  /**
   * Performs on battle escape.
   */
  onBattleEscape(): void;
  /**
   * Performs on battle start.
   */
  onBattleStart(): void;
  /**
   * Performs on battle win.
   */
  onBattleWin(): void;
  /**
   * Performs on before save.
   */
  onBeforeSave(): void;
  /**
   * Gets playtime.
   * @returns The result.
   */
  playtime(): number;
  /**
   * Gets playtime text.
   * @returns The result.
   */
  playtimeText(): string;
  /**
   * Performs replay bgm.
   */
  replayBgm(): void;
  /**
   * Performs replay walking bgm.
   */
  replayWalkingBgm(): void;
  /**
   * Performs save bgm.
   */
  saveBgm(): void;
  /**
   * Gets save count.
   * @returns The result.
   */
  saveCount(): number;
  /**
   * Performs save walking bgm.
   */
  saveWalkingBgm(): void;
  /**
   * Performs save walking bgm2.
   */
  saveWalkingBgm2(): void;
  /**
   * Gets savefile id.
   * @returns The result.
   */
  savefileId(): number;
  /**
   * Sets battle bgm.
   * @param value The value parameter.
   */
  setBattleBgm(value: { name: string; pan: number; pitch: number; volume: number }): void;
  /**
   * Sets defeat me.
   * @param value The value parameter.
   */
  setDefeatMe(value: { name: string; pan: number; pitch: number; volume: number }): void;
  /**
   * Sets savefile id.
   * @param savefileId The savefileId parameter.
   */
  setSavefileId(savefileId: number): void;
  /**
   * Sets victory me.
   * @param value The value parameter.
   */
  setVictoryMe(value: { name: string; pan: number; pitch: number; volume: number }): void;
  /**
   * Sets window tone.
   * @param value The value parameter.
   */
  setWindowTone(value: [number, number, number, number]): void;
  /**
   * Gets version id.
   * @returns The result.
   */
  versionId(): number;
  /**
   * Gets victory me.
   * @returns The result.
   */
  victoryMe(): { name: string; pan: number; pitch: number; volume: number };
  /**
   * Gets win count.
   * @returns The result.
   */
  winCount(): number;
  /**
   * Gets window opacity.
   * @returns The result.
   */
  windowOpacity(): number;
  /**
   * Gets window padding.
   * @returns The result.
   */
  windowPadding(): number;
  /**
   * Gets window tone.
   * @returns The result.
   */
  windowTone(): [number, number, number, number];
}
