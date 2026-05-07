/**
 * Generated from project/js/rmmz_managers.js
 * Class: ImageManager
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface ImageManager
{
  /**
   * Inferred engine backing field.
   *
   * Type: `object`.
   * Initialized in: module init.
   * Written in: module init, {@link ImageManager#clear}.
   * Read in: {@link ImageManager#clear}, {@link ImageManager#isReady}, {@link ImageManager#loadBitmapFromUrl}.
   */
  _cache: object;
  /**
   * Inferred engine backing field.
   *
   * Type: `Bitmap`.
   * Initialized in: module init.
   * Written in: module init.
   * Read in: {@link ImageManager#loadBitmap}.
   */
  _emptyBitmap: Bitmap;
  /**
   * Inferred engine backing field.
   *
   * Type: `object`.
   * Initialized in: module init.
   * Written in: module init.
   * Read in: {@link ImageManager#isReady}, {@link ImageManager#loadBitmapFromUrl}.
   */
  _system: object;
}
declare function ImageManager(): never;
declare namespace ImageManager
{
  /**
   * Performs clear.
   */
  function clear(): void;
  /**
   * Gets face size.
   * @returns The result.
   */
  function getFaceSize(): number;
  /**
   * Gets icon size.
   * @returns The result.
   */
  function getIconSize(): number;
  /**
   * Determines whether big character.
   * @param filename The filename parameter.
   * @returns True if big character; false otherwise.
   */
  function isBigCharacter(filename: string): boolean;
  /**
   * Determines whether object character.
   * @param filename The filename parameter.
   * @returns True if object character; false otherwise.
   */
  function isObjectCharacter(filename: string): boolean;
  /**
   * Determines whether ready.
   * @returns True if ready; false otherwise.
   */
  function isReady(): boolean;
  /**
   * Determines whether zero parallax.
   * @param filename The filename parameter.
   * @returns True if zero parallax; false otherwise.
   */
  function isZeroParallax(filename: string): boolean;
  /**
   * Gets load animation.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function loadAnimation(filename: string): Bitmap;
  /**
   * Gets load battleback1.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function loadBattleback1(filename: string): Bitmap;
  /**
   * Gets load battleback2.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function loadBattleback2(filename: string): Bitmap;
  /**
   * Gets load bitmap.
   * @param folder The folder parameter.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function loadBitmap(folder: string, filename: string): Bitmap;
  /**
   * Gets load bitmap from url.
   * @param url The url parameter.
   * @returns The result.
   */
  function loadBitmapFromUrl(url: string): Bitmap;
  /**
   * Gets load character.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function loadCharacter(filename: string): Bitmap;
  /**
   * Gets load enemy.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function loadEnemy(filename: string): Bitmap;
  /**
   * Gets load face.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function loadFace(filename: string): Bitmap;
  /**
   * Gets load parallax.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function loadParallax(filename: string): Bitmap;
  /**
   * Gets load picture.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function loadPicture(filename: string): Bitmap;
  /**
   * Gets load sv actor.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function loadSvActor(filename: string): Bitmap;
  /**
   * Gets load sv enemy.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function loadSvEnemy(filename: string): Bitmap;
  /**
   * Gets load system.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function loadSystem(filename: string): Bitmap;
  /**
   * Gets load tileset.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function loadTileset(filename: string): Bitmap;
  /**
   * Gets load title1.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function loadTitle1(filename: string): Bitmap;
  /**
   * Gets load title2.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function loadTitle2(filename: string): Bitmap;
  /**
   * Performs throw load error.
   * @param bitmap The bitmap parameter.
   */
  function throwLoadError(bitmap: Bitmap): void;
  const standardFaceHeight: 144;
  const standardFaceWidth: 144;
  const standardIconHeight: 32;
  const standardIconWidth: 32;
}
