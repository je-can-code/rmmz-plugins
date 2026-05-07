/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_Character
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_Character
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _balloonDuration: number;
  _bushDepth: unknown;
  _character: null | Game_Character;
  _characterIndex: unknown;
  _characterName: unknown;
  _isBigCharacter: unknown;
  _lowerBody: null | Sprite;
  _tileId: unknown;
  _tilesetId: number;
  _upperBody: null | Sprite;
  characterBlockX(): number;
  characterBlockY(): number;
  characterPatternX(): number;
  characterPatternY(): number;
  checkCharacter(character: Game_Character): boolean;
  createHalfBodySprites(): void;
  initMembers(): void;
  initialize(character: Game_Character): void;
  isEmptyCharacter(): boolean;
  isImageChanged(): boolean;
  isObjectCharacter(): boolean;
  isTile(): boolean;
  patternHeight(): number;
  patternWidth(): number;
  setCharacter(character: Game_Character): void;
  setCharacterBitmap(): void;
  setTileBitmap(): void;
  tilesetBitmap(tileId: number): Bitmap;
  update(): void;
  updateBitmap(): void;
  updateCharacterFrame(): void;
  updateFrame(): void;
  updateHalfBodySprites(): void;
  updateOther(): void;
  updatePosition(): void;
  updateTileFrame(): void;
  updateVisibility(): void;
}
