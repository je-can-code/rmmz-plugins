/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Spriteset_Map
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Spriteset_Map
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _balloonSprites: unknown[];
  _characterSprites: unknown[];
  _destinationSprite: Sprite_Destination;
  _effectsContainer: unknown;
  _parallax: TilingSprite;
  _parallaxName: unknown;
  _shadowSprite: Sprite;
  _tilemap: unknown;
  _tileset: unknown;
  _weather: Weather;
  animationBaseDelay(): number;
  createBalloon(request: object): void;
  createCharacters(): void;
  createDestination(): void;
  createLowerLayer(): void;
  createParallax(): void;
  createShadow(): void;
  createTilemap(): void;
  createWeather(): void;
  destroy(options: object): void;
  findTargetSprite(target: Game_Character): Sprite_Character | undefined;
  hideCharacters(): void;
  initialize(): void;
  loadSystemImages(): void;
  loadTileset(): void;
  processBalloonRequests(): void;
  removeAllBalloons(): void;
  removeBalloon(sprite: Sprite): void;
  update(): void;
  updateBalloons(): void;
  updateParallax(): void;
  updateShadow(): void;
  updateTilemap(): void;
  updateTileset(): void;
  updateWeather(): void;
}
