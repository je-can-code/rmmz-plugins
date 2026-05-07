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
   * Inferred engine backing field.
   *
   * Type: `null`.
   * Initialized in: module init.
   * Written in: module init, {@link AudioManager#playBgm}, {@link AudioManager#stopBgm}.
   * Read in: {@link AudioManager#checkErrors}, {@link AudioManager#fadeInBgm}, {@link AudioManager#fadeOutBgm}, {@link AudioManager#isCurrentBgm}, {@link AudioManager#playBgm}, {@link AudioManager#playMe}, {@link AudioManager#replayBgm}, {@link AudioManager#saveBgm}, {@link AudioManager#stopBgm}, {@link AudioManager#stopMe}, {@link AudioManager#updateBgmParameters}.
   */
  _bgmBuffer: null;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: module init.
   * Written in: module init.
   * Read in: {@link AudioManager#updateBgmParameters}.
   */
  _bgmVolume: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `null`.
   * Initialized in: module init.
   * Written in: module init, {@link AudioManager#playBgs}, {@link AudioManager#stopBgs}.
   * Read in: {@link AudioManager#checkErrors}, {@link AudioManager#fadeInBgs}, {@link AudioManager#fadeOutBgs}, {@link AudioManager#isCurrentBgs}, {@link AudioManager#playBgs}, {@link AudioManager#replayBgs}, {@link AudioManager#saveBgs}, {@link AudioManager#stopBgs}, {@link AudioManager#updateBgsParameters}.
   */
  _bgsBuffer: null;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: module init.
   * Written in: module init.
   * Read in: {@link AudioManager#updateBgsParameters}.
   */
  _bgsVolume: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `null | object`.
   * Initialized in: module init.
   * Written in: module init, {@link AudioManager#fadeOutBgm}, {@link AudioManager#stopBgm}, {@link AudioManager#updateCurrentBgm}.
   * Read in: {@link AudioManager#fadeInBgm}, {@link AudioManager#fadeOutBgm}, {@link AudioManager#isCurrentBgm}, {@link AudioManager#playMe}, {@link AudioManager#saveBgm}, {@link AudioManager#stopMe}.
   */
  _currentBgm: null | object;
  /**
   * Inferred engine backing field.
   *
   * Type: `null | object`.
   * Initialized in: module init.
   * Written in: module init, {@link AudioManager#fadeOutBgs}, {@link AudioManager#stopBgs}, {@link AudioManager#updateCurrentBgs}.
   * Read in: {@link AudioManager#fadeInBgs}, {@link AudioManager#fadeOutBgs}, {@link AudioManager#isCurrentBgs}, {@link AudioManager#saveBgs}.
   */
  _currentBgs: null | object;
  /**
   * Inferred engine backing field.
   *
   * Type: `null`.
   * Initialized in: module init.
   * Written in: module init, {@link AudioManager#playMe}, {@link AudioManager#stopMe}.
   * Read in: {@link AudioManager#checkErrors}, {@link AudioManager#fadeOutMe}, {@link AudioManager#playBgm}, {@link AudioManager#playMe}, {@link AudioManager#stopMe}, {@link AudioManager#updateMeParameters}.
   */
  _meBuffer: null;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: module init.
   * Written in: module init.
   * Read in: {@link AudioManager#updateMeParameters}.
   */
  _meVolume: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `"audio/"`.
   * Initialized in: module init.
   * Written in: module init.
   * Read in: {@link AudioManager#createBuffer}.
   */
  _path: "audio/";
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: module init.
   * Written in: module init.
   * Read in: {@link AudioManager#replayBgm}, {@link AudioManager#replayBgs}, {@link AudioManager#stopMe}.
   */
  _replayFadeTime: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown[]`.
   * Initialized in: module init.
   * Written in: module init, {@link AudioManager#cleanupSe}, {@link AudioManager#stopSe}.
   * Read in: {@link AudioManager#checkErrors}, {@link AudioManager#cleanupSe}, {@link AudioManager#playSe}, {@link AudioManager#stopSe}.
   *
   * Consumed by:
   * - `push()`: {@link AudioManager#playSe}.
   */
  _seBuffers: unknown[];
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: module init.
   * Written in: module init.
   * Read in: {@link AudioManager#updateSeParameters}.
   */
  _seVolume: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown[]`.
   * Initialized in: module init.
   * Written in: module init.
   * Read in: {@link AudioManager#checkErrors}, {@link AudioManager#isStaticSe}, {@link AudioManager#loadStaticSe}, {@link AudioManager#playStaticSe}.
   *
   * Consumed by:
   * - `push()`: {@link AudioManager#loadStaticSe}.
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
  function createBuffer(folder: string, name: string): WebAudio;
  /**
   * Performs fade in bgm.
   * @param duration The duration parameter.
   */
  function fadeInBgm(duration: number): void;
  /**
   * Performs fade in bgs.
   * @param duration The duration parameter.
   */
  function fadeInBgs(duration: number): void;
  /**
   * Performs fade out bgm.
   * @param duration The duration parameter.
   */
  function fadeOutBgm(duration: number): void;
  /**
   * Performs fade out bgs.
   * @param duration The duration parameter.
   */
  function fadeOutBgs(duration: number): void;
  /**
   * Performs fade out me.
   * @param duration The duration parameter.
   */
  function fadeOutMe(duration: number): void;
  /**
   * Determines whether current bgm.
   * @param bgm The bgm parameter.
   * @returns True if current bgm; false otherwise.
   */
  function isCurrentBgm(bgm: object): boolean;
  /**
   * Determines whether current bgs.
   * @param bgs The bgs parameter.
   * @returns True if current bgs; false otherwise.
   */
  function isCurrentBgs(bgs: object): boolean;
  /**
   * Determines whether static se.
   * @param se The se parameter.
   * @returns True if static se; false otherwise.
   */
  function isStaticSe(se: object): boolean;
  /**
   * Performs load static se.
   * @param se The se parameter.
   */
  function loadStaticSe(se: object): void;
  /**
   * Creates empty audio object.
   * @returns The result.
   */
  function makeEmptyAudioObject(): object;
  /**
   * Performs play bgm.
   * @param bgm The bgm parameter.
   * @param pos The pos parameter.
   */
  function playBgm(bgm: object, pos: number): void;
  /**
   * Performs play bgs.
   * @param bgs The bgs parameter.
   * @param pos The pos parameter.
   */
  function playBgs(bgs: object, pos: number): void;
  /**
   * Performs play me.
   * @param me The me parameter.
   */
  function playMe(me: object): void;
  /**
   * Performs play se.
   * @param se The se parameter.
   */
  function playSe(se: object): void;
  /**
   * Performs play static se.
   * @param se The se parameter.
   */
  function playStaticSe(se: object): void;
  /**
   * Performs replay bgm.
   * @param bgm The bgm parameter.
   */
  function replayBgm(bgm: object): void;
  /**
   * Performs replay bgs.
   * @param bgs The bgs parameter.
   */
  function replayBgs(bgs: object): void;
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
  function throwLoadError(webAudio: WebAudio): void;
  /**
   * Updates bgm parameters.
   * @param bgm The bgm parameter.
   */
  function updateBgmParameters(bgm: object): void;
  /**
   * Updates bgs parameters.
   * @param bgs The bgs parameter.
   */
  function updateBgsParameters(bgs: object): void;
  /**
   * Updates buffer parameters.
   * @param buffer The buffer parameter.
   * @param configVolume The configVolume parameter.
   * @param audio The audio parameter.
   */
  function updateBufferParameters(buffer: WebAudio, configVolume: number, audio: object): void;
  /**
   * Updates current bgm.
   * @param bgm The bgm parameter.
   * @param pos The pos parameter.
   */
  function updateCurrentBgm(bgm: object, pos: number): void;
  /**
   * Updates current bgs.
   * @param bgs The bgs parameter.
   * @param pos The pos parameter.
   */
  function updateCurrentBgs(bgs: object, pos: number): void;
  /**
   * Updates me parameters.
   * @param me The me parameter.
   */
  function updateMeParameters(me: object): void;
  /**
   * Updates se parameters.
   * @param buffer The buffer parameter.
   * @param se The se parameter.
   */
  function updateSeParameters(buffer: WebAudio, se: object): void;
}
