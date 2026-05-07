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
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _cache: object;
  _emptyBitmap: Bitmap;
  _system: object;
}
declare function ImageManager(): never;
declare namespace ImageManager
{
  function clear(): void;
  function getFaceSize(): number;
  function getIconSize(): number;
  function isBigCharacter(filename: string): boolean;
  function isObjectCharacter(filename: string): boolean;
  function isReady(): boolean;
  function isZeroParallax(filename: string): boolean;
  function loadAnimation(filename: string): Bitmap;
  function loadBattleback1(filename: string): Bitmap;
  function loadBattleback2(filename: string): Bitmap;
  function loadBitmap(folder: string, filename: string): Bitmap;
  function loadBitmapFromUrl(url: string): Bitmap;
  function loadCharacter(filename: string): Bitmap;
  function loadEnemy(filename: string): Bitmap;
  function loadFace(filename: string): Bitmap;
  function loadParallax(filename: string): Bitmap;
  function loadPicture(filename: string): Bitmap;
  function loadSvActor(filename: string): Bitmap;
  function loadSvEnemy(filename: string): Bitmap;
  function loadSystem(filename: string): Bitmap;
  function loadTileset(filename: string): Bitmap;
  function loadTitle1(filename: string): Bitmap;
  function loadTitle2(filename: string): Bitmap;
  function throwLoadError(bitmap: Bitmap): void;
  const standardFaceHeight: 144;
  const standardFaceWidth: 144;
  const standardIconHeight: 32;
  const standardIconWidth: 32;
}
