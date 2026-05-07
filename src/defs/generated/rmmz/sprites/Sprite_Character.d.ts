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
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Sprite_Character#initMembers}.
   * Read in: none.
   */
  _balloonDuration: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown`.
   * Initialized in: none.
   * Written in: {@link Sprite_Character#updateOther}.
   * Read in: {@link Sprite_Character#updateCharacterFrame}, {@link Sprite_Character#updateHalfBodySprites}.
   */
  _bushDepth: unknown;
  /**
   * Inferred engine backing field.
   *
   * Type: `null | Game_Character`.
   * Initialized in: none.
   * Written in: {@link Sprite_Character#initMembers}, {@link Sprite_Character#setCharacter}.
   * Read in: {@link Sprite_Character#characterBlockX}, {@link Sprite_Character#characterBlockY}, {@link Sprite_Character#characterPatternX}, {@link Sprite_Character#characterPatternY}, {@link Sprite_Character#checkCharacter}, {@link Sprite_Character#isImageChanged}, {@link Sprite_Character#isObjectCharacter}, {@link Sprite_Character#isTile}, {@link Sprite_Character#updateBitmap}, {@link Sprite_Character#updateOther}, {@link Sprite_Character#updatePosition}, {@link Sprite_Character#updateVisibility}.
   */
  _character: null | Game_Character;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown`.
   * Initialized in: none.
   * Written in: {@link Sprite_Character#updateBitmap}.
   * Read in: {@link Sprite_Character#isImageChanged}.
   */
  _characterIndex: unknown;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown`.
   * Initialized in: none.
   * Written in: {@link Sprite_Character#updateBitmap}.
   * Read in: {@link Sprite_Character#isEmptyCharacter}, {@link Sprite_Character#isImageChanged}, {@link Sprite_Character#setCharacterBitmap}.
   */
  _characterName: unknown;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown`.
   * Initialized in: none.
   * Written in: {@link Sprite_Character#setCharacterBitmap}.
   * Read in: {@link Sprite_Character#characterBlockX}, {@link Sprite_Character#characterBlockY}, {@link Sprite_Character#patternHeight}, {@link Sprite_Character#patternWidth}.
   */
  _isBigCharacter: unknown;
  /**
   * Inferred engine backing field.
   *
   * Type: `null | Sprite`.
   * Initialized in: none.
   * Written in: {@link Sprite_Character#createHalfBodySprites}, {@link Sprite_Character#initMembers}.
   * Read in: {@link Sprite_Character#createHalfBodySprites}, {@link Sprite_Character#updateCharacterFrame}, {@link Sprite_Character#updateHalfBodySprites}.
   */
  _lowerBody: null | Sprite;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown`.
   * Initialized in: none.
   * Written in: {@link Sprite_Character#updateBitmap}.
   * Read in: {@link Sprite_Character#isEmptyCharacter}, {@link Sprite_Character#isImageChanged}, {@link Sprite_Character#patternHeight}, {@link Sprite_Character#patternWidth}, {@link Sprite_Character#setTileBitmap}, {@link Sprite_Character#updateBitmap}, {@link Sprite_Character#updateFrame}, {@link Sprite_Character#updateTileFrame}.
   */
  _tileId: unknown;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Sprite_Character#initMembers}, {@link Sprite_Character#updateBitmap}.
   * Read in: {@link Sprite_Character#isImageChanged}.
   */
  _tilesetId: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `null | Sprite`.
   * Initialized in: none.
   * Written in: {@link Sprite_Character#createHalfBodySprites}, {@link Sprite_Character#initMembers}.
   * Read in: {@link Sprite_Character#createHalfBodySprites}, {@link Sprite_Character#updateCharacterFrame}, {@link Sprite_Character#updateHalfBodySprites}.
   */
  _upperBody: null | Sprite;
  /**
   * Gets character block x.
   * @returns The result.
   */
  characterBlockX(): number;
  /**
   * Gets character block y.
   * @returns The result.
   */
  characterBlockY(): number;
  /**
   * Gets character pattern x.
   * @returns The result.
   */
  characterPatternX(): number;
  /**
   * Gets character pattern y.
   * @returns The result.
   */
  characterPatternY(): number;
  /**
   * Gets check character.
   * @param character The character parameter.
   * @returns The result.
   */
  checkCharacter(character: Game_Character): boolean;
  /**
   * Creates half body sprites.
   */
  createHalfBodySprites(): void;
  /**
   * Initializes members.
   */
  initMembers(): void;
  /**
   * Initializes initialize.
   * @param character The character parameter.
   */
  initialize(character: Game_Character): void;
  /**
   * Determines whether empty character.
   * @returns True if empty character; false otherwise.
   */
  isEmptyCharacter(): boolean;
  /**
   * Determines whether image changed.
   * @returns True if image changed; false otherwise.
   */
  isImageChanged(): boolean;
  /**
   * Determines whether object character.
   * @returns True if object character; false otherwise.
   */
  isObjectCharacter(): boolean;
  /**
   * Determines whether tile.
   * @returns True if tile; false otherwise.
   */
  isTile(): boolean;
  /**
   * Gets pattern height.
   * @returns The result.
   */
  patternHeight(): number;
  /**
   * Gets pattern width.
   * @returns The result.
   */
  patternWidth(): number;
  /**
   * Sets character.
   * @param character The character parameter.
   */
  setCharacter(character: Game_Character): void;
  /**
   * Sets character bitmap.
   */
  setCharacterBitmap(): void;
  /**
   * Sets tile bitmap.
   */
  setTileBitmap(): void;
  /**
   * Gets tileset bitmap.
   * @param tileId The tileId parameter.
   * @returns The result.
   */
  tilesetBitmap(tileId: number): Bitmap;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates bitmap.
   */
  updateBitmap(): void;
  /**
   * Updates character frame.
   */
  updateCharacterFrame(): void;
  /**
   * Updates frame.
   */
  updateFrame(): void;
  /**
   * Updates half body sprites.
   */
  updateHalfBodySprites(): void;
  /**
   * Updates other.
   */
  updateOther(): void;
  /**
   * Updates position.
   */
  updatePosition(): void;
  /**
   * Updates tile frame.
   */
  updateTileFrame(): void;
  /**
   * Updates visibility.
   */
  updateVisibility(): void;
}
