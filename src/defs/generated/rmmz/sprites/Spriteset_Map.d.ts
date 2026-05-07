/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Spriteset_Map
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Spriteset_Map extends Spriteset_Base
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: {@link Spriteset_Map#initialize}.<br/>
   * Written in: {@link Spriteset_Map#initialize}.<br/>
   * Read in: {@link Spriteset_Map#createBalloon}, {@link Spriteset_Map#removeAllBalloons}, {@link Spriteset_Map#removeBalloon}, {@link Spriteset_Map#updateBalloons}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `push()`: {@link Spriteset_Map#createBalloon}.<br/>
   */
  _balloonSprites: unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Spriteset_Map#createCharacters}.<br/>
   * Read in: {@link Spriteset_Map#createCharacters}, {@link Spriteset_Map#findTargetSprite}, {@link Spriteset_Map#hideCharacters}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `push()`: {@link Spriteset_Map#createCharacters}.<br/>
   */
  _characterSprites: unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Sprite_Destination`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Spriteset_Map#createDestination}.<br/>
   * Read in: {@link Spriteset_Map#createDestination}.<br/>
   */
  _destinationSprite: Sprite_Destination;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Spriteset_Map#createTilemap}.<br/>
   * Read in: {@link Spriteset_Map#createBalloon}, {@link Spriteset_Map#removeBalloon}.<br/>
   */
  _effectsContainer: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `TilingSprite`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Spriteset_Map#createParallax}.<br/>
   * Read in: {@link Spriteset_Map#createParallax}, {@link Spriteset_Map#updateParallax}.<br/>
   */
  _parallax: TilingSprite;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Spriteset_Map#updateParallax}.<br/>
   * Read in: {@link Spriteset_Map#updateParallax}.<br/>
   */
  _parallaxName: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Sprite`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Spriteset_Map#createShadow}.<br/>
   * Read in: {@link Spriteset_Map#createShadow}, {@link Spriteset_Map#updateShadow}.<br/>
   */
  _shadowSprite: Sprite;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Spriteset_Map#createTilemap}.<br/>
   * Read in: {@link Spriteset_Map#createCharacters}, {@link Spriteset_Map#createDestination}, {@link Spriteset_Map#createShadow}, {@link Spriteset_Map#loadTileset}, {@link Spriteset_Map#updateTilemap}.<br/>
   */
  _tilemap: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Spriteset_Map#loadTileset}.<br/>
   * Read in: {@link Spriteset_Map#loadTileset}, {@link Spriteset_Map#updateTileset}.<br/>
   */
  _tileset: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Weather`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Spriteset_Map#createWeather}.<br/>
   * Read in: {@link Spriteset_Map#createWeather}, {@link Spriteset_Map#updateWeather}.<br/>
   */
  _weather: Weather;
  /**
   * Gets animation base delay.
   * @returns The result.
   */
  animationBaseDelay(): number;
  /**
   * Creates balloon.
   * @param request The request parameter.
   */
  createBalloon(request: unknown): void;
  /**
   * Creates characters.
   */
  createCharacters(): void;
  /**
   * Creates destination.
   */
  createDestination(): void;
  /**
   * Creates lower layer.
   */
  createLowerLayer(): void;
  /**
   * Creates parallax.
   */
  createParallax(): void;
  /**
   * Creates shadow.
   */
  createShadow(): void;
  /**
   * Creates tilemap.
   */
  createTilemap(): void;
  /**
   * Creates weather.
   */
  createWeather(): void;
  /**
   * Performs destroy.
   * @param options The options parameter.
   */
  destroy(options: unknown): void;
  /**
   * Gets find target sprite.
   * @param target The target parameter.
   * @returns The result.
   */
  findTargetSprite(target: unknown): unknown;
  /**
   * Performs hide characters.
   */
  hideCharacters(): void;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Performs load system images.
   */
  loadSystemImages(): void;
  /**
   * Performs load tileset.
   */
  loadTileset(): void;
  /**
   * Performs process balloon requests.
   */
  processBalloonRequests(): void;
  /**
   * Removes all balloons.
   */
  removeAllBalloons(): void;
  /**
   * Removes balloon.
   * @param sprite The sprite parameter.
   */
  removeBalloon(sprite: unknown): void;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates balloons.
   */
  updateBalloons(): void;
  /**
   * Updates parallax.
   */
  updateParallax(): void;
  /**
   * Updates shadow.
   */
  updateShadow(): void;
  /**
   * Updates tilemap.
   */
  updateTilemap(): void;
  /**
   * Updates tileset.
   */
  updateTileset(): void;
  /**
   * Updates weather.
   */
  updateWeather(): void;
}
