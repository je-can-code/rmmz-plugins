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
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `object`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init, {@link ImageManager#clear}.<br/>
   * Read in: {@link ImageManager#clear}, {@link ImageManager#isReady}, {@link ImageManager#loadBitmapFromUrl}.<br/>
   */
  _cache: object;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Bitmap`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init.<br/>
   * Read in: {@link ImageManager#loadBitmap}.<br/>
   */
  _emptyBitmap: Bitmap;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `object`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init.<br/>
   * Read in: {@link ImageManager#isReady}, {@link ImageManager#loadBitmapFromUrl}.<br/>
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
   * Gets face height.
   * @returns The result.
   */
  get faceHeight(): unknown;
  /**
   * Gets face width.
   * @returns The result.
   */
  get faceWidth(): unknown;
  /**
   * Gets face size.
   * @returns The result.
   */
  function getFaceSize(): unknown;
  /**
   * Gets icon size.
   * @returns The result.
   */
  function getIconSize(): unknown;
  /**
   * Gets icon height.
   * @returns The result.
   */
  get iconHeight(): unknown;
  /**
   * Gets icon width.
   * @returns The result.
   */
  get iconWidth(): unknown;
  /**
   * Determines whether big character.
   * @param filename The filename parameter.
   * @returns True if big character; false otherwise.
   */
  function isBigCharacter(filename: unknown): boolean;
  /**
   * Determines whether object character.
   * @param filename The filename parameter.
   * @returns True if object character; false otherwise.
   */
  function isObjectCharacter(filename: unknown): boolean;
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
  function isZeroParallax(filename: unknown): boolean;
  /**
   * Gets load animation.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function loadAnimation(filename: unknown): unknown;
  /**
   * Gets load battleback1.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function loadBattleback1(filename: unknown): unknown;
  /**
   * Gets load battleback2.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function loadBattleback2(filename: unknown): unknown;
  /**
   * Gets load bitmap.
   * @param folder The folder parameter.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function loadBitmap(folder: unknown, filename: unknown): unknown;
  /**
   * Gets load bitmap from url.
   * @param url The url parameter.
   * @returns The result.
   */
  function loadBitmapFromUrl(url: unknown): unknown;
  /**
   * Gets load character.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function loadCharacter(filename: unknown): unknown;
  /**
   * Gets load enemy.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function loadEnemy(filename: unknown): unknown;
  /**
   * Gets load face.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function loadFace(filename: unknown): unknown;
  /**
   * Gets load parallax.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function loadParallax(filename: unknown): unknown;
  /**
   * Gets load picture.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function loadPicture(filename: unknown): unknown;
  /**
   * Gets load sv actor.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function loadSvActor(filename: unknown): unknown;
  /**
   * Gets load sv enemy.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function loadSvEnemy(filename: unknown): unknown;
  /**
   * Gets load system.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function loadSystem(filename: unknown): unknown;
  /**
   * Gets load tileset.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function loadTileset(filename: unknown): unknown;
  /**
   * Gets load title1.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function loadTitle1(filename: unknown): unknown;
  /**
   * Gets load title2.
   * @param filename The filename parameter.
   * @returns The result.
   */
  function loadTitle2(filename: unknown): unknown;
  /**
   * Performs throw load error.
   * @param bitmap The bitmap parameter.
   */
  function throwLoadError(bitmap: unknown): void;
  /**
   * Engine static constant.
   */
  const standardFaceHeight: 144;
  /**
   * Engine static constant.
   */
  const standardFaceWidth: 144;
  /**
   * Engine static constant.
   */
  const standardIconHeight: 32;
  /**
   * Engine static constant.
   */
  const standardIconWidth: 32;
}
