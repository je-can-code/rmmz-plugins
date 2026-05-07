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
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _bgmBuffer: null;
  _bgmVolume: number;
  _bgsBuffer: null;
  _bgsVolume: number;
  _currentBgm: null | object;
  _currentBgs: null | object;
  _meBuffer: null;
  _meVolume: number;
  _path: "audio/";
  _replayFadeTime: number;
  _seBuffers: unknown[];
  _seVolume: number;
  _staticBuffers: unknown[];
}
declare function AudioManager(): never;
declare namespace AudioManager
{
  function audioFileExt(): string;
  function checkErrors(): void;
  function cleanupSe(): void;
  function createBuffer(folder: string, name: string): WebAudio;
  function fadeInBgm(duration: number): void;
  function fadeInBgs(duration: number): void;
  function fadeOutBgm(duration: number): void;
  function fadeOutBgs(duration: number): void;
  function fadeOutMe(duration: number): void;
  function isCurrentBgm(bgm: object): boolean;
  function isCurrentBgs(bgs: object): boolean;
  function isStaticSe(se: object): boolean;
  function loadStaticSe(se: object): void;
  function makeEmptyAudioObject(): object;
  function playBgm(bgm: object, pos: number): void;
  function playBgs(bgs: object, pos: number): void;
  function playMe(me: object): void;
  function playSe(se: object): void;
  function playStaticSe(se: object): void;
  function replayBgm(bgm: object): void;
  function replayBgs(bgs: object): void;
  function saveBgm(): object;
  function saveBgs(): object;
  function stopAll(): void;
  function stopBgm(): void;
  function stopBgs(): void;
  function stopMe(): void;
  function stopSe(): void;
  function throwLoadError(webAudio: WebAudio): void;
  function updateBgmParameters(bgm: object): void;
  function updateBgsParameters(bgs: object): void;
  function updateBufferParameters(buffer: WebAudio, configVolume: number, audio: object): void;
  function updateCurrentBgm(bgm: object, pos: number): void;
  function updateCurrentBgs(bgs: object, pos: number): void;
  function updateMeParameters(me: object): void;
  function updateSeParameters(buffer: WebAudio, se: object): void;
}
