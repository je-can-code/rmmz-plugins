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
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `ScreenSprite`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Weather#_createDimmer}.<br/>
   * Read in: {@link Weather#_createDimmer}, {@link Weather#_updateDimmer}.<br/>
   */
  _dimmerSprite: ScreenSprite;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: {@link Weather#initialize}.<br/>
   * Written in: {@link Weather#initialize}.<br/>
   * Read in: none.<br/>
   */
  _height: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Bitmap`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Weather#_createBitmaps}.<br/>
   * Read in: {@link Weather#_createBitmaps}, {@link Weather#_updateRainSprite}, {@link Weather#destroy}.<br/>
   */
  _rainBitmap: Bitmap;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Bitmap`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Weather#_createBitmaps}.<br/>
   * Read in: {@link Weather#_createBitmaps}, {@link Weather#_updateSnowSprite}, {@link Weather#destroy}.<br/>
   */
  _snowBitmap: Bitmap;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: {@link Weather#initialize}.<br/>
   * Written in: {@link Weather#initialize}.<br/>
   * Read in: {@link Weather#_addSprite}, {@link Weather#_removeSprite}, {@link Weather#_updateAllSprites}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `.length`: {@link Weather#_updateAllSprites}.<br/>
   * - `pop()`: {@link Weather#_removeSprite}.<br/>
   * - `push()`: {@link Weather#_addSprite}.<br/>
   */
  _sprites: unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Bitmap`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Weather#_createBitmaps}.<br/>
   * Read in: {@link Weather#_createBitmaps}, {@link Weather#_updateStormSprite}, {@link Weather#destroy}.<br/>
   */
  _stormBitmap: Bitmap;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: {@link Weather#initialize}.<br/>
   * Written in: {@link Weather#initialize}.<br/>
   * Read in: none.<br/>
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
