/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_Character
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_Character extends Sprite
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Character#initMembers}.<br/>
   * Read in: none.<br/>
   */
  _balloonDuration: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Character#updateOther}.<br/>
   * Read in: {@link Sprite_Character#updateCharacterFrame}, {@link Sprite_Character#updateHalfBodySprites}.<br/>
   */
  _bushDepth: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Character#initMembers}, {@link Sprite_Character#setCharacter}.<br/>
   * Read in: {@link Sprite_Character#characterBlockX}, {@link Sprite_Character#characterBlockY}, {@link Sprite_Character#characterPatternX}, {@link Sprite_Character#characterPatternY}, {@link Sprite_Character#checkCharacter}, {@link Sprite_Character#isImageChanged}, {@link Sprite_Character#isObjectCharacter}, {@link Sprite_Character#isTile}, {@link Sprite_Character#updateBitmap}, {@link Sprite_Character#updateOther}, {@link Sprite_Character#updatePosition}, {@link Sprite_Character#updateVisibility}.<br/>
   */
  _character: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Character#updateBitmap}.<br/>
   * Read in: {@link Sprite_Character#isImageChanged}.<br/>
   */
  _characterIndex: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Character#updateBitmap}.<br/>
   * Read in: {@link Sprite_Character#isEmptyCharacter}, {@link Sprite_Character#isImageChanged}, {@link Sprite_Character#setCharacterBitmap}.<br/>
   */
  _characterName: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Character#setCharacterBitmap}.<br/>
   * Read in: {@link Sprite_Character#characterBlockX}, {@link Sprite_Character#characterBlockY}, {@link Sprite_Character#patternHeight}, {@link Sprite_Character#patternWidth}.<br/>
   */
  _isBigCharacter: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | Sprite`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Character#createHalfBodySprites}, {@link Sprite_Character#initMembers}.<br/>
   * Read in: {@link Sprite_Character#createHalfBodySprites}, {@link Sprite_Character#updateCharacterFrame}, {@link Sprite_Character#updateHalfBodySprites}.<br/>
   */
  _lowerBody: null | Sprite;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Character#updateBitmap}.<br/>
   * Read in: {@link Sprite_Character#isEmptyCharacter}, {@link Sprite_Character#isImageChanged}, {@link Sprite_Character#patternHeight}, {@link Sprite_Character#patternWidth}, {@link Sprite_Character#setTileBitmap}, {@link Sprite_Character#updateBitmap}, {@link Sprite_Character#updateFrame}, {@link Sprite_Character#updateTileFrame}.<br/>
   */
  _tileId: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Character#initMembers}, {@link Sprite_Character#updateBitmap}.<br/>
   * Read in: {@link Sprite_Character#isImageChanged}.<br/>
   */
  _tilesetId: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | Sprite`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Character#createHalfBodySprites}, {@link Sprite_Character#initMembers}.<br/>
   * Read in: {@link Sprite_Character#createHalfBodySprites}, {@link Sprite_Character#updateCharacterFrame}, {@link Sprite_Character#updateHalfBodySprites}.<br/>
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
  characterPatternX(): unknown;
  /**
   * Gets character pattern y.
   * @returns The result.
   */
  characterPatternY(): unknown;
  /**
   * Gets check character.
   * @param character The character parameter.
   * @returns The result.
   */
  checkCharacter(character: unknown): boolean;
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
  initialize(character: unknown): void;
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
  patternHeight(): unknown;
  /**
   * Gets pattern width.
   * @returns The result.
   */
  patternWidth(): unknown;
  /**
   * Sets character.
   * @param character The character parameter.
   */
  setCharacter(character: unknown): void;
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
  tilesetBitmap(tileId: unknown): unknown;
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
