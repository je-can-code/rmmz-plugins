/**
 * Generated from project/js/rmmz_managers.js
 * Class: AudioManager
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface AudioManager
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init, {@link AudioManager#playBgm}, {@link AudioManager#stopBgm}.<br/>
   * Read in: {@link AudioManager#checkErrors}, {@link AudioManager#fadeInBgm}, {@link AudioManager#fadeOutBgm}, {@link AudioManager#isCurrentBgm}, {@link AudioManager#playBgm}, {@link AudioManager#playMe}, {@link AudioManager#replayBgm}, {@link AudioManager#saveBgm}, {@link AudioManager#stopBgm}, {@link AudioManager#stopMe}, {@link AudioManager#updateBgmParameters}.<br/>
   */
  _bgmBuffer: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init.<br/>
   * Read in: {@link AudioManager#updateBgmParameters}.<br/>
   */
  _bgmVolume: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init, {@link AudioManager#playBgs}, {@link AudioManager#stopBgs}.<br/>
   * Read in: {@link AudioManager#checkErrors}, {@link AudioManager#fadeInBgs}, {@link AudioManager#fadeOutBgs}, {@link AudioManager#isCurrentBgs}, {@link AudioManager#playBgs}, {@link AudioManager#replayBgs}, {@link AudioManager#saveBgs}, {@link AudioManager#stopBgs}, {@link AudioManager#updateBgsParameters}.<br/>
   */
  _bgsBuffer: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init.<br/>
   * Read in: {@link AudioManager#updateBgsParameters}.<br/>
   */
  _bgsVolume: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | object`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init, {@link AudioManager#fadeOutBgm}, {@link AudioManager#stopBgm}, {@link AudioManager#updateCurrentBgm}.<br/>
   * Read in: {@link AudioManager#fadeInBgm}, {@link AudioManager#fadeOutBgm}, {@link AudioManager#isCurrentBgm}, {@link AudioManager#playMe}, {@link AudioManager#saveBgm}, {@link AudioManager#stopMe}.<br/>
   */
  _currentBgm: null | object;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | object`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init, {@link AudioManager#fadeOutBgs}, {@link AudioManager#stopBgs}, {@link AudioManager#updateCurrentBgs}.<br/>
   * Read in: {@link AudioManager#fadeInBgs}, {@link AudioManager#fadeOutBgs}, {@link AudioManager#isCurrentBgs}, {@link AudioManager#saveBgs}.<br/>
   */
  _currentBgs: null | object;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init, {@link AudioManager#playMe}, {@link AudioManager#stopMe}.<br/>
   * Read in: {@link AudioManager#checkErrors}, {@link AudioManager#fadeOutMe}, {@link AudioManager#playBgm}, {@link AudioManager#playMe}, {@link AudioManager#stopMe}, {@link AudioManager#updateMeParameters}.<br/>
   */
  _meBuffer: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init.<br/>
   * Read in: {@link AudioManager#updateMeParameters}.<br/>
   */
  _meVolume: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `"audio/"`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init.<br/>
   * Read in: {@link AudioManager#createBuffer}.<br/>
   */
  _path: "audio/";
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init.<br/>
   * Read in: {@link AudioManager#replayBgm}, {@link AudioManager#replayBgs}, {@link AudioManager#stopMe}.<br/>
   */
  _replayFadeTime: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init, {@link AudioManager#cleanupSe}, {@link AudioManager#stopSe}.<br/>
   * Read in: {@link AudioManager#checkErrors}, {@link AudioManager#cleanupSe}, {@link AudioManager#playSe}, {@link AudioManager#stopSe}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `push()`: {@link AudioManager#playSe}.<br/>
   */
  _seBuffers: unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init.<br/>
   * Read in: {@link AudioManager#updateSeParameters}.<br/>
   */
  _seVolume: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init.<br/>
   * Read in: {@link AudioManager#checkErrors}, {@link AudioManager#isStaticSe}, {@link AudioManager#loadStaticSe}, {@link AudioManager#playStaticSe}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `push()`: {@link AudioManager#loadStaticSe}.<br/>
   */
  _staticBuffers: unknown[];
}
declare function AudioManager(): never;
declare namespace AudioManager
{
  /**
   * Gets audio file ext.
   * @returns The result.
   */
  function audioFileExt(): string;
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
   * Performs check errors.
   */
  function checkErrors(): void;
  /**
   * Performs cleanup se.
   */
  function cleanupSe(): void;
  /**
   * Creates buffer.
   * @param folder The folder parameter.
   * @param name The name parameter.
   * @returns The result.
   */
  function createBuffer(folder: unknown, name: unknown): unknown;
  /**
   * Performs fade in bgm.
   * @param duration The duration parameter.
   */
  function fadeInBgm(duration: unknown): void;
  /**
   * Performs fade in bgs.
   * @param duration The duration parameter.
   */
  function fadeInBgs(duration: unknown): void;
  /**
   * Performs fade out bgm.
   * @param duration The duration parameter.
   */
  function fadeOutBgm(duration: unknown): void;
  /**
   * Performs fade out bgs.
   * @param duration The duration parameter.
   */
  function fadeOutBgs(duration: unknown): void;
  /**
   * Performs fade out me.
   * @param duration The duration parameter.
   */
  function fadeOutMe(duration: unknown): void;
  /**
   * Determines whether current bgm.
   * @param bgm The bgm parameter.
   * @returns True if current bgm; false otherwise.
   */
  function isCurrentBgm(bgm: unknown): boolean;
  /**
   * Determines whether current bgs.
   * @param bgs The bgs parameter.
   * @returns True if current bgs; false otherwise.
   */
  function isCurrentBgs(bgs: unknown): boolean;
  /**
   * Determines whether static se.
   * @param se The se parameter.
   * @returns True if static se; false otherwise.
   */
  function isStaticSe(se: unknown): boolean;
  /**
   * Performs load static se.
   * @param se The se parameter.
   */
  function loadStaticSe(se: unknown): void;
  /**
   * Creates empty audio object.
   * @returns The result.
   */
  function makeEmptyAudioObject(): object;
  /**
   * Gets me volume.
   * @returns The result.
   */
  get meVolume(): unknown;
  /**
   * Performs play bgm.
   * @param bgm The bgm parameter.
   * @param pos The pos parameter.
   */
  function playBgm(bgm: unknown, pos: unknown): void;
  /**
   * Performs play bgs.
   * @param bgs The bgs parameter.
   * @param pos The pos parameter.
   */
  function playBgs(bgs: unknown, pos: unknown): void;
  /**
   * Performs play me.
   * @param me The me parameter.
   */
  function playMe(me: unknown): void;
  /**
   * Performs play se.
   * @param se The se parameter.
   */
  function playSe(se: unknown): void;
  /**
   * Performs play static se.
   * @param se The se parameter.
   */
  function playStaticSe(se: unknown): void;
  /**
   * Performs replay bgm.
   * @param bgm The bgm parameter.
   */
  function replayBgm(bgm: unknown): void;
  /**
   * Performs replay bgs.
   * @param bgs The bgs parameter.
   */
  function replayBgs(bgs: unknown): void;
  /**
   * Gets save bgm.
   * @returns The result.
   */
  function saveBgm(): object;
  /**
   * Gets save bgs.
   * @returns The result.
   */
  function saveBgs(): object;
  /**
   * Gets se volume.
   * @returns The result.
   */
  get seVolume(): unknown;
  /**
   * Performs stop all.
   */
  function stopAll(): void;
  /**
   * Performs stop bgm.
   */
  function stopBgm(): void;
  /**
   * Performs stop bgs.
   */
  function stopBgs(): void;
  /**
   * Performs stop me.
   */
  function stopMe(): void;
  /**
   * Performs stop se.
   */
  function stopSe(): void;
  /**
   * Performs throw load error.
   * @param webAudio The webAudio parameter.
   */
  function throwLoadError(webAudio: unknown): void;
  /**
   * Updates bgm parameters.
   * @param bgm The bgm parameter.
   */
  function updateBgmParameters(bgm: unknown): void;
  /**
   * Updates bgs parameters.
   * @param bgs The bgs parameter.
   */
  function updateBgsParameters(bgs: unknown): void;
  /**
   * Updates buffer parameters.
   * @param buffer The buffer parameter.
   * @param configVolume The configVolume parameter.
   * @param audio The audio parameter.
   */
  function updateBufferParameters(buffer: unknown, configVolume: unknown, audio: unknown): void;
  /**
   * Updates current bgm.
   * @param bgm The bgm parameter.
   * @param pos The pos parameter.
   */
  function updateCurrentBgm(bgm: unknown, pos: unknown): void;
  /**
   * Updates current bgs.
   * @param bgs The bgs parameter.
   * @param pos The pos parameter.
   */
  function updateCurrentBgs(bgs: unknown, pos: unknown): void;
  /**
   * Updates me parameters.
   * @param me The me parameter.
   */
  function updateMeParameters(me: unknown): void;
  /**
   * Updates se parameters.
   * @param buffer The buffer parameter.
   * @param se The se parameter.
   */
  function updateSeParameters(buffer: unknown, se: unknown): void;
}
