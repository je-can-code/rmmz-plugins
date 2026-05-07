/**
 * Generated from project/js/rmmz_core.js
 * Class: Weather
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Weather extends PIXI.Container
{
  /**
   * Inferred engine backing field.
   *
   * Type: `ScreenSprite`.
   * Initialized in: none.
   * Written in: {@link Weather#_createDimmer}.
   * Read in: {@link Weather#_createDimmer}, {@link Weather#_updateDimmer}.
   */
  _dimmerSprite: ScreenSprite;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown`.
   * Initialized in: {@link Weather#initialize}.
   * Written in: {@link Weather#initialize}.
   * Read in: none.
   */
  _height: unknown;
  /**
   * Inferred engine backing field.
   *
   * Type: `Bitmap`.
   * Initialized in: none.
   * Written in: {@link Weather#_createBitmaps}.
   * Read in: {@link Weather#_createBitmaps}, {@link Weather#_updateRainSprite}, {@link Weather#destroy}.
   */
  _rainBitmap: Bitmap;
  /**
   * Inferred engine backing field.
   *
   * Type: `Bitmap`.
   * Initialized in: none.
   * Written in: {@link Weather#_createBitmaps}.
   * Read in: {@link Weather#_createBitmaps}, {@link Weather#_updateSnowSprite}, {@link Weather#destroy}.
   */
  _snowBitmap: Bitmap;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown[]`.
   * Initialized in: {@link Weather#initialize}.
   * Written in: {@link Weather#initialize}.
   * Read in: {@link Weather#_addSprite}, {@link Weather#_removeSprite}, {@link Weather#_updateAllSprites}.
   *
   * Consumed by:
   * - `.length`: {@link Weather#_updateAllSprites}.
   * - `pop()`: {@link Weather#_removeSprite}.
   * - `push()`: {@link Weather#_addSprite}.
   */
  _sprites: unknown[];
  /**
   * Inferred engine backing field.
   *
   * Type: `Bitmap`.
   * Initialized in: none.
   * Written in: {@link Weather#_createBitmaps}.
   * Read in: {@link Weather#_createBitmaps}, {@link Weather#_updateStormSprite}, {@link Weather#destroy}.
   */
  _stormBitmap: Bitmap;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown`.
   * Initialized in: {@link Weather#initialize}.
   * Written in: {@link Weather#initialize}.
   * Read in: none.
   */
  _width: unknown;
  /**
   * Performs add sprite.
   */
  _addSprite(): void;
  /**
   * Updates the weather for each frame.
   */
  _createBitmaps(): void;
  /**
   * Updates the weather for each frame.
   */
  _createDimmer(): void;
  /**
   * Performs reborn sprite.
   * @param sprite The sprite parameter.
   */
  _rebornSprite(sprite: Sprite): void;
  /**
   * Performs remove sprite.
   */
  _removeSprite(): void;
  /**
   * Updates the weather for each frame.
   */
  _updateAllSprites(): void;
  /**
   * Updates the weather for each frame.
   */
  _updateDimmer(): void;
  /**
   * Performs update rain sprite.
   * @param sprite The sprite parameter.
   */
  _updateRainSprite(sprite: Sprite): void;
  /**
   * Performs update snow sprite.
   * @param sprite The sprite parameter.
   */
  _updateSnowSprite(sprite: Sprite): void;
  /**
   * Performs update sprite.
   * @param sprite The sprite parameter.
   */
  _updateSprite(sprite: Sprite): void;
  /**
   * Performs update storm sprite.
   * @param sprite The sprite parameter.
   */
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
