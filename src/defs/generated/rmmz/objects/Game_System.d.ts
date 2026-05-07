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
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: {@link Game_System#initialize}.<br/>
   * Written in: {@link Game_System#initialize}, {@link Game_System#setBattleBgm}.<br/>
   * Read in: {@link Game_System#battleBgm}.<br/>
   */
  _battleBgm: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Game_System#initialize}.<br/>
   * Written in: {@link Game_System#initialize}, {@link Game_System#onBattleStart}.<br/>
   * Read in: {@link Game_System#battleCount}.<br/>
   */
  _battleCount: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: {@link Game_System#initialize}.<br/>
   * Written in: {@link Game_System#initialize}, {@link Game_System#onBeforeSave}.<br/>
   * Read in: {@link Game_System#onAfterLoad}.<br/>
   */
  _bgmOnSave: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: {@link Game_System#initialize}.<br/>
   * Written in: {@link Game_System#initialize}, {@link Game_System#onBeforeSave}.<br/>
   * Read in: {@link Game_System#onAfterLoad}.<br/>
   */
  _bgsOnSave: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: {@link Game_System#initialize}.<br/>
   * Written in: {@link Game_System#initialize}, {@link Game_System#setDefeatMe}.<br/>
   * Read in: {@link Game_System#defeatMe}.<br/>
   */
  _defeatMe: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link Game_System#initialize}.<br/>
   * Written in: {@link Game_System#disableEncounter}, {@link Game_System#enableEncounter}, {@link Game_System#initialize}.<br/>
   * Read in: {@link Game_System#isEncounterEnabled}.<br/>
   */
  _encounterEnabled: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Game_System#initialize}.<br/>
   * Written in: {@link Game_System#initialize}, {@link Game_System#onBattleEscape}.<br/>
   * Read in: {@link Game_System#escapeCount}.<br/>
   */
  _escapeCount: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link Game_System#initialize}.<br/>
   * Written in: {@link Game_System#disableFormation}, {@link Game_System#enableFormation}, {@link Game_System#initialize}.<br/>
   * Read in: {@link Game_System#isFormationEnabled}.<br/>
   */
  _formationEnabled: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Game_System#initialize}.<br/>
   * Written in: {@link Game_System#initialize}, {@link Game_System#onBeforeSave}.<br/>
   * Read in: {@link Game_System#onAfterLoad}.<br/>
   */
  _framesOnSave: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link Game_System#initialize}.<br/>
   * Written in: {@link Game_System#disableMenu}, {@link Game_System#enableMenu}, {@link Game_System#initialize}.<br/>
   * Read in: {@link Game_System#isMenuEnabled}.<br/>
   */
  _menuEnabled: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Game_System#initialize}.<br/>
   * Written in: {@link Game_System#initialize}, {@link Game_System#onBeforeSave}.<br/>
   * Read in: {@link Game_System#saveCount}.<br/>
   */
  _saveCount: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link Game_System#initialize}.<br/>
   * Written in: {@link Game_System#disableSave}, {@link Game_System#enableSave}, {@link Game_System#initialize}.<br/>
   * Read in: {@link Game_System#isSaveEnabled}.<br/>
   */
  _saveEnabled: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: {@link Game_System#initialize}.<br/>
   * Written in: {@link Game_System#initialize}, {@link Game_System#saveBgm}.<br/>
   * Read in: {@link Game_System#replayBgm}.<br/>
   */
  _savedBgm: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Game_System#initialize}.<br/>
   * Written in: {@link Game_System#initialize}, {@link Game_System#setSavefileId}.<br/>
   * Read in: {@link Game_System#savefileId}.<br/>
   */
  _savefileId: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Game_System#initialize}.<br/>
   * Written in: {@link Game_System#initialize}, {@link Game_System#onBeforeSave}.<br/>
   * Read in: {@link Game_System#versionId}.<br/>
   */
  _versionId: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: {@link Game_System#initialize}.<br/>
   * Written in: {@link Game_System#initialize}, {@link Game_System#setVictoryMe}.<br/>
   * Read in: {@link Game_System#victoryMe}.<br/>
   */
  _victoryMe: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: {@link Game_System#initialize}.<br/>
   * Written in: {@link Game_System#initialize}, {@link Game_System#saveWalkingBgm}, {@link Game_System#saveWalkingBgm2}.<br/>
   * Read in: {@link Game_System#replayWalkingBgm}.<br/>
   */
  _walkingBgm: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Game_System#initialize}.<br/>
   * Written in: {@link Game_System#initialize}, {@link Game_System#onBattleWin}.<br/>
   * Read in: {@link Game_System#winCount}.<br/>
   */
  _winCount: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: {@link Game_System#initialize}.<br/>
   * Written in: {@link Game_System#initialize}, {@link Game_System#setWindowTone}.<br/>
   * Read in: {@link Game_System#windowTone}.<br/>
   */
  _windowTone: null;
  /**
   * Gets battle bgm.
   * @returns The result.
   */
  battleBgm(): unknown;
  /**
   * Gets battle count.
   * @returns The result.
   */
  battleCount(): unknown;
  /**
   * Gets defeat me.
   * @returns The result.
   */
  defeatMe(): unknown;
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
  escapeCount(): unknown;
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
  mainFontSize(): unknown;
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
  playtime(): unknown;
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
  saveCount(): unknown;
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
  setBattleBgm(value: unknown): void;
  /**
   * Sets defeat me.
   * @param value The value parameter.
   */
  setDefeatMe(value: unknown): void;
  /**
   * Sets savefile id.
   * @param savefileId The savefileId parameter.
   */
  setSavefileId(savefileId: unknown): void;
  /**
   * Sets victory me.
   * @param value The value parameter.
   */
  setVictoryMe(value: unknown): void;
  /**
   * Sets window tone.
   * @param value The value parameter.
   */
  setWindowTone(value: unknown): void;
  /**
   * Gets version id.
   * @returns The result.
   */
  versionId(): unknown;
  /**
   * Gets victory me.
   * @returns The result.
   */
  victoryMe(): unknown;
  /**
   * Gets win count.
   * @returns The result.
   */
  winCount(): unknown;
  /**
   * Gets window opacity.
   * @returns The result.
   */
  windowOpacity(): unknown;
  /**
   * Gets window padding.
   * @returns The result.
   */
  windowPadding(): number;
  /**
   * Gets window tone.
   * @returns The result.
   */
  windowTone(): unknown;
}
