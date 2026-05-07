/**
 * Generated from project/js/rmmz_core.js
 * Class: Weather
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Weather
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _dimmerSprite: ScreenSprite;
  _height: unknown;
  _rainBitmap: Bitmap;
  _snowBitmap: Bitmap;
  _sprites: unknown[];
  _stormBitmap: Bitmap;
  _width: unknown;
  _addSprite(): void;
  /**
   * Updates the weather for each frame.
   */
  _createBitmaps(): void;
  /**
   * Updates the weather for each frame.
   */
  _createDimmer(): void;
  _rebornSprite(sprite: Sprite): void;
  _removeSprite(): void;
  /**
   * Updates the weather for each frame.
   */
  _updateAllSprites(): void;
  /**
   * Updates the weather for each frame.
   */
  _updateDimmer(): void;
  _updateRainSprite(sprite: Sprite): void;
  _updateSnowSprite(sprite: Sprite): void;
  _updateSprite(sprite: Sprite): void;
  _updateStormSprite(sprite: Sprite): void;
  /**
   * Destroys the weather.
   */
  destroy(): void;
  /**
   * The weather effect which displays rain, storm, or snow.
   */
  initialize(): void;
  /**
   * Updates the weather for each frame.
   */
  update(): void;
}
