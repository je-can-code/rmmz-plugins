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
   * Inferred engine backing field.
   *
   * Type: `unknown`.
   * Initialized in: none.
   * Written in: {@link Utils#setEncryptionInfo}.
   * Read in: {@link Utils#decryptArrayBuffer}.
   */
  _encryptionKey: unknown;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown`.
   * Initialized in: none.
   * Written in: {@link Utils#setEncryptionInfo}.
   * Read in: {@link Utils#hasEncryptedAudio}.
   */
  _hasEncryptedAudio: unknown;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown`.
   * Initialized in: none.
   * Written in: {@link Utils#setEncryptionInfo}.
   * Read in: {@link Utils#hasEncryptedImages}.
   */
  _hasEncryptedImages: unknown;
}
declare function Utils(): never;
declare namespace Utils
{
  /**
   * Checks whether the browser can play ogg files.
   * @returns True if play ogg; false otherwise.
   */
  function canPlayOgg(): boolean;
  /**
   * Checks whether the browser can play webm files.
   * @returns True if play webm; false otherwise.
   */
  function canPlayWebm(): boolean;
  /**
   * Checks whether the browser supports CSS Font Loading.
   * @returns True if use css font loading; false otherwise.
   */
  function canUseCssFontLoading(): boolean;
  /**
   * Checks whether the browser supports IndexedDB.
   * @returns True if use indexed db; false otherwise.
   */
  function canUseIndexedDB(): boolean;
  /**
   * Checks whether the browser supports Web Audio API.
   * @returns True if use web audio api; false otherwise.
   */
  function canUseWebAudioAPI(): boolean;
  /**
   * Checks whether the browser supports WebGL.
   * @returns True if use web gl; false otherwise.
   */
  function canUseWebGL(): boolean;
  /**
   * Checks whether the current RPG Maker version is greater than or equal to the given version.
   * @param version The "x.x.x" format string to compare.
   * @returns The result.
   */
  function checkRMVersion(version: string): boolean;
  /**
   * Checks whether the string contains any Arabic characters.
   * @param str The str parameter.
   * @returns The result.
   */
  function containsArabic(str: string): boolean;
  /**
   * Decrypts encrypted data.
   * @param source The data to be decrypted.
   * @returns The result.
   */
  function decryptArrayBuffer(source: ArrayBuffer): ArrayBuffer;
  /**
   * Encodes a URI component without escaping slash characters.
   * @param str The input string.
   * @returns The result.
   */
  function encodeURI(str: string): string;
  /**
   * Escapes special characters for HTML.
   * @param str The input string.
   * @returns The result.
   */
  function escapeHtml(str: string): string;
  /**
   * Gets the filename that does not include subfolders.
   * @param filename The filename with subfolders.
   * @returns The result.
   */
  function extractFileName(filename: string): string;
  /**
   * Checks whether the audio files in the game are encrypted.
   * @returns True if encrypted audio; false otherwise.
   */
  function hasEncryptedAudio(): boolean;
  /**
   * Checks whether the image files in the game are encrypted.
   * @returns True if encrypted images; false otherwise.
   */
  function hasEncryptedImages(): boolean;
  /**
   * Checks whether the browser is Android Chrome.
   * @returns True if android chrome; false otherwise.
   */
  function isAndroidChrome(): boolean;
  /**
   * Checks whether the browser is accessing local files.
   * @returns True if local; false otherwise.
   */
  function isLocal(): boolean;
  /**
   * Checks whether the platform is a mobile device.
   * @returns True if mobile device; false otherwise.
   */
  function isMobileDevice(): boolean;
  /**
   * Checks whether the browser is Mobile Safari.
   * @returns True if mobile safari; false otherwise.
   */
  function isMobileSafari(): boolean;
  /**
   * Checks whether the platform is NW.js.
   * @returns True if nwjs; false otherwise.
   */
  function isNwjs(): boolean;
  /**
   * Checks whether the option is in the query string.
   * @param name The option name.
   * @returns True if option valid; false otherwise.
   */
  function isOptionValid(name: string): boolean;
  /**
   * Sets information related to encryption.
   * @param hasImages Whether the image files are encrypted.
   * @param hasAudio Whether the audio files are encrypted.
   * @param key The encryption key.
   */
  function setEncryptionInfo(hasImages: boolean, hasAudio: boolean, key: string): void;
  /**
   * Engine static constant.
   */
  const RPGMAKER_NAME: "MZ";
  /**
   * Engine static constant.
   */
  const RPGMAKER_VERSION: "1.10.0";
}
