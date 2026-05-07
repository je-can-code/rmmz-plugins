/**
 * Generated from project/js/rmmz_core.js
 * Class: Utils
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Utils
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _encryptionKey: unknown;
  _hasEncryptedAudio: unknown;
  _hasEncryptedImages: unknown;
}
declare function Utils(): never;
declare namespace Utils
{
  /**
   * Checks whether the browser can play ogg files.
   */
  function canPlayOgg(): boolean;
  /**
   * Checks whether the browser can play webm files.
   */
  function canPlayWebm(): boolean;
  /**
   * Checks whether the browser supports CSS Font Loading.
   */
  function canUseCssFontLoading(): boolean;
  /**
   * Checks whether the browser supports IndexedDB.
   */
  function canUseIndexedDB(): boolean;
  /**
   * Checks whether the browser supports Web Audio API.
   */
  function canUseWebAudioAPI(): boolean;
  /**
   * Checks whether the browser supports WebGL.
   */
  function canUseWebGL(): boolean;
  /**
   * Checks whether the current RPG Maker version is greater than or equal to the given version.
   * @param version The "x.x.x" format string to compare.
   */
  function checkRMVersion(version: string): boolean;
  /**
   * Checks whether the string contains any Arabic characters.
   */
  function containsArabic(str: string): boolean;
  /**
   * Decrypts encrypted data.
   * @param source The data to be decrypted.
   */
  function decryptArrayBuffer(source: ArrayBuffer): ArrayBuffer;
  /**
   * Encodes a URI component without escaping slash characters.
   * @param str The input string.
   */
  function encodeURI(str: string): string;
  /**
   * Escapes special characters for HTML.
   * @param str The input string.
   */
  function escapeHtml(str: string): string;
  /**
   * Gets the filename that does not include subfolders.
   * @param filename The filename with subfolders.
   */
  function extractFileName(filename: string): string;
  /**
   * Checks whether the audio files in the game are encrypted.
   */
  function hasEncryptedAudio(): boolean;
  /**
   * Checks whether the image files in the game are encrypted.
   */
  function hasEncryptedImages(): boolean;
  /**
   * Checks whether the browser is Android Chrome.
   */
  function isAndroidChrome(): boolean;
  /**
   * Checks whether the browser is accessing local files.
   */
  function isLocal(): boolean;
  /**
   * Checks whether the platform is a mobile device.
   */
  function isMobileDevice(): boolean;
  /**
   * Checks whether the browser is Mobile Safari.
   */
  function isMobileSafari(): boolean;
  /**
   * Checks whether the platform is NW.js.
   */
  function isNwjs(): boolean;
  /**
   * Checks whether the option is in the query string.
   * @param name The option name.
   */
  function isOptionValid(name: string): boolean;
  /**
   * Sets information related to encryption.
   * @param hasImages Whether the image files are encrypted.
   * @param hasAudio Whether the audio files are encrypted.
   * @param key The encryption key.
   */
  function setEncryptionInfo(hasImages: boolean, hasAudio: boolean, key: string): void;
  const RPGMAKER_NAME: "MZ";
  const RPGMAKER_VERSION: "1.10.0";
}
