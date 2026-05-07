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
   * Inferred engine backing field.
   *
   * Type: `unknown[]`.
   * Initialized in: {@link Spriteset_Map#initialize}.
   * Written in: {@link Spriteset_Map#initialize}.
   * Read in: {@link Spriteset_Map#createBalloon}, {@link Spriteset_Map#removeAllBalloons}, {@link Spriteset_Map#removeBalloon}, {@link Spriteset_Map#updateBalloons}.
   *
   * Consumed by:
   * - `push()`: {@link Spriteset_Map#createBalloon}.
   */
  _balloonSprites: unknown[];
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown[]`.
   * Initialized in: none.
   * Written in: {@link Spriteset_Map#createCharacters}.
   * Read in: {@link Spriteset_Map#createCharacters}, {@link Spriteset_Map#findTargetSprite}, {@link Spriteset_Map#hideCharacters}.
   *
   * Consumed by:
   * - `push()`: {@link Spriteset_Map#createCharacters}.
   */
  _characterSprites: unknown[];
  /**
   * Inferred engine backing field.
   *
   * Type: `Sprite_Destination`.
   * Initialized in: none.
   * Written in: {@link Spriteset_Map#createDestination}.
   * Read in: {@link Spriteset_Map#createDestination}.
   */
  _destinationSprite: Sprite_Destination;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown`.
   * Initialized in: none.
   * Written in: {@link Spriteset_Map#createTilemap}.
   * Read in: {@link Spriteset_Map#createBalloon}, {@link Spriteset_Map#removeBalloon}.
   */
  _effectsContainer: unknown;
  /**
   * Inferred engine backing field.
   *
   * Type: `TilingSprite`.
   * Initialized in: none.
   * Written in: {@link Spriteset_Map#createParallax}.
   * Read in: {@link Spriteset_Map#createParallax}, {@link Spriteset_Map#updateParallax}.
   */
  _parallax: TilingSprite;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown`.
   * Initialized in: none.
   * Written in: {@link Spriteset_Map#updateParallax}.
   * Read in: {@link Spriteset_Map#updateParallax}.
   */
  _parallaxName: unknown;
  /**
   * Inferred engine backing field.
   *
   * Type: `Sprite`.
   * Initialized in: none.
   * Written in: {@link Spriteset_Map#createShadow}.
   * Read in: {@link Spriteset_Map#createShadow}, {@link Spriteset_Map#updateShadow}.
   */
  _shadowSprite: Sprite;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown`.
   * Initialized in: none.
   * Written in: {@link Spriteset_Map#createTilemap}.
   * Read in: {@link Spriteset_Map#createCharacters}, {@link Spriteset_Map#createDestination}, {@link Spriteset_Map#createShadow}, {@link Spriteset_Map#loadTileset}, {@link Spriteset_Map#updateTilemap}.
   */
  _tilemap: unknown;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown`.
   * Initialized in: none.
   * Written in: {@link Spriteset_Map#loadTileset}.
   * Read in: {@link Spriteset_Map#loadTileset}, {@link Spriteset_Map#updateTileset}.
   */
  _tileset: unknown;
  /**
   * Inferred engine backing field.
   *
   * Type: `Weather`.
   * Initialized in: none.
   * Written in: {@link Spriteset_Map#createWeather}.
   * Read in: {@link Spriteset_Map#createWeather}, {@link Spriteset_Map#updateWeather}.
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
  createBalloon(request: object): void;
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
  destroy(options: object): void;
  /**
   * Gets find target sprite.
   * @param target The target parameter.
   * @returns The result.
   */
  findTargetSprite(target: Game_Character): Sprite_Character | undefined;
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
  removeBalloon(sprite: Sprite): void;
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
